import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-void)" }}
    >
      {/* Subtle warm gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -10%, rgba(218,119,86,0.08), transparent)",
        }}
      />

      {/* Nav bar */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          <span style={{ color: "var(--color-accent)" }}>Linh</span>IQ
        </Link>
        <span className="text-sm hidden sm:block" style={{ color: "var(--color-text-muted)" }}>
          AI Tutor for International &amp; Vietnamese Programs
        </span>
      </header>

      {/* Center content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
