"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface User {
  first_name: string
  last_name: string
  email: string
  role: string
}

const Header = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me")
        setUser(res.data.data)
      } catch (err) {
        console.error("Failed to fetch user", err)
        localStorage.removeItem("access_token")
        router.push("/login")
      }
    }
    fetchUser()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    router.push("/login")
  }

  if (!user) return null

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()

  return (
    <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{user.first_name} {user.last_name}</h2>
          <p className="text-sm text-muted-foreground">{user.role === "student" ? "Студент курса" : user.role}</p>
        </div>
      </div>
      <Button variant="ghost" onClick={handleLogout}>
        Выйти
      </Button>
    </header>
  )
}

export default Header