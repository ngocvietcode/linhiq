import { AuthProvider } from "@/lib/auth-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-accent">J</span>avirs
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              AI Tutor for Cambridge IGCSE
            </p>
          </div>
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
