import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Navigation */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <h1 className="text-xl font-bold">
          <span className="text-accent">Linh</span>IQ
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="text-sm bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg 
                       transition-all duration-200 font-medium"
          >
            Start Free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
            Your Personal{" "}
            <span className="bg-gradient-to-r from-accent to-blue-500 bg-clip-text text-transparent">
              AI Tutor
            </span>
            <br />
            for Cambridge IGCSE
          </h2>
          <p className="text-text-secondary text-lg mt-5 max-w-lg mx-auto">
            Learn smarter with Socratic guidance. No answers given — just the
            right questions to unlock your potential.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              href="/register"
              className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg
                         font-medium transition-all duration-200 active:scale-[0.98]"
            >
              Try 3 Free Questions →
            </Link>
            <Link
              href="/login"
              className="border border-border text-text-secondary hover:text-text-primary hover:border-text-muted
                         px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Sign in
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
            {[
              "Cambridge Aligned ✓",
              "Mark Scheme Grading ✓",
              "24/7 Available ✓",
            ].map((feature) => (
              <span
                key={feature}
                className="text-xs text-text-secondary bg-bg-card border border-border 
                           px-3 py-1.5 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
