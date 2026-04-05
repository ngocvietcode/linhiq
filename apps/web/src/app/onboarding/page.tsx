"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft } from "lucide-react";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [curriculum, setCurriculum] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [diagnosticAns, setDiagnosticAns] = useState<number | null>(null);

  const toggleSubject = (sub: string) => {
    setSubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub].slice(0, 3)
    );
  };

  const nextStep = () => {
    if (step < 3) setStep(prev => (prev + 1) as Step);
    else router.push("/dashboard");
  };

  const skipToDashboard = () => router.push("/dashboard");

  return (
    <div className="min-h-screen bg-bg-void flex items-center justify-center p-4 selection:bg-accent/30">
      <div className="w-full max-w-2xl bg-bg-base border border-border-default rounded-[32px] overflow-hidden flex flex-col min-h-[560px] shadow-2xl relative">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between z-10 relative">
          <div className="font-semibold text-lg text-text-primary tracking-tight">LinhIQ</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-muted mr-2">Step {step} of 3</span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step >= i ? 'bg-accent' : 'bg-border-default'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 sm:p-12 z-10 relative flex flex-col justify-center">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-semibold mb-2 text-text-primary">Hi, I&apos;m LinhIQ.</h1>
              <p className="text-xl text-text-secondary mb-8">Your Cambridge AI tutor.<br/>Let me set up your personalised experience.</p>
              
              <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Which curriculum are you studying?</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setCurriculum('IGCSE')}
                  className={`text-left p-6 rounded-2xl border-2 transition-all ${curriculum === 'IGCSE' ? 'border-accent bg-accent/5 shadow-glow' : 'border-border-subtle bg-bg-surface hover:border-border-default'}`}
                >
                  <h3 className="text-xl font-bold text-text-primary mb-1">IGCSE</h3>
                  <p className="text-sm text-text-muted">Grade 9–10<br/>Age 14–16</p>
                </button>
                <button
                  onClick={() => setCurriculum('A-Level')}
                  className={`text-left p-6 rounded-2xl border-2 transition-all ${curriculum === 'A-Level' ? 'border-accent bg-accent/5 shadow-glow' : 'border-border-subtle bg-bg-surface hover:border-border-default'}`}
                >
                  <h3 className="text-xl font-bold text-text-primary mb-1">A-Level</h3>
                  <p className="text-sm text-text-muted">Grade 11–12<br/>Age 16–18</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h1 className="text-2xl font-semibold mb-2 text-text-primary">Which subjects do you want to study?</h1>
              <p className="text-text-secondary mb-8">Pick up to 3 subjects to pin to your dashboard.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'Biology', icon: '🧬' },
                  { id: 'Chemistry', icon: '⚗️' },
                  { id: 'Maths', icon: '∫' },
                  { id: 'Physics', icon: '⚡' },
                  { id: 'Economics', icon: '📊' },
                  { id: 'Geography', icon: '🌍' },
                ].map(s => {
                  const isSelected = subjects.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={`relative p-4 rounded-xl border-2 text-center transition-all ${isSelected ? 'border-accent bg-accent/5' : 'border-border-subtle bg-bg-surface hover:border-border-default'}`}
                    >
                      {isSelected && <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center text-[10px]">✓</div>}
                      <div className="text-3xl mb-2">{s.icon}</div>
                      <div className="text-[13px] font-semibold text-text-primary">{s.id}</div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-8 text-sm font-medium text-text-muted">
                {subjects.length} selected {subjects.length > 0 && `— ${subjects.join(', ')}`}
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h1 className="text-2xl font-semibold mb-2 text-text-primary">Quick diagnostic — 3 questions</h1>
              <p className="text-text-secondary mb-8">Helps me understand where you are right now.</p>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-bg-surface border border-border-subtle px-3 py-1 rounded-full text-xs font-semibold text-text-secondary">Biology</span>
                <span className="text-sm font-medium text-text-muted">Question 1 of 3</span>
              </div>

              <div className="bg-bg-surface border border-border-subtle p-6 sm:p-8 rounded-2xl mb-6">
                <h3 className="text-lg font-medium text-text-primary mb-6">What is the function of the cell membrane?</h3>
                <div className="space-y-3">
                  {[
                    "Controls what enters and leaves the cell",
                    "Produces energy for the cell",
                    "Controls cell division",
                    "Stores genetic information"
                  ].map((ans, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDiagnosticAns(idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${diagnosticAns === idx ? 'border-accent bg-accent/10 border-2' : 'border-border-subtle bg-bg-base hover:border-border-default'}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${diagnosticAns === idx ? 'border-accent' : 'border-text-muted'}`}>
                        {diagnosticAns === idx && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                      </div>
                      <span className={`text-[15px] font-medium ${diagnosticAns === idx ? 'text-text-primary' : 'text-text-secondary'}`}>{ans}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-8 py-6 border-t border-border-subtle bg-bg-base/80 backdrop-blur-sm z-10 flex items-center gap-4 justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setStep(prev => prev > 1 ? (prev - 1) as Step : 1)}
            className={step === 1 ? 'invisible' : ''}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <Button 
            onClick={nextStep} 
            disabled={(step === 1 && !curriculum) || (step === 2 && subjects.length === 0)}
            className="px-8"
          >
            {step === 3 ? "Complete" : "Continue"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        
        {step === 3 && (
          <div className="p-4 text-center text-sm">
            <span className="text-text-secondary">You can skip this — it only helps personalise your path.</span>
            <button onClick={skipToDashboard} className="ml-2 text-accent font-medium hover:underline focus:outline-none">Skip diagnostic</button>
          </div>
        )}
      </div>
    </div>
  );
}
