import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadGroups() {
    setLoading(true);
    const res = await api.get("/groups");
    setGroups(res.data.groups);
    setLoading(false);
  }

  useEffect(() => {
    loadGroups();
  }, []);

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      await api.post("/groups", { name: newGroupName.trim() });
      setNewGroupName("");
      await loadGroups();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-lavender">
      {/* Top bar */}
      <header className="bg-plum text-white px-6 py-4 flex items-center justify-between">
        <h1 className="font-display font-bold text-lg">SplitEasy</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70">Hi, {user?.name?.split(" ")[0]}</span>
          <button onClick={logout} className="text-sm text-white/70 hover:text-white">
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="font-display text-2xl font-bold text-ink mb-6">Your groups</h2>

        {/* Create group form */}
        <form onSubmit={handleCreateGroup} className="flex gap-3 mb-8">
          <div className="flex-1">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name, e.g. Goa Trip"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white
                         focus:border-amethyst focus:ring-1 focus:ring-amethyst outline-none text-sm"
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create group"}
          </Button>
        </form>

        {/* Groups list */}
        {loading ? (
          <p className="text-sm text-gray-400">Loading your groups...</p>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-ink font-medium mb-1">No groups yet</p>
            <p className="text-sm text-gray-500">Create your first group above to start splitting expenses.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="block bg-white rounded-2xl p-5 border border-gray-100 hover:border-amethyst transition-colors"
              >
                <p className="font-display font-semibold text-ink">{group.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
