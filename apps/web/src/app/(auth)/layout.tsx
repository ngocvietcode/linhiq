import { AuthProvider } from "@/lib/auth-context";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--color-void)" }}
      >
        {/* Decorative background gradient */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12), transparent)",
          }}
        />

        {/* Nav bar */}
        <header className="relative z-10 px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ
          </Link>
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            AI Tutor for Cambridge IGCSE &amp; A-Level
          </span>
        </header>

        {/* Center content */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
