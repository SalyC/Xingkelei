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

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${params.id}`)
        setCourse(res.data.data.course)
        setHasAccess(res.data.data.has_access)
      } catch (err) {
        console.error("Failed to fetch course:", err)
        router.push("/dashboard/courses")
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [params.id, router])

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
        <Button variant="ghost" onClick={() => router.back()}>
          ← Назад
        </Button>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            У вас нет доступа к этому курсу
          </p>
          <Link href={`/dashboard/courses/${course.id}/payment`}>
            <Button>Приобрести курс</Button>
          </Link>
        </div>
      </div>
    )
}

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        ← Назад
      </Button>
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="text-muted-foreground">{course.description}</p>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Уроки</h2>
        <div className="space-y-3">
          {course.lessons?.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/dashboard/courses/${course.id}/lessons/${lesson.id}`}
            >
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
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
    </div>
  )
}

export default CoursePage