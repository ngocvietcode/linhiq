"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Sparkles, Brain, Cpu, AlertTriangle } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-bg-void">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const providers = [
    { id: "gemini", name: "Google Gemini", description: "Default setup, currently synced with 3072D RAG Vectors", icon: <Sparkles className="w-6 h-6 text-accent" /> },
    { id: "openai", name: "OpenAI GPT", description: "Premium LLMs requires text-embedding-3-large", icon: <Brain className="w-6 h-6 text-[#10B981]" /> },
    { id: "anthropic", name: "Anthropic Claude", description: "Claude 3.5 requires external embeddings proxy", icon: <Cpu className="w-6 h-6 text-[#F59E0B]" /> }
  ];

  return (
    <div className="min-h-screen bg-bg-void font-sans">
      {/* Top Nav */}
      <nav className="border-b border-border-subtle px-6 py-4 flex items-center justify-between bg-bg-base sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            LinhIQ <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-white ml-2 align-middle">Admin</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="hidden sm:flex text-sm font-medium text-text-muted hover:text-text-primary transition-colors items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-sm font-medium text-text-secondary border-l border-border-default pl-4">
            {user.name}
          </span>
          <button
            onClick={logout}
            className="text-sm font-medium text-danger hover:underline transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => router.push("/dashboard")} className="sm:hidden text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-3xl font-semibold text-text-primary tracking-tight">System Settings</h2>
        </div>
        <p className="text-text-secondary mb-10 text-lg">
          Manage platform routing, features, and core configuration limits.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm font-medium flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" /> {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl text-[#10B981] text-sm font-medium flex items-center gap-3">
            <Check className="w-5 h-5" /> {successMsg}
          </div>
        )}

        {/* Global Provider Switcher */}
        <section className="bg-bg-base border border-border-default rounded-3xl overflow-hidden mb-8 shadow-sm">
          <div className="px-8 py-6 border-b border-border-subtle bg-bg-surface">
            <h3 className="text-lg font-semibold text-text-primary">Global AI Provider</h3>
            <p className="text-sm text-text-secondary mt-1">
              Select which foundation model provider to use globally across the system for student chat & QA. 
            </p>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col space-y-4">
              {providers.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => updateProvider(p.id)}
                  className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-5 
                    ${provider === p.id ? "bg-accent/5 border-accent shadow-glow" : "bg-bg-surface border-border-subtle hover:border-border-default"} 
                    ${isUpdating && provider !== p.id ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className="bg-bg-base p-3 rounded-xl border border-border-default shadow-sm shrink-0">
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-bold ${provider === p.id ? "text-accent" : "text-text-primary"}`}>
                      {p.name}
                    </h4>
                    <p className="text-sm text-text-secondary mt-1">
                      {p.description}
                    </p>
                  </div>
                  
                  {provider === p.id && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-6">
                      <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-[13px] text-text-secondary p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />
              <div>
                <span className="font-semibold text-[#F59E0B]">Warning: </span> 
                Switching providers requires ensuring you have valid API keys supplied in the backend environment variables (`.env`).
              </div>
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
