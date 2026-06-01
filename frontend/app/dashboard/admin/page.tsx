"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  is_blocked: boolean
  created_at: string
}

interface Course {
  id: number
  title: string
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [userCourses, setUserCourses] = useState<Course[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get("/admin/users")
        setUsers(res.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [])

  const toggleBlock = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/toggle-block`)
      // обновим список пользователей
      const res = await api.get("/admin/users")
      setUsers(res.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchUserCourses = async (userId: number) => {
    setSelectedUser(userId)
    try {
      const res = await api.get(`/admin/users/${userId}/courses`)
      setUserCourses(res.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  if (loadingUsers) return <div className="p-6">Загрузка пользователей...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Админ-панель</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="courses">Курсы пользователей</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Список пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Имя</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Роль</th>
                      <th className="text-left p-2">Статус</th>
                      <th className="text-left p-2">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{user.id}</td>
                        <td className="p-2">{user.first_name} {user.last_name}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{user.role}</td>
                        <td className="p-2">
                          <span className={user.is_blocked ? "text-red-600" : "text-green-600"}>
                            {user.is_blocked ? "Заблокирован" : "Активен"}
                          </span>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleBlock(user.id)}
                          >
                            {user.is_blocked ? "Разблокировать" : "Блокировать"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Курсы пользователя</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <select
                  className="border rounded p-2"
                  onChange={(e) => fetchUserCourses(Number(e.target.value))}
                  defaultValue=""
                >
                  <option value="" disabled>Выберите пользователя</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} (ID: {user.id})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <div>
                  <h3 className="font-semibold mb-2">Курсы пользователя #{selectedUser}</h3>
                  {userCourses.length === 0 ? (
                    <p className="text-muted-foreground">Нет купленных курсов</p>
                  ) : (
                    <ul className="list-disc pl-5">
                      {userCourses.map((course) => (
                        <li key={course.id}>{course.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPage