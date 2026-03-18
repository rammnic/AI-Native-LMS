import Link from "next/link";
import { Sparkles, Zap, MessageSquare, GitBranch, Bot } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span className="text-xl font-bold">AI-Native LMS</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/login" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 mb-8">
            <Bot className="w-4 h-4" />
            <span className="text-sm">AI-Powered Education</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Learn with{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Intelligent AI
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Personalized courses generated on-the-fly. AI mentor available 24/7.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="px-8 py-4 bg-violet-600 hover:bg-violet-700 rounded-xl font-semibold">
              Start Learning
            </Link>
            <Link href="/login" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold border border-slate-700">
              View Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-slate-900/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Why AI-Native LMS?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">JIT Generation</h3>
              <p className="text-slate-400">Content is created when you need it.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Infinite Nesting</h3>
              <p className="text-slate-400">Tree structure with unlimited depth.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Mentor</h3>
              <p className="text-slate-400">Chat with AI about any topic.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="container mx-auto text-center text-slate-500">
          <p>AI-Native LMS &copy; 2026.</p>
        </div>
      </footer>
    </div>
  );
}