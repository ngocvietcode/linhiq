"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password, name);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-bg-card rounded-xl p-6 shadow-lg border border-border space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">
          Create your account
        </h2>
        <p className="text-sm text-text-secondary">
          Start learning with your personal AI tutor
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg-primary border border-border rounded-lg
                       text-text-primary placeholder:text-text-muted
                       focus:border-accent focus:ring-1 focus:ring-accent
                       transition-colors"
            placeholder="Alex Nguyen"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg-primary border border-border rounded-lg
                       text-text-primary placeholder:text-text-muted
                       focus:border-accent focus:ring-1 focus:ring-accent
                       transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg-primary border border-border rounded-lg
                       text-text-primary placeholder:text-text-muted
                       focus:border-accent focus:ring-1 focus:ring-accent
                       transition-colors"
            placeholder="Min. 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-white font-medium
                     rounded-lg transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </div>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
