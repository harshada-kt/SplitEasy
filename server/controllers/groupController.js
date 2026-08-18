const pool = require("../config/db");

// POST /api/groups
// Creates a new group and automatically adds the creator as a member
async function createGroup(req, res) {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    const groupResult = await pool.query(
      `INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *`,
      [name.trim(), userId]
    );
    const group = groupResult.rows[0];

    // Creator automatically becomes a member
    await pool.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
      [group.id, userId]
    );

    res.status(201).json({ group });
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ error: "Something went wrong creating the group" });
  }
}

// GET /api/groups
// Lists all groups the logged-in user is a member of
async function getMyGroups(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT g.*
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [userId]
    );

    res.json({ groups: result.rows });
  } catch (err) {
    console.error("Get groups error:", err);
    res.status(500).json({ error: "Something went wrong fetching groups" });
  }
}

// GET /api/groups/:groupId
// Get details of one group, including its members
async function getGroupById(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Confirm the requester is actually a member of this group
    const membership = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const groupResult = await pool.query(`SELECT * FROM groups WHERE id = $1`, [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [groupId]
    );

    res.json({ group: groupResult.rows[0], members: membersResult.rows });
  } catch (err) {
    console.error("Get group error:", err);
    res.status(500).json({ error: "Something went wrong fetching the group" });
  }
}

// POST /api/groups/:groupId/members
// Add a member to a group by their email (they must already have an account)
async function addMember(req, res) {
  try {
    const { groupId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Confirm requester is a member of the group before letting them add others
    const membership = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const userResult = await pool.query(`SELECT id, name, email FROM users WHERE email = $1`, [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "No account found with that email. They need to sign up first." });
    }
    const newMember = userResult.rows[0];

    const existing = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, newMember.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "This user is already in the group" });
    }

    await pool.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
      [groupId, newMember.id]
    );

    res.status(201).json({ member: newMember });
  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ error: "Something went wrong adding the member" });
  }
}

module.exports = { createGroup, getMyGroups, getGroupById, addMember };
