"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

interface Lesson {
  id: number
  title: string
  order: number
  completed?: boolean
}

interface Course {
  id: number
  title: string
  description: string
  lessons: Lesson[]
}

const CoursePage = () => {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalLessons, setTotalLessons] = useState(0)
  const [completedLessons, setCompletedLessons] = useState(0)
  const [allCompleted, setAllCompleted] = useState(false)
  const [issuing, setIssuing] = useState(false)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          api.get(`/courses/${params.id}`),
          api.get(`/courses/${params.id}/progress`),
        ])
        const courseData = courseRes.data.data.course
        setCourse(courseData)
        setHasAccess(courseRes.data.data.has_access)
        const progress = progressRes.data.data
        setTotalLessons(progress.total_lessons)
        setCompletedLessons(progress.completed_lessons)
        setAllCompleted(progress.all_completed)

        // обновим completed у уроков, если бэкенд вернул список с отметками
        if (courseData.lessons && progress.completed_lesson_ids) {
          const completedIds: number[] = progress.completed_lesson_ids
          courseData.lessons = courseData.lessons.map((l: Lesson) => ({
            ...l,
            completed: completedIds.includes(l.id),
          }))
          setCourse({ ...courseData })
        }
      } catch (err) {
        console.error("Failed to fetch course:", err)
        router.push("/dashboard/courses")
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [params.id, router])

  const handleGetCertificate = async () => {
    setIssuing(true)
    try {
      await api.post(`/courses/${params.id}/complete`)
      alert("Сертификат получен! Проверьте раздел «Мои сертификаты».")
      router.push("/dashboard/certificates")
    } catch (err: unknown) {
      console.error(err)
      alert("Не все уроки завершены или произошла ошибка.")
    } finally {
      setIssuing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  if (!course) return null

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>← Назад</Button>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-lg text-muted-foreground mb-4">У вас нет доступа к этому курсу</p>
          <Link href={`/dashboard/courses/${course.id}/payment`}>
            <Button>Приобрести курс</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/dashboard/courses")}>
        ← К моим курсам
      </Button>
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="text-muted-foreground">{course.description}</p>

      {/* Прогресс */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Прогресс: {completedLessons} / {totalLessons} уроков
            </span>
            {allCompleted ? (
              <span className="text-green-600 font-semibold">✓ Все уроки пройдены</span>
            ) : (
              <span className="text-muted-foreground">Продолжите обучение</span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${totalLessons ? (completedLessons / totalLessons) * 100 : 0}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Список уроков */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Уроки</h2>
        <div className="space-y-3">
          {course.lessons?.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/dashboard/courses/${course.id}/lessons/${lesson.id}`}
            >
              <Card className={`hover:bg-gray-50 transition-colors cursor-pointer ${lesson.completed ? 'border-green-300' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {lesson.completed && <span className="text-green-500">✓</span>}
                      {lesson.order}. {lesson.title}
                    </CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Кнопка получения сертификата */}
      {allCompleted && (
        <div className="flex justify-center pt-4">
          <Button onClick={handleGetCertificate} disabled={issuing} size="lg">
            {issuing ? "Выпуск сертификата..." : "Получить сертификат"}
          </Button>
        </div>
      )}
    </div>
  )
}

export default CoursePage