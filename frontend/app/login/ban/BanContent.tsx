"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const BanContent = () => {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason") || "Нарушение правил платформы"
  const dateParam = searchParams.get("date")
  const router = useRouter()

  let formattedDate = ""
  if (dateParam) {
    try {
      const date = new Date(dateParam)
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleString("ru-RU", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      }
    } catch (e) {
      // игнорируем
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
        <div className="text-red-500 text-5xl">🚫</div>
        <h1 className="text-2xl font-bold">Ваш аккаунт заблокирован</h1>
        <p className="text-muted-foreground">{reason}</p>
        {formattedDate ? (
          <p className="text-sm text-gray-500">
            Дата блокировки: {formattedDate}
          </p>
        ) : (
          <p className="text-sm text-gray-400">Дата не указана</p>
        )}
        <Button onClick={() => router.push("/")} variant="outline">
          На главную
        </Button>
      </div>
    </div>
  )
}

export default BanContent