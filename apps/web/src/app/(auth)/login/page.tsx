"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

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
    <div className="w-full max-w-[400px] mx-auto">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">L</div>
          <span className="font-semibold text-lg text-text-primary tracking-tight">LinhIQ</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-2">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger/10 text-danger border border-danger/30 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary px-1">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 bg-bg-surface"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary px-1">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-bg-surface pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end pt-1">
            <button type="button" className="text-[13px] font-medium text-text-muted hover:text-text-primary transition-colors">
              Forgot password?
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-[15px]" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <ArrowRight className="w-4 h-4 ml-2 opacity-70" />}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-bg-void px-3 text-text-muted">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" className="w-full h-11 bg-bg-surface" type="button">
            Google
          </Button>
          <Button variant="secondary" className="w-full h-11 bg-bg-surface" type="button">
            Apple
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center space-y-3">
        <p className="text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent font-medium hover:underline">
            Create one →
          </Link>
        </p>
        <p className="text-sm text-text-secondary">
          Are you a parent?{" "}
          <button className="text-accent font-medium hover:underline focus:outline-none">
            Parent sign in →
          </button>
        </p>
      </div>
    </div>
  );
}
