import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-surface-1)" }}
    >
      {/* Nav bar */}
      <header
        className="relative z-10 px-6 py-5 flex items-center justify-between border-b"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight"
          style={{ textDecoration: "none" }}
        >
          <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent)" }}>Linh</span>
          <span style={{ color: "var(--color-text-heading)" }}>IQ</span>
        </Link>
        <span className="text-sm hidden sm:block" style={{ color: "var(--color-text-muted)" }}>
          AI Tutor for International &amp; Vietnamese Programs
        </span>
      </header>

      {/* Center content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Card wrapper */}
          <div
            className="rounded-xl border p-8"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border-default)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-4 text-center text-xs border-t"
        style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-muted)" }}
      >
        Aligned with Cambridge IGCSE, A-Level, IB, AP &amp; Vietnamese curricula
      </footer>
    </div>
  );
}
