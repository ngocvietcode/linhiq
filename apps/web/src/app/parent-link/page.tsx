"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ArrowLeft, AlertCircle, CheckCircle2, Link as LinkIcon } from "lucide-react";

export default function ChildRedeemPage() {
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await api("/me/parent-link/redeem", {
        token,
        method: "POST",
        body: { code: code.trim() },
      });
      setSuccess(true);
      setCode("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể liên kết");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
  }

  return (
    <AppShell maxWidth="max-w-md">
      <div className="py-8">
        <Link
          href="/dashboard"
          className="text-sm flex items-center gap-1.5 mb-6"
          style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}
        >
          <ArrowLeft size={14} /> Quay lại Dashboard
        </Link>

        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border-subtle)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon size={20} style={{ color: "var(--color-accent)" }} />
            <h1 className="text-xl font-bold">Liên kết phụ huynh</h1>
          </div>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
            Phụ huynh sẽ đưa bạn mã 6 chữ số. Nhập vào dưới để liên kết tài khoản.
          </p>

          {success ? (
            <div
              className="rounded-xl p-5 text-center"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              <CheckCircle2
                size={32}
                style={{ color: "var(--color-success)", margin: "0 auto" }}
              />
              <p className="text-sm font-semibold mt-3" style={{ color: "var(--color-text-primary)" }}>
                Liên kết thành công!
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                Phụ huynh giờ có thể xem báo cáo học tập của bạn.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 text-sm px-4 py-1.5 rounded-full"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                Nhập mã khác
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide block mb-2" style={{ color: "var(--color-text-muted)" }}>
                  Mã liên kết (6 chữ số)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-center font-mono text-2xl tracking-[0.4em]"
                  style={{
                    background: "var(--color-surface-1)",
                    borderColor: "var(--color-border-default)",
                    color: "var(--color-text-primary)",
                  }}
                  placeholder="000000"
                  autoFocus
                />
              </div>

              {error && (
                <div
                  className="rounded-lg p-3 flex items-start gap-2 text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", color: "var(--color-danger)" }}
                >
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="w-full px-4 py-2.5 rounded-full text-sm font-medium transition-opacity"
                style={{
                  background: "var(--color-accent)",
                  color: "#fff",
                  opacity: submitting || code.length !== 6 ? 0.5 : 1,
                  cursor: submitting || code.length !== 6 ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Đang xác nhận..." : "Xác nhận liên kết"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
