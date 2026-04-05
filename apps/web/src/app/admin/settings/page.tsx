"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";

function AdminSettingsContent() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();
  const [provider, setProvider] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    
    // Fetch current system settings
    api<{ success: boolean; data: { activeGlobalAiProvider: string } }>("/admin/settings", { token })
      .then((res) => {
        setProvider(res.data.activeGlobalAiProvider);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setError("Failed to load global AI settings from server.");
      });
  }, [token]);

  async function updateProvider(newProvider: string) {
    if (!token || isUpdating || newProvider === provider) return;
    setIsUpdating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await api<{ success: boolean }>("/admin/settings/provider", {
        method: "POST",
        body: { provider: newProvider },
        token,
      });

      if (result.success) {
        setProvider(newProvider);
        setSuccessMsg(`Successfully switched global AI provider to ${newProvider}`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update AI provider");
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const providers = [
    { id: "gemini", name: "Google Gemini", description: "Default setup, currently synced with 3072D RAG Vectors", icon: "✨" },
    { id: "openai", name: "OpenAI GPT", description: "Premium LLMs requires text-embedding-3-large", icon: "🧠" },
    { id: "anthropic", name: "Anthropic Claude", description: "Claude 3.5 requires external embeddings proxy", icon: "🎭" }
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Top Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">
            <span className="text-accent">J</span>avirs <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-accent/20 text-accent ml-2">Admin</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-sm text-text-muted hover:text-text-primary transition-colors">
            Back to Dashboard
          </button>
          <span className="text-sm text-text-secondary border-l border-border pl-4">
            {user.name}
          </span>
          <button
            onClick={logout}
            className="text-sm text-error hover:text-error/80 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-semibold mb-2">System Settings</h2>
        <p className="text-text-secondary mb-10">
          Manage platform routing, features, and core configuration limits.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
            {successMsg}
          </div>
        )}

        {/* Global Provider Switcher */}
        <section className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-border bg-black/20">
            <h3 className="text-lg font-medium">Global AI Provider</h3>
            <p className="text-sm text-text-muted mt-1">
              Select which foundation model provider to use globally across the system for student chat & QA. 
            </p>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col space-y-4">
              {providers.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => updateProvider(p.id)}
                  className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 
                    ${provider === p.id ? "bg-accent/10 border-accent" : "bg-bg-primary border-border hover:border-accent/50"} 
                    ${isUpdating && provider !== p.id ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className="text-3xl bg-black/20 p-3 rounded-lg border border-border/50">
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-semibold ${provider === p.id ? "text-accent" : "text-text-primary"}`}>
                      {p.name}
                    </h4>
                    <p className="text-sm text-text-muted mt-1">
                      {p.description}
                    </p>
                  </div>
                  
                  {provider === p.id && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-6">
                      <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-xs text-text-muted p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <span className="font-semibold text-warning">Warning: </span> 
              Switching providers requires ensuring you have valid API keys supplied in the backend environment variables (`.env`).
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AuthProvider>
      <AdminSettingsContent />
    </AuthProvider>
  );
}
