"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Link from "next/link";

function SubjectsListContent() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    
    api<{ success: boolean; data: any[] }>("/admin/subjects", { token })
      .then((res) => {
        setSubjects(res.data);
      })
      .catch((err) => {
        console.error("Failed to load subjects:", err);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (isLoading || loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Subjects</h1>
            <p className="text-text-muted mt-2">View and configure curriculums and textbooks</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-bg-card border border-border rounded-lg hover:bg-black/20">
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-border">
                <th className="px-6 py-4 font-medium text-text-secondary">Subject</th>
                <th className="px-6 py-4 font-medium text-text-secondary">Curriculum</th>
                <th className="px-6 py-4 font-medium text-text-secondary">Textbooks</th>
                <th className="px-6 py-4 font-medium text-text-secondary">Topics</th>
                <th className="px-6 py-4 font-medium text-text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub) => (
                <tr key={sub.id} className="border-b border-border hover:bg-bg-hover transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <span className="text-2xl">{sub.iconEmoji}</span>
                    <span className="font-semibold">{sub.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent font-medium">
                      {sub.curriculum}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-muted">{sub._count?.documents || 0}</td>
                  <td className="px-6 py-4 text-text-muted">{sub._count?.topics || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/subjects/${sub.id}`} 
                      className="text-accent hover:underline text-sm font-medium"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-text-muted">No subjects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminSubjectsPage() {
  return (
    <AuthProvider>
      <SubjectsListContent />
    </AuthProvider>
  );
}
