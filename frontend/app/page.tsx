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
            <Link href="/prompts" className="text-slate-300 hover:text-white transition-colors">
              Траектории обучения
            </Link>
            <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
              Панель управления
            </Link>
            <Link href="/login" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium">
              Войти
            </Link>
          </nav>
        </div>
      </header>

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 mb-8">
            <Bot className="w-4 h-4" />
            <span className="text-sm">Обучение с поддержкой ИИ</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Учитесь по своей программе с{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              полной поддержкой ИИ-наставника
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Персонализированные курсы, генерируемые на лету. ИИ-наставник доступен 24/7.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/prompts" className="px-8 py-4 bg-violet-600 hover:bg-violet-700 rounded-xl font-semibold">
              Исследовать траектории обучения
            </Link>
            <Link href="/login" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold border border-slate-700">
              Начать обучение
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-slate-900/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Почему AI-Native LMS?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Генерация по запросу</h3>
              <p className="text-slate-400">Контент создаётся тогда, когда он вам нужен.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Бесконечная вложенность</h3>
              <p className="text-slate-400">Древовидная структура с неограниченной глубиной.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ИИ-наставник</h3>
              <p className="text-slate-400">Общайтесь с ИИ на любую тему.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="container mx-auto text-center text-slate-500">
          <p>AI-Native LMS © 2026.</p>
        </div>
      </footer>
    </div>
  );
}