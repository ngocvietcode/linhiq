"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Settings2, Zap, Globe, Shield, Bell, Database,
  Save, Check, X, RefreshCw, ChevronRight, AlertCircle,
  Brain, Key, Sliders, Server, CheckCircle
} from "lucide-react";

interface SystemSetting {
  id: string;
  defaultAiProvider: string;
  updatedAt?: string;
}

const PROVIDERS = [
  { value: "gemini",    label: "Google Gemini",    icon: "✨", desc: "Gemini Pro / Flash" },
  { value: "openai",   label: "OpenAI",            icon: "🤖", desc: "GPT-4o / GPT-4 Turbo" },
  { value: "anthropic",label: "Anthropic Claude",  icon: "🧠", desc: "Claude 3.5 Sonnet" },
];

const HINT_LEVELS = [
  { level: "L1", label: "Nudge",       desc: "Minimal guidance — just a gentle push toward the right direction.", color: "#22D3A3" },
  { level: "L2", label: "Approach",    desc: "Suggest the problem-solving approach without giving steps.",       color: "#6366F1" },
  { level: "L3", label: "Partial",     desc: "Guide through key steps, require student to fill in details.",     color: "#F59E0B" },
  { level: "L4", label: "Detailed",    desc: "Walk through the solution step-by-step with partial answers.",     color: "#F97316" },
  { level: "L5", label: "Near Answer", desc: "Provide full methodology — student only needs to write it out.",   color: "#F43F5E" },
];

function SettingSection({ title, icon: Icon, children }: {
  title: string; icon: React.FC<{ size: number; style?: React.CSSProperties }>; children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4 border-b"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--color-accent-soft)" }}
        >
          <Icon size={16} style={{ color: "var(--color-accent)" }} />
        </div>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [savingProvider, setSavingProvider] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [maxSessionsPerUser, setMaxSessionsPerUser] = useState("50");
  const [defaultHintLevel, setDefaultHintLevel] = useState("L2");

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api<{ data: SystemSetting }>("/admin/settings", { token });
      setSettings(res?.data || null);
      if (res?.data?.defaultAiProvider) setSelectedProvider(res.data.defaultAiProvider);
    } catch {
      showToast("Failed to load settings", "err");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  async function saveProvider() {
    if (!token) return;
    setSavingProvider(true);
    try {
      await api("/admin/settings/provider", { method: "POST", token, body: { provider: selectedProvider } });
      showToast("AI provider updated");
      loadSettings();
    } catch (e: any) {
      showToast(e.message, "err");
    } finally {
      setSavingProvider(false);
    }
  }

  function Toggle({ value, onChange, label, desc }: {
    value: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
  }) {
    return (
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="font-medium text-sm">{label}</p>
          {desc && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>}
        </div>
        <button
          onClick={() => onChange(!value)}
          className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
          style={{ background: value ? "var(--color-accent)" : "var(--color-elevated)" }}
        >
          <span
            className="absolute top-1 w-4 h-4 rounded-full transition-all duration-300"
            style={{
              left: value ? "26px" : "4px",
              background: value ? "#fff" : "var(--color-text-muted)",
            }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-slide-in-right"
          style={{
            background: toast.type === "ok" ? "rgba(34,211,163,0.15)" : "rgba(244,63,94,0.15)",
            border: `1px solid ${toast.type === "ok" ? "rgba(34,211,163,0.4)" : "rgba(244,63,94,0.4)"}`,
            color: toast.type === "ok" ? "var(--color-success)" : "var(--color-danger)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {toast.type === "ok" ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            Configure the LinhIQ platform
            {settings?.updatedAt && ` · Last updated ${new Date(settings.updatedAt).toLocaleDateString()}`}
          </p>
        </div>
        <button onClick={loadSettings} className="btn-ghost p-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-6">
        {/* AI Provider */}
        <SettingSection title="AI Provider" icon={Brain as any}>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Select the default large language model provider for AI tutoring sessions.
          </p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 mb-5">
              {PROVIDERS.map(({ value, label, icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setSelectedProvider(value)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left"
                  style={{
                    background: selectedProvider === value ? "var(--color-accent-soft)" : "var(--color-elevated)",
                    borderColor: selectedProvider === value ? "var(--color-accent)" : "var(--color-border-subtle)",
                  }}
                >
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
                  </div>
                  {selectedProvider === value && (
                    <CheckCircle size={18} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={saveProvider}
            disabled={savingProvider || selectedProvider === settings?.defaultAiProvider}
            className="btn-primary gap-2 text-sm"
          >
            <Save size={14} />
            {savingProvider ? "Saving..." : "Save Provider"}
          </button>
          {selectedProvider === settings?.defaultAiProvider && (
            <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
              ✓ Currently active
            </p>
          )}
        </SettingSection>

        {/* Hint System */}
        <SettingSection title="Hint Level Configuration" icon={Sliders as any}>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Configure the 5-level pedagocical hint system. The default level is applied when students start a new session.
          </p>
          <div className="space-y-2 mb-4">
            {HINT_LEVELS.map(({ level, label, desc, color }) => (
              <button
                key={level}
                onClick={() => setDefaultHintLevel(level)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-left"
                style={{
                  background: defaultHintLevel === level ? `${color}10` : "var(--color-elevated)",
                  borderColor: defaultHintLevel === level ? `${color}50` : "var(--color-border-subtle)",
                }}
              >
                <div
                  className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0"
                  style={{ background: `${color}20`, color }}
                >
                  {level}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: defaultHintLevel === level ? color : "inherit" }}>
                    {label}
                  </p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--color-text-muted)" }}>
                    {desc}
                  </p>
                </div>
                {defaultHintLevel === level && (
                  <span className="text-xs font-semibold" style={{ color }}>DEFAULT</span>
                )}
              </button>
            ))}
          </div>
          <button className="btn-primary gap-2 text-sm">
            <Save size={14} /> Save Default
          </button>
        </SettingSection>

        {/* Platform toggles */}
        <SettingSection title="Platform Configuration" icon={Globe as any}>
          <div className="divide-y" style={{ borderColor: "var(--color-border-subtle)" }}>
            <Toggle
              value={registrationOpen}
              onChange={setRegistrationOpen}
              label="Open Registration"
              desc="Allow new users to create accounts"
            />
            <Toggle
              value={maintenanceMode}
              onChange={setMaintenanceMode}
              label="Maintenance Mode"
              desc="Show maintenance banner to all users"
            />
          </div>
          {maintenanceMode && (
            <div
              className="mt-4 flex items-start gap-2 p-3 rounded-xl border text-sm"
              style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)", color: "var(--color-warning)" }}
            >
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              Maintenance mode is ON. Students cannot access the platform.
            </div>
          )}
        </SettingSection>

        {/* Limits */}
        <SettingSection title="Usage Limits" icon={Server as any}>
          <div className="space-y-4">
            <div>
              <label className="label">Max Chat Sessions per User</label>
              <input
                value={maxSessionsPerUser}
                onChange={(e) => setMaxSessionsPerUser(e.target.value)}
                type="number"
                min="1"
                max="500"
                className="input mt-1.5"
                style={{ width: 120 }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                Students can archive old sessions beyond this limit
              </p>
            </div>
          </div>
          <button className="btn-primary gap-2 text-sm mt-5">
            <Save size={14} /> Save Limits
          </button>
        </SettingSection>

        {/* Security */}
        <SettingSection title="Security" icon={Shield as any}>
          <div className="space-y-3">
            {[
              { label: "JWT Token Expiry", value: "7 days", editable: false },
              { label: "Rate Limit (requests/min)", value: "60", editable: true },
              { label: "Max File Upload Size", value: "50 MB", editable: false },
            ].map(({ label, value, editable }) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <p className="text-sm font-medium">{label}</p>
                <div className="flex items-center gap-2">
                  {editable ? (
                    <input
                      defaultValue={value}
                      className="input text-right text-sm"
                      style={{ width: 80, height: 32, padding: "4px 8px" }}
                    />
                  ) : (
                    <span
                      className="text-sm px-2.5 py-1 rounded-lg"
                      style={{ background: "var(--color-elevated)", color: "var(--color-text-secondary)" }}
                    >
                      {value}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-primary gap-2 text-sm mt-5">
            <Save size={14} /> Save Security Rules
          </button>
        </SettingSection>

        {/* Danger zone */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "rgba(244,63,94,0.04)", borderColor: "rgba(244,63,94,0.25)" }}
        >
          <h2 className="font-bold mb-1" style={{ color: "var(--color-danger)" }}>Danger Zone</h2>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
            Irreversible and destructive actions. Handle with extreme care.
          </p>
          <div className="space-y-3">
            {[
              { label: "Clear RAG Vector Store", desc: "Remove all embedded knowledge chunks from the vector database" },
              { label: "Flush All Chat Sessions", desc: "Delete all conversation history from all users" },
              { label: "Reset System Settings", desc: "Restore all settings to factory defaults" },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: "rgba(244,63,94,0.15)" }}
              >
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
                </div>
                <button
                  className="text-sm px-4 py-2 rounded-xl border flex-shrink-0 font-medium transition-all"
                  style={{ borderColor: "rgba(244,63,94,0.4)", color: "var(--color-danger)" }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "rgba(244,63,94,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  Execute
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
