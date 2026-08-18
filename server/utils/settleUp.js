// Debt-simplification algorithm.
//
// Given each person's net balance (positive = owed money, negative = owes money),
// this computes the MINIMUM number of payments needed to settle everyone up.
//
// Approach: greedy matching.
// Repeatedly take the person who is owed the MOST and the person who owes the MOST,
// settle as much as possible between them, then repeat with whoever still has a
// nonzero balance. This is a well-known greedy strategy for this problem and performs
// close to optimal in practice (the exact optimal is NP-hard for large groups, but
// greedy is what's used in most real expense-splitting apps like Splitwise).
//
// Input:  balances = [{ userId, name, balance }]   (balance can be 0, positive, or negative)
// Output: [{ from, fromName, to, toName, amount }]  (from pays to)

function simplifyDebts(balances) {
  // Round to 2 decimals and ignore anyone who's already settled (balance ~ 0)
  const EPSILON = 0.01;

  const creditors = balances
    .filter((b) => b.balance > EPSILON)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance); // largest owed first

  const debtors = balances
    .filter((b) => b.balance < -EPSILON)
    .map((b) => ({ ...b, balance: Math.abs(b.balance) })) // work with positive "owes" amount
    .sort((a, b) => b.balance - a.balance); // largest debt first

  const transactions = [];

  let i = 0; // pointer into creditors
  let j = 0; // pointer into debtors

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // The amount that can be settled between this pair is whichever is smaller
    const settledAmount = Math.min(creditor.balance, debtor.balance);

    if (settledAmount > EPSILON) {
      transactions.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: Number(settledAmount.toFixed(2)),
      });
    }

    creditor.balance -= settledAmount;
    debtor.balance -= settledAmount;

    // Move to the next creditor/debtor once their balance is fully settled
    if (creditor.balance <= EPSILON) i++;
    if (debtor.balance <= EPSILON) j++;
  }

  return transactions;
}

module.exports = { simplifyDebts };
