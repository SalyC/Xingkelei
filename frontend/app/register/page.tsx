"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const RegisterPage = () => {
  const router = useRouter()
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showVerification, setShowVerification] = useState(false)
  const [telegramLink, setTelegramLink] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verifying, setVerifying] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (form.password !== form.confirm_password) {
      setError("Пароли не совпадают")
      setLoading(false)
      return
    }

    try {
      const res = await api.post("/auth/register", {
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
      })

      setTelegramLink(res.data.telegram_link)
      setShowVerification(true)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || "Ошибка регистрации")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    setError("")
    try {
      await api.post("/auth/verify-email", {
        username: form.username,
        code: verificationCode,
      })
      router.push("/login")
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || "Неверный код")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт в Клубе Синкэлэй</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Имя пользователя</label>
              <Input name="username" placeholder="nickname" value={form.username} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Имя</label>
              <Input name="first_name" placeholder="Иван" value={form.first_name} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Фамилия</label>
              <Input name="last_name" placeholder="Иванов" value={form.last_name} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Пароль</label>
              <Input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Повторить пароль</label>
              <Input name="confirm_password" type="password" placeholder="••••••••" value={form.confirm_password} onChange={handleChange} required minLength={6} disabled={loading} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <a href="/login" className="text-primary underline">
                Войти
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Модальное окно верификации */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение через Telegram</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Для получения кода подтверждения перейдите в нашего бота:
            </p>
            <a
              href={telegramLink}
              target="_blank"
              className="inline-flex w-full items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Открыть бота
            </a>
            <p className="text-xs text-gray-500">
              Бот автоматически покажет ваш код. Вернитесь сюда и введите его.
            </p>
            <Input
              placeholder="Код из Telegram"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              disabled={verifying}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleVerify} className="w-full" disabled={verifying}>
              {verifying ? "Проверка..." : "Подтвердить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RegisterPage