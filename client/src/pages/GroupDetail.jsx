import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";
import SettleUpCard from "../components/SettleUpCard";

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add expense form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Add member form state
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  async function loadAll() {
    setLoading(true);
    const [groupRes, expensesRes, balancesRes, settleRes] = await Promise.all([
      api.get(`/groups/${groupId}`),
      api.get(`/groups/${groupId}/expenses`),
      api.get(`/groups/${groupId}/balances`),
      api.get(`/groups/${groupId}/settle-up`),
    ]);
    setGroup(groupRes.data.group);
    setMembers(groupRes.data.members);
    setExpenses(expensesRes.data.expenses);
    setBalances(balancesRes.data.balances);
    setTransactions(settleRes.data.transactions);
    setPaidBy((prev) => prev || String(groupRes.data.members[0]?.id || ""));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!description.trim() || !amount || !paidBy) return;
    setSubmitting(true);
    try {
      await api.post(`/groups/${groupId}/expenses`, {
        description: description.trim(),
        amount: Number(amount),
        paidBy: Number(paidBy),
        splitType: "equal",
      });
      setDescription("");
      setAmount("");
      await loadAll();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setAddingMember(true);
    setMemberError("");
    try {
      await api.post(`/groups/${groupId}/members`, { email: memberEmail.trim() });
      setMemberEmail("");
      await loadAll();
    } catch (err) {
      setMemberError(err.response?.data?.error || "Could not add that member");
    } finally {
      setAddingMember(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-lavender flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading group...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender">
      <header className="bg-plum text-white px-6 py-4">
        <Link to="/dashboard" className="text-sm text-white/60 hover:text-white">
          &larr; Back to groups
        </Link>
        <h1 className="font-display font-bold text-xl mt-1">{group?.name}</h1>
        <p className="text-xs text-white/50 mt-0.5">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Settle up — the signature feature */}
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-3">Settle up</h2>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <p className="text-sm text-gray-500">Everyone's settled up. Nothing to pay.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((t, i) => (
                <SettleUpCard key={i} transaction={t} />
              ))}
            </div>
          )}
        </section>

        {/* Balances */}
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-3">Balances</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
            {balances.map((b) => (
              <div key={b.userId} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-medium text-ink">{b.name}</span>
                <span
                  className={`text-sm font-semibold ${
                    b.balance > 0 ? "text-owed" : b.balance < 0 ? "text-owe" : "text-gray-400"
                  }`}
                >
                  {b.balance > 0 && `is owed ₹${b.balance}`}
                  {b.balance < 0 && `owes ₹${Math.abs(b.balance)}`}
                  {b.balance === 0 && "settled up"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Add expense */}
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-3">Add an expense</h2>
          <form onSubmit={handleAddExpense} className="bg-white rounded-2xl border border-gray-100 p-5">
            <Input
              label="What was it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner, hotel, cab..."
              required
            />
            <Input
              label="Amount (₹)"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              required
            />
            <label className="block mb-4">
              <span className="block text-sm font-medium text-ink mb-1.5">Paid by</span>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white
                           focus:border-amethyst focus:ring-1 focus:ring-amethyst outline-none text-sm"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-gray-400 mb-4">Split equally among all {members.length} members.</p>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Adding..." : "Add expense"}
            </Button>
          </form>
        </section>

        {/* Expense history */}
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-3">Expense history</h2>
          {expenses.length === 0 ? (
            <p className="text-sm text-gray-400">No expenses added yet.</p>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{e.description}</p>
                    <p className="text-xs text-gray-400">Paid by {e.paid_by_name}</p>
                  </div>
                  <span className="text-sm font-semibold text-ink">₹{e.amount}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add member */}
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-3">Add a member</h2>
          <form onSubmit={handleAddMember} className="bg-white rounded-2xl border border-gray-100 p-5">
            {memberError && (
              <div className="bg-owe/10 text-owe text-sm rounded-xl px-4 py-2.5 mb-4">
                {memberError}
              </div>
            )}
            <Input
              label="Member's email"
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="They must already have a SplitEasy account"
              required
            />
            <Button type="submit" disabled={addingMember} className="w-full">
              {addingMember ? "Adding..." : "Add member"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
