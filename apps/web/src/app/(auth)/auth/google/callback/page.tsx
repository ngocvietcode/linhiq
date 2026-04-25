"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const handledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const token = params.get("token");
    const err = params.get("error");

    if (err) {
      setError(err);
      return;
    }

    if (!token) {
      setError("missing_token");
      return;
    }

    localStorage.setItem("linhiq_token", token);
    // Hard reload so AuthProvider re-reads the token from localStorage on mount
    window.location.replace("/dashboard");
  }, [params, router]);

  if (error) {
    return (
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--color-danger-dim)", border: "1px solid rgba(244,91,105,0.25)" }}
        >
          <AlertTriangle size={20} style={{ color: "var(--color-danger)" }} />
        </div>
        <h1 className="text-lg font-semibold mb-1">Đăng nhập Google thất bại</h1>
        <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
          {error === "missing_token"
            ? "Không nhận được token từ Google. Vui lòng thử lại."
            : `Lỗi: ${error}`}
        </p>
        <Link href="/login" className="btn-primary text-sm">
          Về trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <Loader2
        size={28}
        className="animate-spin mx-auto mb-4"
        style={{ color: "var(--color-accent)" }}
      />
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Đang đăng nhập bằng Google...
      </p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-4">
          <Loader2
            size={28}
            className="animate-spin mx-auto mb-4"
            style={{ color: "var(--color-accent)" }}
          />
        </div>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
