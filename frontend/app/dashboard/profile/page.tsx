"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Footer from "@/components/layout/Footer"

interface Course {
  id: number
  title: string
  description: string
  image_url: string
}

const ProfilePage = () => {
  const router = useRouter()
  const [profile, setProfile] = useState({ first_name: "", last_name: "", email: "", avatar_url: "" })
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm_password: "" })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [promoCode, setPromoCode] = useState("")
  const [activating, setActivating] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, coursesRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/courses/my")
        ])
        const { first_name, last_name, email, avatar_url } = profileRes.data.data
        setProfile({ first_name, last_name, email, avatar_url: avatar_url || "" })
        setMyCourses(coursesRes.data.data)
      } catch (err) {
        console.error("Failed to load profile data", err)
      }
    }
    fetchData()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    setLoading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append("avatar", avatarFile)
      const res = await api.post("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setProfile({ ...profile, avatar_url: res.data.avatar_url })
      setAvatarFile(null)
      setAvatarPreview(null)
      setMessage({ type: "success", text: "Аватар обновлён" })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setMessage({ type: "error", text: error.response?.data?.error || "Ошибка загрузки" })
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoCode.trim()) return
    setActivating(true)
    setMessage(null)
    try {
      await api.post("/courses/activate", { code: promoCode.trim() })
      setMessage({ type: "success", text: "Курс успешно активирован!" })
      const updatedCourses = await api.get("/courses/my")
      setMyCourses(updatedCourses.data.data)
      setPromoCode("")
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setMessage({ type: "error", text: error.response?.data?.error || "Неверный промокод" })
    } finally {
      setActivating(false)
    }
  }

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
        <p className="text-muted-foreground mt-1">Управляйте своими данными и курсами</p>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Личная информация</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="courses">Мои курсы</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Личная информация</CardTitle>
              <CardDescription>Измените ваше имя, фамилию, email и аватар</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} />
                  ) : profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} />
                  ) : (
                    <AvatarFallback>
                      {profile.first_name[0]}{profile.last_name[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Выбрать фото
                  </Button>
                  {avatarFile && (
                    <Button onClick={handleAvatarUpload} disabled={loading} className="ml-2">
                      Загрузить аватар
                    </Button>
                  )}
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Имя</label>
                  <Input name="first_name" value={profile.first_name} onChange={handleProfileChange} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Фамилия</label>
                  <Input name="last_name" value={profile.last_name} onChange={handleProfileChange} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input name="email" type="email" value={profile.email} onChange={handleProfileChange} required disabled={loading} />
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Сохранение..." : "Сохранить изменения"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Смена пароля</CardTitle>
              <CardDescription>Используйте надёжный пароль, который не используете на других сайтах</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Текущий пароль</label>
                  <Input name="current_password" type="password" value={passwords.current_password} onChange={handlePasswordChange} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Новый пароль</label>
                  <Input name="new_password" type="password" value={passwords.new_password} onChange={handlePasswordChange} required minLength={6} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Подтверждение нового пароля</label>
                  <Input name="confirm_password" type="password" value={passwords.confirm_password} onChange={handlePasswordChange} required disabled={loading} />
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Обновление..." : "Сменить пароль"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Мои курсы</CardTitle>
              <CardDescription>Активируйте новый курс с помощью промокода</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleActivate} className="flex gap-2">
                <Input
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={activating}
                />
                <Button type="submit" disabled={activating}>
                  {activating ? "Проверка..." : "Активировать"}
                </Button>
              </form>

              {myCourses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {myCourses.map((course) => (
                    <div key={course.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <img src={course.image_url} alt={course.title} className="w-12 h-12 object-cover rounded" />
                      <div>
                        <p className="font-semibold">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">У вас пока нет активных курсов.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Footer />
    </div>
  )
}

export default ProfilePage