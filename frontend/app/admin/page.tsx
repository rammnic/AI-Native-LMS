"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Plus, Copy, Trash2, CheckCircle, XCircle, ShieldX } from "lucide-react";
import { adminApi, InviteCode } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState(10);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      checkAdminAndLoad();
    }
  }, [isAuthenticated, authLoading]);

  const checkAdminAndLoad = async () => {
    try {
      const { is_admin } = await adminApi.checkAdmin();
      setIsAdmin(is_admin);
      
      if (!is_admin) {
        setLoading(false);
        return;
      }
      
      fetchInviteCodes();
    } catch {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchInviteCodes = async () => {
    try {
      setLoading(true);
      const codes = await adminApi.getInviteCodes();
      setInviteCodes(codes);
      setError("");
    } catch (err) {
      if (err instanceof Error && err.message.includes("403")) {
        setError("Доступ запрещён. Только администратор может просматривать эту страницу.");
      } else {
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      }
    } finally {
      setLoading(false);
    }
  };

  const createInviteCode = async () => {
    try {
      setCreating(true);
      const newCode = await adminApi.createInviteCode(maxUses);
      setInviteCodes([newCode, ...inviteCodes]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания кода");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const toggleCodeActive = async (code: InviteCode) => {
    try {
      const updated = await adminApi.updateInviteCode(code.id, { is_active: !code.is_active });
      setInviteCodes(inviteCodes.map(c => c.id === code.id ? updated : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления");
    }
  };

  const deleteCode = async (codeId: string) => {
    if (!confirm("Деактивировать этот код?")) return;
    try {
      await adminApi.deleteInviteCode(codeId);
      setInviteCodes(inviteCodes.map(c => 
        c.id === codeId ? { ...c, is_active: false } : c
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
    }
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <ShieldX className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold text-white mb-2">Доступ запрещён</h1>
          <p className="text-slate-400 mb-6">
            У вас нет прав администратора для просмотра этой страницы.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span className="text-xl font-bold">AI-Native LMS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
              Панель управления
            </Link>
            <span className="text-sm text-slate-500">
              {user?.email}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Администрирование</h1>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* Create new code */}
        <div className="mb-8 p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-lg font-semibold mb-4">Создать пригласительный код</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm text-slate-400 mb-2">
                Максимум использований
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={1000}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <button
              onClick={createInviteCode}
              disabled={creating}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Создать код
            </button>
          </div>
        </div>

        {/* Invite codes list */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold">Пригласительные коды</h2>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : inviteCodes.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Коды приглашений не найдены
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {inviteCodes.map((code) => (
                <div key={code.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <code className={`text-lg font-mono ${!code.is_active ? 'text-slate-600 line-through' : 'text-white'}`}>
                        {code.code}
                      </code>
                      {code.is_active ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {code.uses_count} / {code.max_uses} использований
                      {code.expires_at && (
                        <> • истекает {new Date(code.expires_at).toLocaleDateString("ru-RU")}</>
                      )}
                      {code.created_by && (
                        <> • создан {code.created_by}</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(code.code)}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Копировать"
                    >
                      {copiedCode === code.code ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleCodeActive(code)}
                      className={`p-2 rounded-lg transition-colors ${
                        code.is_active
                          ? 'hover:bg-slate-800 text-slate-400 hover:text-yellow-400'
                          : 'hover:bg-slate-800 text-slate-400 hover:text-green-400'
                      }`}
                      title={code.is_active ? "Деактивировать" : "Активировать"}
                    >
                      {code.is_active ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteCode(code.id)}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
          <h3 className="font-medium mb-2">Формат кода</h3>
          <p className="text-sm text-slate-400">
            Коды генерируются в формате <code className="font-mono bg-slate-800 px-1 rounded">LC-XXXX-XXXX-XXXX</code>.
            Убедитесь, что <code className="font-mono bg-slate-800 px-1 rounded">INVITE_CODE_REQUIRED=true</code> в
            переменных окружения для активации проверки кодов.
          </p>
        </div>
      </main>
    </div>
  );
}