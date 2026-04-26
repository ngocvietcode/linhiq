"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  Clock,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ParentShell } from "../_components/ParentShell";
import { useParentContext } from "../_lib/parent-context";

interface CreatedChild {
  id: string;
  username: string | null;
  email: string | null;
  name: string;
}

interface LinkRequest {
  id: string;
  childIdentifier: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  approvedAt: string | null;
  expired: boolean;
}

interface InviteResult {
  id: string;
  childIdentifier: string;
  code: string;
  expiresAt: string;
}

const CURRICULA = [
  { value: "IGCSE", label: "IGCSE" },
  { value: "A_LEVEL", label: "A-Level" },
  { value: "IB", label: "IB" },
  { value: "AP", label: "AP" },
  { value: "THPT_VN", label: "THPT Vietnam" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "đã hết hạn";
  const h = Math.floor(diff / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / 60_000);
  if (h > 0) return `còn ${h}h ${m}m`;
  return `còn ${m} phút`;
}

export default function LinkChildPage() {
  const { token } = useAuth();
  const { refresh } = useParentContext();
  const [tab, setTab] = useState<"create" | "invite">("create");
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const reloadRequests = () => {
    if (!token) return;
    setLoadingRequests(true);
    api<LinkRequest[]>("/parent/link-requests", { token })
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoadingRequests(false));
  };

  useEffect(() => {
    reloadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <ParentShell
      title="Liên kết tài khoản con"
      subtitle="Tạo tài khoản mới hoặc gửi mã liên kết tới tài khoản đã có của con"
      maxWidth="44rem"
    >
      <div
        className="flex gap-1 p-1 rounded-full border mb-6 w-fit mx-auto"
        style={{ borderColor: "var(--color-border-default)", background: "var(--color-surface-2)" }}
      >
        <button
          onClick={() => setTab("create")}
          className="text-sm px-4 py-1.5 rounded-full transition-colors flex items-center gap-2"
          style={{
            background: tab === "create" ? "var(--color-accent)" : "transparent",
            color: tab === "create" ? "#fff" : "var(--color-text-secondary)",
          }}
        >
          <UserPlus size={14} /> Tạo tài khoản mới
        </button>
        <button
          onClick={() => setTab("invite")}
          className="text-sm px-4 py-1.5 rounded-full transition-colors flex items-center gap-2"
          style={{
            background: tab === "invite" ? "var(--color-accent)" : "transparent",
            color: tab === "invite" ? "#fff" : "var(--color-text-secondary)",
          }}
        >
          <Mail size={14} /> Mời tài khoản đã có
        </button>
      </div>

      {tab === "create" ? (
        <CreateChildForm
          onSuccess={() => {
            void refresh();
          }}
        />
      ) : (
        <InviteSection
          requests={requests}
          loading={loadingRequests}
          onChange={reloadRequests}
        />
      )}
    </ParentShell>
  );
}

function CreateChildForm({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [curriculum, setCurriculum] = useState("IGCSE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedChild | null>(null);
  const [savedPassword, setSavedPassword] = useState<string>("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        username: username.trim().toLowerCase(),
        name,
        password,
        curriculum,
      };
      if (email.trim()) body.email = email.trim();
      const child = await api<CreatedChild>("/parent/children", {
        token,
        method: "POST",
        body,
      });
      setSavedPassword(password);
      setCreated(child);
      setUsername("");
      setEmail("");
      setName("");
      setPassword("");
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tạo tài khoản");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <section
        className="rounded-2xl border p-6"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "rgba(16,185,129,0.3)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={20} style={{ color: "var(--color-success)" }} />
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
            Đã tạo tài khoản cho {created.name}
          </h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Tài khoản đã được liên kết với bạn. Hãy lưu hoặc chia sẻ thông tin đăng nhập dưới đây cho con:
        </p>
        <div
          className="rounded-xl p-4 space-y-2 mb-4"
          style={{ background: "var(--color-surface-1)" }}
        >
          {created.username && <Field label="Tên đăng nhập" value={created.username} />}
          {created.email && <Field label="Email" value={created.email} />}
          <Field label="Mật khẩu" value={savedPassword} mono />
        </div>
        <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
          Gợi ý: con đăng nhập tại trang Đăng nhập bằng tên đăng nhập + mật khẩu. Có thể đổi mật khẩu trong Cài đặt sau khi đăng nhập lần đầu.
        </p>
        <button
          onClick={() => { setCreated(null); setSavedPassword(""); }}
          className="text-sm px-4 py-2 rounded-full"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Tạo thêm tài khoản khác
        </button>
      </section>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border p-6 space-y-4"
      style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}
    >
      <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
        Tạo tài khoản học sinh mới
      </h2>
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Hệ thống sẽ tạo tài khoản học sinh và liên kết tự động với bạn. Con đăng nhập bằng
        <strong> tên đăng nhập</strong> (không cần email).
      </p>

      <FormField label="Họ và tên con">
        <input
          type="text"
          required
          minLength={2}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-primary)",
          }}
          placeholder="Nguyễn Văn Minh"
        />
      </FormField>

      <FormField label="Tên đăng nhập (con sẽ dùng để đăng nhập)">
        <input
          type="text"
          required
          minLength={3}
          maxLength={32}
          pattern="[a-zA-Z0-9_-]+"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase())}
          className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-primary)",
          }}
          placeholder="vd: minh_g10"
        />
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          Chỉ chữ thường, số, gạch dưới (_), gạch ngang (-). 3–32 ký tự.
        </p>
      </FormField>

      <FormField label="Email (tuỳ chọn — chỉ thêm nếu con đã có email)">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-primary)",
          }}
          placeholder="minh@example.com (có thể bỏ trống)"
        />
      </FormField>

      <FormField label="Mật khẩu (≥ 8 ký tự)">
        <input
          type="text"
          required
          minLength={8}
          maxLength={100}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-primary)",
          }}
          placeholder="VD: hocgioi2026"
        />
      </FormField>

      <FormField label="Chương trình học">
        <select
          value={curriculum}
          onChange={(e) => setCurriculum(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-primary)",
          }}
        >
          {CURRICULA.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </FormField>

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
        disabled={submitting}
        className="w-full px-4 py-2.5 rounded-full text-sm font-medium transition-opacity"
        style={{
          background: "var(--color-accent)",
          color: "#fff",
          opacity: submitting ? 0.6 : 1,
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Đang tạo..." : "Tạo tài khoản"}
      </button>
    </form>
  );
}

function InviteSection({
  requests, loading, onChange,
}: {
  requests: LinkRequest[]; loading: boolean; onChange: () => void;
}) {
  const { token } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api<InviteResult>("/parent/link-requests", {
        token,
        method: "POST",
        body: { childIdentifier: identifier.trim() },
      });
      setIssued(res);
      setIdentifier("");
      onChange();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tạo mã");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel(id: string) {
    if (!token) return;
    if (!confirm("Huỷ yêu cầu này?")) return;
    await api(`/parent/link-requests/${id}`, { token, method: "DELETE" }).catch(console.error);
    onChange();
  }

  function copyCode() {
    if (!issued) return;
    navigator.clipboard.writeText(issued.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="rounded-2xl border p-6"
        style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}
      >
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
          Mời con đã có tài khoản
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Nhập <strong>email hoặc tên đăng nhập</strong> của con. Hệ thống sinh mã 6 chữ số (hết hạn 24h). Con vào trang <code>/parent-link</code> để nhập mã.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            required
            minLength={3}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border text-sm"
            style={{
              background: "var(--color-surface-1)",
              borderColor: "var(--color-border-default)",
              color: "var(--color-text-primary)",
            }}
            placeholder="email hoặc tên đăng nhập của con"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Đang tạo..." : "Tạo mã"}
          </button>
        </div>

        {error && (
          <div
            className="mt-3 rounded-lg p-3 flex items-start gap-2 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", color: "var(--color-danger)" }}
          >
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </form>

      {issued && (
        <section
          className="rounded-2xl border p-6 text-center"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "rgba(16,185,129,0.3)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>
            Mã liên kết cho <strong>{issued.childIdentifier}</strong>
          </p>
          <p
            className="text-4xl font-mono font-bold tracking-[0.4em] my-4"
            style={{ color: "var(--color-accent)" }}
          >
            {issued.code}
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            Hết hạn: {formatDateTime(issued.expiresAt)} · {timeUntil(issued.expiresAt)}
          </p>
          <button
            onClick={copyCode}
            className="text-sm px-4 py-2 rounded-full inline-flex items-center gap-2"
            style={{
              background: copied ? "var(--color-success)" : "var(--color-accent-soft)",
              color: copied ? "#fff" : "var(--color-accent)",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Đã sao chép" : "Sao chép mã"}
          </button>
          <p className="text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
            Mã sẽ chỉ hiển thị một lần. Nếu cần lại, hãy tạo mã mới.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>
          YÊU CẦU GẦN ĐÂY
        </h2>
        {loading && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Đang tải...</p>
        )}
        {!loading && requests.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Chưa có yêu cầu nào.
          </p>
        )}
        <ul className="space-y-2">
          {requests.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border p-3 flex items-center gap-3"
              style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border-subtle)" }}
            >
              <StatusBadge status={r.status} expired={r.expired} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
                  {r.childIdentifier}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Tạo: {formatDateTime(r.createdAt)}
                  {r.status === "PENDING" && !r.expired && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Clock size={10} /> {timeUntil(r.expiresAt)}
                    </span>
                  )}
                  {r.approvedAt && (
                    <span className="ml-2">· Liên kết {formatDateTime(r.approvedAt)}</span>
                  )}
                </p>
              </div>
              {r.status === "PENDING" && !r.expired && (
                <button
                  onClick={() => cancel(r.id)}
                  className="p-1.5 rounded-lg"
                  style={{ color: "var(--color-text-muted)" }}
                  aria-label="Huỷ"
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusBadge({ status, expired }: { status: LinkRequest["status"]; expired: boolean }) {
  if (expired || status === "EXPIRED")
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--color-border-subtle)", color: "var(--color-text-muted)" }}>
        Hết hạn
      </span>
    );
  if (status === "APPROVED")
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "var(--color-success)" }}>
        Đã liên kết
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "var(--color-danger)" }}>
        Đã huỷ
      </span>
    );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
      Đang chờ
    </span>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide block mb-1.5" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span
        className={`text-sm ${mono === false ? "" : "font-mono"} truncate`}
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}
