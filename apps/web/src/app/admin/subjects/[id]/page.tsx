"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Link from "next/link";

function SubjectDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user, token, isLoading } = useAuth();
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token || !params.id) return;
    
    api<{ success: boolean; data: any }>(`/admin/subjects/${params.id}`, { token })
      .then((res) => {
        setSubject(res.data);
      })
      .catch((err) => {
        console.error("Failed to load subject:", err);
      })
      .finally(() => setLoading(false));
  }, [token, params.id]);

  if (isLoading || loading) return <p className="text-center mt-10">Loading...</p>;
  if (!subject) return <p className="text-center mt-10 text-error">Subject not found.</p>;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-10">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/subjects" className="text-accent hover:underline mb-6 inline-block text-sm">
          ← Back to Subjects
        </Link>
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-4xl">{subject.iconEmoji}</span>
              {subject.name}
            </h1>
            <p className="text-text-muted mt-2 max-w-2xl">{subject.description}</p>
          </div>
          <span className="px-3 py-1 text-sm rounded-full bg-accent/20 text-accent font-medium">
            {subject.curriculum}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Textbooks Tracking */}
          <section className="bg-bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border bg-black/20 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Assigned Textbooks</h2>
                <p className="text-sm text-text-muted">
                  {subject.documents?.length || 0} book{(subject.documents?.length || 0) !== 1 ? "s" : ""} · Used for RAG context in chat
                </p>
              </div>
            </div>
            <div className="p-6 flex-1">
              {subject.documents && subject.documents.length > 0 ? (
                <ul className="space-y-4">
                  {subject.documents.map((doc: any) => {
                    const vol = doc.bookVolume;
                    const chunkCount = doc._count?.chunks ?? 0;
                    return (
                      <li key={doc.id} className="p-4 rounded-xl border border-border bg-bg-primary flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-accent break-words">{doc.title}</span>
                          {vol?.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/15 text-accent whitespace-nowrap font-medium">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                          {vol?.bookType && (
                            <span className="px-1.5 py-0.5 rounded bg-black/30">
                              {vol.bookType.replace(/_/g, " ")}
                            </span>
                          )}
                          {vol?.shortTitle && <span>“{vol.shortTitle}”</span>}
                          <span>Source: {doc.sourceType}</span>
                          {vol?.totalPages != null && <span>{vol.totalPages} pages</span>}
                          <span className={chunkCount > 0 ? "text-success" : "text-warning"}>
                            {chunkCount} chunks
                          </span>
                          {!doc.isProcessed && chunkCount === 0 && (
                            <span className="text-warning">· not ingested</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-text-muted italic text-center py-10">No textbooks assigned. Run ingest script to map textbooks.</p>
              )}
            </div>
          </section>

          {/* Roadmap Milestones */}
          <section className="bg-bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border bg-black/20">
              <h2 className="text-xl font-semibold">Learning Roadmap</h2>
              <p className="text-sm text-text-muted">Extracted Roadmap / Milestones Tree</p>
            </div>
            <div className="p-6 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
              {subject.milestones && subject.milestones.length > 0 ? (
                <div className="space-y-3">
                  {subject.milestones.map((ms: any) => (
                    <details key={ms.id} className="group p-3 rounded-lg border border-border bg-bg-primary">
                       <summary className="flex justify-between items-center cursor-pointer list-none">
                         <span className="font-medium text-sm text-text-primary truncate font-semibold" title={ms.name}>
                           <span className="inline-block w-4 transition-transform group-open:rotate-90">▶</span> 
                           {ms.orderIndex}. {ms.name}
                         </span>
                         <span className="text-xs px-2 py-1 bg-black/30 rounded-md text-text-muted whitespace-nowrap">
                           {ms.topics?.length || 0} topics
                         </span>
                       </summary>
                       
                       {/* Topics List */}
                       <div className="mt-3 pl-4 border-l-2 border-border space-y-2">
                         {ms.topics?.map((topic: any) => (
                           <details key={topic.id} className="group/topic p-2 rounded bg-black/10 border border-border/50">
                             <summary className="text-sm text-text-secondary cursor-pointer list-none flex justify-between items-center">
                               <span>
                                 <span className="inline-block w-4 transition-transform group-open/topic:rotate-90 text-text-muted">▶</span> 
                                 Topic {topic.orderIndex}: {topic.name}
                               </span>
                               <span className="text-xs text-text-muted">{topic.chunks?.length || 0} chunks</span>
                             </summary>
                             
                             {/* Chunks List */}
                             <div className="mt-2 pl-4 space-y-2">
                               {topic.chunks?.map((chunk: any, idx: number) => {
                                 const bookLabel = chunk.document?.bookVolume?.shortTitle ?? chunk.document?.title;
                                 return (
                                   <div key={chunk.id} className="text-xs text-text-muted bg-bg-card p-2 rounded border border-border/50 break-words whitespace-pre-wrap">
                                     <div className="flex items-center justify-between mb-1">
                                       <span className="font-semibold text-accent">Chunk {idx + 1}</span>
                                       {bookLabel && (
                                         <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-text-muted whitespace-nowrap">
                                           {bookLabel}
                                         </span>
                                       )}
                                     </div>
                                     {chunk.content}
                                   </div>
                                 );
                               })}
                               {!topic.chunks?.length && (
                                 <p className="text-xs text-text-muted italic">No textbook content for this topic.</p>
                               )}
                             </div>
                           </details>
                         ))}
                         {!ms.topics?.length && <p className="text-xs text-text-muted italic">No topics found.</p>}
                       </div>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted italic text-center py-10">No roadmap defined.</p>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

export default function AdminSubjectDetailPage() {
  return <SubjectDetailContent />;
}
