const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");

const { createGroup, getMyGroups, getGroupById, addMember } = require("../controllers/groupController");
const { addExpense, getExpenses, getBalances, getSettleUp } = require("../controllers/expenseController");

// All group routes require the user to be logged in
router.use(requireAuth);

router.post("/", createGroup);
router.get("/", getMyGroups);
router.get("/:groupId", getGroupById);
router.post("/:groupId/members", addMember);

router.post("/:groupId/expenses", addExpense);
router.get("/:groupId/expenses", getExpenses);
router.get("/:groupId/balances", getBalances);
router.get("/:groupId/settle-up", getSettleUp);

module.exports = router;
