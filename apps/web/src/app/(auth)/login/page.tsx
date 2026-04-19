"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Continue your learning journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(244,63,94,0.08)",
              border: "1px solid rgba(244,63,94,0.25)",
              color: "var(--color-danger)",
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs hover:underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight size={14} />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px" style={{ background: "var(--color-border-subtle)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            or continue with
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--color-border-subtle)" }} />
        </div>

        {/* Social (placeholder) */}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn-ghost text-sm justify-center py-2.5">
            🟢 Google
          </button>
          <button type="button" className="btn-ghost text-sm justify-center py-2.5">
            🍎 Apple
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-2 text-center">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium hover:underline" style={{ color: "var(--color-accent)" }}>
            Create one →
          </Link>
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Are you a parent?{" "}
          <Link href="/parent/login" className="font-medium hover:underline" style={{ color: "var(--color-text-hint)" }}>
            Parent sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
