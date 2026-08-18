import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong logging in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-lavender flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-8">
        <h1 className="font-display text-2xl font-bold text-plum mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Log in to see who owes what.</p>

        {error && (
          <div className="bg-owe/10 text-owe text-sm rounded-xl px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button type="submit" className="w-full mt-2" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          New here?{" "}
          <Link to="/signup" className="text-amethyst font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
