const pool = require("../config/db");
const { simplifyDebts } = require("../utils/settleUp");

// Helper: confirm a user belongs to a group before letting them touch it
async function assertMember(groupId, userId) {
  const result = await pool.query(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
  return result.rows.length > 0;
}

// Helper: compute each member's net balance for a group.
// Shared by both getBalances (raw numbers) and getSettleUp (simplified payments).
async function calculateBalances(groupId) {
  const paidResult = await pool.query(
    `SELECT paid_by AS user_id, COALESCE(SUM(amount), 0) AS total_paid
     FROM expenses
     WHERE group_id = $1
     GROUP BY paid_by`,
    [groupId]
  );

  const owedResult = await pool.query(
    `SELECT es.user_id, COALESCE(SUM(es.share_amount), 0) AS total_owed
     FROM expense_splits es
     JOIN expenses e ON e.id = es.expense_id
     WHERE e.group_id = $1
     GROUP BY es.user_id`,
    [groupId]
  );

  const membersResult = await pool.query(
    `SELECT u.id, u.name
     FROM users u
     JOIN group_members gm ON gm.user_id = u.id
     WHERE gm.group_id = $1`,
    [groupId]
  );

  const paidMap = Object.fromEntries(paidResult.rows.map((r) => [r.user_id, Number(r.total_paid)]));
  const owedMap = Object.fromEntries(owedResult.rows.map((r) => [r.user_id, Number(r.total_owed)]));

  return membersResult.rows.map((m) => {
    const paid = paidMap[m.id] || 0;
    const owed = owedMap[m.id] || 0;
    return {
      userId: m.id,
      name: m.name,
      paid: Number(paid.toFixed(2)),
      owed: Number(owed.toFixed(2)),
      balance: Number((paid - owed).toFixed(2)),
    };
  });
}

// POST /api/groups/:groupId/expenses
// Body: { description, amount, paidBy, splitType: "equal" | "custom", splits: [{userId, amount}] }
async function addExpense(req, res) {
  const client = await pool.connect();
  try {
    const { groupId } = req.params;
    const { description, amount, paidBy, splitType, splits } = req.body;
    const userId = req.user.id;

    if (!(await assertMember(groupId, userId))) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    if (!description || !amount || amount <= 0 || !paidBy) {
      return res.status(400).json({ error: "description, amount, and paidBy are required" });
    }

    // Get all group members - needed for equal split, and to validate custom split
    const membersResult = await client.query(
      `SELECT user_id FROM group_members WHERE group_id = $1`,
      [groupId]
    );
    const memberIds = membersResult.rows.map((r) => r.user_id);

    let finalSplits = [];

    if (splitType === "custom") {
      if (!Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({ error: "Custom split requires a splits array" });
      }
      const totalSplit = splits.reduce((sum, s) => sum + Number(s.amount), 0);
      // Allow tiny floating point rounding differences (1 cent tolerance)
      if (Math.abs(totalSplit - Number(amount)) > 0.01) {
        return res.status(400).json({
          error: `Custom split amounts (${totalSplit}) must add up to the total expense amount (${amount})`,
        });
      }
      finalSplits = splits.map((s) => ({ userId: s.userId, amount: Number(s.amount) }));
    } else {
      // Default: equal split among all current group members
      const share = Number(amount) / memberIds.length;
      finalSplits = memberIds.map((id) => ({ userId: id, amount: share }));
    }

    await client.query("BEGIN");

    const expenseResult = await client.query(
      `INSERT INTO expenses (group_id, paid_by, description, amount)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [groupId, paidBy, description.trim(), amount]
    );
    const expense = expenseResult.rows[0];

    for (const split of finalSplits) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, share_amount)
         VALUES ($1, $2, $3)`,
        [expense.id, split.userId, split.amount]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({ expense, splits: finalSplits });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add expense error:", err);
    res.status(500).json({ error: "Something went wrong adding the expense" });
  } finally {
    client.release();
  }
}

// GET /api/groups/:groupId/expenses
async function getExpenses(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await assertMember(groupId, userId))) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const expensesResult = await pool.query(
      `SELECT e.*, u.name AS paid_by_name
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [groupId]
    );

    res.json({ expenses: expensesResult.rows });
  } catch (err) {
    console.error("Get expenses error:", err);
    res.status(500).json({ error: "Something went wrong fetching expenses" });
  }
}

// GET /api/groups/:groupId/balances
// Calculates net balance per user: positive = they are owed money, negative = they owe money
async function getBalances(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await assertMember(groupId, userId))) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const balances = await calculateBalances(groupId);
    res.json({ balances });
  } catch (err) {
    console.error("Get balances error:", err);
    res.status(500).json({ error: "Something went wrong calculating balances" });
  }
}

// GET /api/groups/:groupId/settle-up
// Returns the minimum set of payments needed to settle all debts in the group.
// This is the "standout" feature: instead of showing raw balances, it tells you
// exactly who should pay whom, and how much, to clear everything with the fewest transactions.
async function getSettleUp(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await assertMember(groupId, userId))) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const balances = await calculateBalances(groupId);
    const transactions = simplifyDebts(balances);

    res.json({
      transactionCount: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error("Settle up error:", err);
    res.status(500).json({ error: "Something went wrong calculating settle-up" });
  }
}

module.exports = { addExpense, getExpenses, getBalances, getSettleUp };
