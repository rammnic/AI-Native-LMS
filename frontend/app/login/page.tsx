"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-violet-400" />
            <span className="text-2xl font-bold">AI-Native LMS</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? "Вход в систему" : "Регистрация"}
          </h1>
          <p className="text-slate-400">
            {isLogin
              ? "Войдите, чтобы продолжить обучение"
              : "Создайте аккаунт для начала обучения"}
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-violet-500 focus:outline-none transition-colors"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-violet-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-violet-500 focus:outline-none transition-colors"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 disabled:cursor-not-allowed rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLogin ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
            >
              {isLogin
                ? "Нет аккаунта? Зарегистрироваться"
                : "Уже есть аккаунт? Войти"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}