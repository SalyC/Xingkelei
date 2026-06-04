"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  is_blocked: boolean
  ban_reason?: string
  banned_at?: string
}

interface Course {
  id: number
  title: string
}

interface Lesson {
  id: number
  title: string
  video_url: string
  audio_url?: string
  content?: string
  order: number
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [userCourses, setUserCourses] = useState<Course[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const [editVideoUrl, setEditVideoUrl] = useState("")
  const [editAudioUrl, setEditAudioUrl] = useState("")
  const [editContent, setEditContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  // Для бана
  const [banReason, setBanReason] = useState("")
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banUserId, setBanUserId] = useState<number | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users")
        setUsers(res.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [])

  const refreshUsers = async () => {
    const res = await api.get("/admin/users")
    setUsers(res.data.data)
  }

  const toggleBlock = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/toggle-block`)
      refreshUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const changeRole = async (userId: number, newRole: string) => {
    await api.put(`/admin/users/${userId}/role`, { role: newRole })
    refreshUsers()
  }

  const deleteUser = async (userId: number) => {
    if (!confirm("Удалить пользователя навсегда?")) return
    await api.delete(`/admin/users/${userId}`)
    refreshUsers()
  }

  const openBanDialog = (userId: number) => {
    setBanUserId(userId)
    setBanReason("")
    setBanDialogOpen(true)
  }

  const handleBan = async () => {
    if (!banUserId || !banReason.trim()) return
    try {
      await api.post(`/admin/users/${banUserId}/ban`, { reason: banReason.trim() })
      setBanDialogOpen(false)
      refreshUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const unbanUser = async (userId: number) => {
    await api.post(`/admin/users/${userId}/unban`)
    refreshUsers()
  }

  const fetchUserCourses = async (userId: number) => {
    setSelectedUser(userId)
    try {
      const res = await api.get(`/admin/users/${userId}/courses`)
      setUserCourses(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAllCourses = async () => {
    try {
      const res = await api.get("/admin/courses")
      setAllCourses(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchLessons = async (courseId: number) => {
    setSelectedCourseId(courseId)
    try {
      // Используем пользовательский эндпоинт, который точно возвращает уроки
      const res = await api.get(`/courses/${courseId}`)
      const courseData = res.data.data?.course
      if (courseData && courseData.lessons) {
        setLessons(courseData.lessons)
      } else {
        setLessons([])
      }
    } catch (err) {
      console.error("Не удалось загрузить уроки:", err)
      setLessons([])
    }
  }

  const startEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setEditVideoUrl(lesson.video_url || "")
    setEditAudioUrl(lesson.audio_url || "")
    setEditContent(lesson.content || "")
  }

  const cancelEdit = () => {
    setEditingLessonId(null)
    setEditVideoUrl("")
    setEditAudioUrl("")
    setEditContent("")
  }

  const saveLesson = async (lessonId: number) => {
    setSaving(true)
    setMessage("")
    try {
      await api.put(`/admin/lessons/${lessonId}`, {
        video_url: editVideoUrl,
        audio_url: editAudioUrl,
        content: editContent,
      })
      setMessage("Урок обновлён")
      setEditingLessonId(null)
      if (selectedCourseId) fetchLessons(selectedCourseId)
    } catch (err) {
      console.error(err)
      setMessage("Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  if (loadingUsers) return <div className="p-6">Загрузка пользователей...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Админ-панель</h1>

      <Tabs defaultValue="users" className="w-full" onValueChange={(val) => { if (val === 'lessons') fetchAllCourses() }}>
        <TabsList>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="courses">Курсы пользователей</TabsTrigger>
          <TabsTrigger value="lessons">Уроки</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>Список пользователей</CardTitle></CardHeader>
            <CardContent>
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
                      <td className="p-2">
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user.id, e.target.value)}
                          className="border rounded p-1"
                        >
                          <option value="student">Студент</option>
                          <option value="admin">Админ</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <span className={user.is_blocked ? "text-red-600" : "text-green-600"}>
                          {user.is_blocked ? "Заблокирован" : "Активен"}
                        </span>
                        {user.is_blocked && user.ban_reason && (
                          <p className="text-xs text-gray-500">Причина: {user.ban_reason}</p>
                        )}
                      </td>
                      <td className="p-2 flex gap-1 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => toggleBlock(user.id)}>
                          {user.is_blocked ? "Разблокировать" : "Заблокировать"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openBanDialog(user.id)}>
                          Бан с причиной
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => unbanUser(user.id)}>
                          Разбанить
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteUser(user.id)}>
                          Удалить
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader><CardTitle>Курсы пользователя</CardTitle></CardHeader>
            <CardContent>
              <select className="border rounded p-2" onChange={(e) => fetchUserCourses(Number(e.target.value))} defaultValue="">
                <option value="" disabled>Выберите пользователя</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.first_name} {user.last_name} (ID: {user.id})</option>
                ))}
              </select>
              {selectedUser && (
                <div className="mt-4">
                  <h3 className="font-semibold">Курсы пользователя #{selectedUser}</h3>
                  {userCourses.length === 0 ? (
                    <p className="text-muted-foreground">Нет курсов</p>
                  ) : (
                    <ul className="list-disc pl-5">
                      {userCourses.map((c) => <li key={c.id}>{c.title}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons">
          <Card>
            <CardHeader><CardTitle>Редактирование уроков</CardTitle></CardHeader>
            <CardContent>
              <select
                className="border rounded p-2"
                onChange={(e) => fetchLessons(Number(e.target.value))}
                value={selectedCourseId || ""}
              >
                <option value="" disabled>-- курс --</option>
                {allCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {selectedCourseId && lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <div key={lesson.id} className="border rounded p-3 mt-2">
                    <p className="font-semibold">{lesson.order}. {lesson.title}</p>
                    {editingLessonId === lesson.id ? (
                      <div className="space-y-2 mt-2">
                        <div>
                          <label className="text-sm">Видео URL</label>
                          <Input value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} placeholder="YouTube или MP4" />
                        </div>
                        <div>
                          <label className="text-sm">Аудио URL</label>
                          <Input value={editAudioUrl} onChange={(e) => setEditAudioUrl(e.target.value)} placeholder="MP3 ссылка" />
                        </div>
                        <div>
                          <label className="text-sm">Текст урока</label>
                          <textarea
                            className="w-full border rounded p-2"
                            rows={5}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Содержание урока..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveLesson(lesson.id)} disabled={saving}>Сохранить</Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>Отмена</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 text-sm text-muted-foreground truncate">
                          {lesson.video_url || "Нет видео"} | {lesson.audio_url || "Нет аудио"}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => startEdit(lesson)}>Изменить</Button>
                      </div>
                    )}
                  </div>
                ))
              ) : selectedCourseId ? (
                <p className="text-muted-foreground mt-2">У курса пока нет уроков</p>
              ) : null}
              {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог бана */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Причина бана</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              className="w-full border rounded p-2"
              placeholder="Укажите причину блокировки"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleBan}>Забанить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminPage