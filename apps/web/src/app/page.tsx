import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageSquare, Target, Brain } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-void flex flex-col font-sans selection:bg-accent/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full bg-bg-void/80 backdrop-blur-md border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">L</div>
          <span className="font-semibold text-lg text-text-primary tracking-tight">LinhIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[15px] font-medium text-text-secondary hover:text-text-primary transition-colors">
            Sign in
          </Link>
          <Link href="/register">
            <Button size="sm" className="hidden sm:flex">Start →</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-text-primary mb-6">
            Study smarter.<br />Not harder.
          </h1>
          <p className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Your personal AI tutor for Cambridge IGCSE & A-Level.<br />
            Answers your questions with questions — until you truly understand.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">Try 3 Questions Free →</Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-bg-surface">See how it works</Button>
            </Link>
          </div>

          <div className="mt-16 mb-4 flex items-center justify-center gap-4 text-sm font-medium text-text-muted">
            <div className="h-px bg-border-subtle flex-1 max-w-[100px]" />
            Trusted for
            <div className="h-px bg-border-subtle flex-1 max-w-[100px]" />
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-text-secondary font-medium">
            <span>Biology</span> · <span>Mathematics</span> · <span>Chemistry</span> · <span>Physics</span> · <span>Economics</span>
          </div>
        </div>

        {/* Live Demo Chat Mockup */}
        <div className="mt-24 max-w-3xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 to-purple-500/30 rounded-[32px] blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative bg-bg-base border border-border-default rounded-3xl p-4 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-end">
              <div className="bg-accent text-white px-5 py-3 rounded-[18px_18px_4px_18px] text-[15px] shadow-sm max-w-[80%]">
                What is osmosis?
              </div>
            </div>
            
            <div className="flex justify-start">
              <div className="bg-bg-surface border border-border-subtle text-text-primary px-5 py-4 rounded-[4px_18px_18px_18px] text-[15px] shadow-sm max-w-[85%] relative">
                Great question! Before I explain — what do you already know about how water moves between cells?
              </div>
            </div>

            <div className="flex justify-end">
              <div className="bg-accent text-white px-5 py-3 rounded-[18px_18px_4px_18px] text-[15px] shadow-sm max-w-[80%]">
                Water goes from less concentrated to more?
              </div>
            </div>

            <div className="flex justify-start">
              <div className="bg-bg-surface border border-border-subtle text-text-primary px-5 py-4 rounded-[4px_18px_18px_18px] text-[15px] shadow-sm max-w-[85%] relative">
                <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-success uppercase tracking-widest bg-success/10 w-fit px-2.5 py-1 rounded-md">
                  ✅ KEY TERM: concentration gradient
                </div>
                You&apos;re on the right track! Now — what do we call the type of membrane that allows water through but not large molecules?
              </div>
            </div>
            
            <div className="mt-4 relative flex items-center bg-bg-surface border border-border-subtle rounded-2xl p-2 px-4 shadow-sm opacity-60">
              <span className="text-text-muted text-[15px] py-1">Ask anything...</span>
            </div>
          </div>
          <p className="text-center text-sm font-medium text-text-muted mt-6">Live demo — no signup needed</p>
        </div>

        {/* Features Section */}
        <div id="how-it-works" className="mt-32 max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 text-sm font-medium text-accent mb-12">
            <div className="h-px bg-accent/20 flex-1 max-w-[60px]" />
            What makes LinhIQ different
            <div className="h-px bg-accent/20 flex-1 max-w-[60px]" />
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Socratic Method</h3>
              <p className="text-text-secondary text-sm">Teaches you to think, not copy. We guide you to the answer instead of handing it to you.</p>
            </div>
            
            <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Cambridge Aligned RAG</h3>
              <p className="text-text-secondary text-sm">Every answer is grounded in your exact syllabus. No hallucinations, just textbooks.</p>
            </div>

            <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Mark Scheme Grading</h3>
              <p className="text-text-secondary text-sm">Know exactly which words earn marks based on past papers and examiner reports.</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-32 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 text-sm font-medium text-text-muted mb-12">
            <div className="h-px bg-border-subtle flex-1 max-w-[60px]" />
            Pricing
            <div className="h-px bg-border-subtle flex-1 max-w-[60px]" />
          </div>

          <div className="grid sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-bg-base border border-border-default p-8 rounded-3xl flex flex-col">
              <h3 className="text-xl font-semibold text-text-primary mb-2">Free</h3>
              <p className="text-text-secondary text-sm mb-6">Perfect to try out.</p>
              <div className="text-3xl font-bold text-text-primary mb-8">$0<span className="text-sm font-medium text-text-muted">/mo</span></div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-text-secondary"><CheckCircle2 className="w-5 h-5 text-text-muted" /> 10 questions/day</li>
                <li className="flex items-center gap-3 text-sm text-text-secondary"><CheckCircle2 className="w-5 h-5 text-text-muted" /> 1 subject</li>
                <li className="flex items-center gap-3 text-sm text-text-secondary"><CheckCircle2 className="w-5 h-5 text-text-muted" /> Basic hints</li>
              </ul>
              
              <Link href="/register"><Button variant="secondary" className="w-full bg-bg-surface">Start Free</Button></Link>
            </div>

            <div className="bg-bg-surface border border-accent/40 relative p-8 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_40px_rgba(99,102,241,0.1)]">
              <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-bl-xl">Popular</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Student Pro</h3>
              <p className="text-text-secondary text-sm mb-6">Unlock full learning potential.</p>
              <div className="text-3xl font-bold text-text-primary mb-8">$15<span className="text-sm font-medium text-text-muted">/mo</span></div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-text-primary font-medium"><CheckCircle2 className="w-5 h-5 text-accent" /> Unlimited questions</li>
                <li className="flex items-center gap-3 text-sm text-text-primary font-medium"><CheckCircle2 className="w-5 h-5 text-accent" /> All subjects</li>
                <li className="flex items-center gap-3 text-sm text-text-primary font-medium"><CheckCircle2 className="w-5 h-5 text-accent" /> Photo upload</li>
                <li className="flex items-center gap-3 text-sm text-text-primary font-medium"><CheckCircle2 className="w-5 h-5 text-accent" /> Mark Scheme grading</li>
                <li className="flex items-center gap-3 text-sm text-text-primary font-medium"><CheckCircle2 className="w-5 h-5 text-accent" /> Progress tracking</li>
              </ul>
              
              <Link href="/register"><Button className="w-full shadow-accent-glow">Get Pro →</Button></Link>
            </div>
          </div>
        </div>

      </main>

      <footer className="border-t border-border-subtle py-8 text-center text-sm font-medium text-text-muted">
        © 2026 LinhIQ. Designed for students globally.
      </footer>
    </div>
  );
}
