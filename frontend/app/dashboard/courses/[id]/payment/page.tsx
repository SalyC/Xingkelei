"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const PaymentPage = () => {
  const params = useParams()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"select" | "qr" | "code">("select")

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.post(`/courses/${params.id}/activate`, { code })
      // После успешной активации переходим в "Мои курсы"
      router.push("/dashboard/courses")
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || "Неверный код доступа")
    } finally {
      setLoading(false)
    }
  }

  if (mode === "qr") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setMode("select")}>
          ← Назад
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>QR-код оплаты</CardTitle>
            <CardDescription>Отсканируйте код для оплаты курса</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
              <p className="text-muted-foreground">[QR-код заглушка]</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              После оплаты курс автоматически откроется
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mode === "code") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setMode("select")}>
          ← Назад
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Введите код доступа</CardTitle>
            <CardDescription>
              Используйте специальный код для бесплатного доступа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <Input
                placeholder="Введите код"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Проверка..." : "Активировать"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Button variant="link" className="w-full" onClick={() => router.push("/dashboard")}>
          На главную
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        ← Назад
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Выберите тип оплаты</CardTitle>
          <CardDescription>
            Для доступа к курсу выберите удобный способ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" variant="outline" onClick={() => setMode("qr")}>
            QR-код
          </Button>
          <Button className="w-full" variant="outline" onClick={() => setMode("code")}>
            Код доступа
          </Button>
        </CardContent>
      </Card>

      <Button variant="link" className="w-full" onClick={() => router.push("/dashboard")}>
        На главную
      </Button>
    </div>
  )
}

export default PaymentPage