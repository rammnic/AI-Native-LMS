"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sparkles, User, Lock, Save, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api"

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Error state
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    if (user) {
      setName(user.name || "")
      setEmail(user.email)
    }
    setLoading(false)
  }, [isAuthenticated, user, router])

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError("Имя не может быть пустым")
      return
    }

    setSaving(true)
    setError("")
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError("Ошибка при сохранении профиля")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setError("")
    
    if (!currentPassword) {
      setError("Введите текущий пароль")
      return
    }
    
    if (!newPassword) {
      setError("Введите новый пароль")
      return
    }
    
    if (newPassword.length < 6) {
      setError("Новый пароль должен быть не менее 6 символов")
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    setSaving(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError("Ошибка при смене пароля")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span className="text-xl font-bold">AI-Native LMS</span>
          </Link>
          <Link 
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Назад к курсам
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Профиль</h1>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name || "Пользователь"}</h2>
              <p className="text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Имя
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <Input
                value={email}
                disabled
                className="bg-slate-800/50 border-slate-700 opacity-60"
              />
              <p className="text-xs text-slate-500 mt-1">Email нельзя изменить</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button 
              onClick={handleSaveProfile} 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saved ? "Сохранено!" : "Сохранить профиль"}
            </Button>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-400" />
            Смена пароля
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Текущий пароль
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Введите текущий пароль"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Новый пароль
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Подтвердите пароль
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите новый пароль"
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={saving}
              variant="secondary"
              className="w-full"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Изменить пароль
            </Button>
          </div>
        </div>

        {/* Logout Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Выход</h3>
          <p className="text-slate-400 text-sm mb-4">
            Вы уверены, что хотите выйти из аккаунта?
          </p>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Выйти из аккаунта
          </Button>
        </div>
      </main>
    </div>
  )
}