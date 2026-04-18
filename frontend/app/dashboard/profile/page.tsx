"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ProfilePage = () => {
  const router = useRouter()
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
  })
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me")
        const { first_name, last_name, email } = res.data.data
        setProfile({ first_name, last_name, email })
      } catch (err) {
        console.error("Failed to load profile", err)
      }
    }
    fetchProfile()
  }, [])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value })
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await api.put("/auth/profile", profile)
      setMessage({ type: "success", text: "Профиль обновлён" })
      setProfile(res.data.data)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setMessage({ type: "error", text: error.response?.data?.error || "Ошибка обновления" })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm_password) {
      setMessage({ type: "error", text: "Новые пароли не совпадают" })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      await api.post("/auth/change-password", {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      })
      setMessage({ type: "success", text: "Пароль изменён" })
      setPasswords({ current_password: "", new_password: "", confirm_password: "" })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setMessage({ type: "error", text: error.response?.data?.error || "Ошибка смены пароля" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Профиль</h1>
        <p className="text-muted-foreground mt-1">
          Управляйте своими личными данными
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Личная информация</CardTitle>
              <CardDescription>
                Измените ваше имя, фамилию или email
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Имя</label>
                  <Input
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleProfileChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Фамилия</label>
                  <Input
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleProfileChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    required
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <div className="px-6 pb-6">
                <Button type="submit" disabled={loading}>
                  {loading ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Смена пароля</CardTitle>
              <CardDescription>
                Используйте надёжный пароль, который вы не используете на других
                сайтах
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Текущий пароль</label>
                  <Input
                    name="current_password"
                    type="password"
                    value={passwords.current_password}
                    onChange={handlePasswordChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Новый пароль</label>
                  <Input
                    name="new_password"
                    type="password"
                    value={passwords.new_password}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Подтверждение нового пароля
                  </label>
                  <Input
                    name="confirm_password"
                    type="password"
                    value={passwords.confirm_password}
                    onChange={handlePasswordChange}
                    required
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <div className="px-6 pb-6">
                <Button type="submit" disabled={loading}>
                  {loading ? "Обновление..." : "Сменить пароль"}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProfilePage