"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import Footer from "@/components/layout/Footer"

interface Course {
  id: number
  title: string
  description: string
  image_url?: string
}

interface CourseProgress {
  total_lessons: number
  completed_lessons: number
  all_completed: boolean
}

const MyCoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [progressMap, setProgressMap] = useState<Record<number, CourseProgress>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/courses/my")
        const coursesData: Course[] = res.data.data
        setCourses(coursesData)

        // Получаем прогресс для каждого курса
        const progressData: Record<number, CourseProgress> = {}
        await Promise.all(
          coursesData.map(async (course) => {
            try {
              const progressRes = await api.get(`/courses/${course.id}/progress`)
              progressData[course.id] = progressRes.data.data
            } catch (err) {
              // если ошибка, считаем, что прогресса нет
              progressData[course.id] = { total_lessons: 0, completed_lessons: 0, all_completed: false }
            }
          })
        )
        setProgressMap(progressData)
      } catch (err) {
        console.error("Ошибка загрузки курсов:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const inProgressCourses = courses.filter(course => {
    const progress = progressMap[course.id]
    return progress && progress.completed_lessons > 0
  })

  // Статический список книг (замените изображения на реальные обложки)
  const books = [
    { title: "Искусство диалога", author: "Андрей Курпатов", image: "https://placehold.co/250x325/F3E5AB/000?text=Диалог" },
    { title: "Психология влияния", author: "Роберт Чалдини", image: "https://placehold.co/250x325/C8E6C9/000?text=Влияние" },
    { title: "Как разговаривать с кем угодно", author: "Лейл Лаундес", image: "https://placehold.co/250x325/BBDEFB/000?text=Общение" },
    { title: "Эмоциональный интеллект 2.0", author: "Трэвис Брэдберри", image: "https://placehold.co/250x325/FFCCBC/000?text=ЭИ" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Секция 1: Курсы для изучения */}
      <section>
        <h1 className="text-3xl font-bold mb-6">Курсы для изучения</h1>
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-blue-50">
            <p className="text-lg text-muted-foreground mb-4">У вас пока нет курсов</p>
            <Link href="/dashboard/other-courses">
              <button className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition">
                Перейти в каталог
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="block group">
                <div className="flex flex-col items-center">
                  <img
                    src={course.image_url || "/placeholder-course.jpg"}
                    alt={course.title}
                    className="w-[250px] h-[325px] object-cover rounded-[30px] group-hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg"
                  />
                  <p className="mt-3 font-semibold text-center">{course.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Секция 2: Пройденные материалы (зелёный фон, скругление 10%) */}
      {inProgressCourses.length > 0 && (
        <section className="bg-green-100 rounded-[20px] p-8">
          <h2 className="text-2xl font-bold mb-6 text-green-900">Пройденные материалы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inProgressCourses.map((course) => {
              const progress = progressMap[course.id]
              const percent = progress && progress.total_lessons > 0
                ? Math.round((progress.completed_lessons / progress.total_lessons) * 100)
                : 0
              return (
                <div key={course.id} className="flex flex-col items-center">
                  <Link href={`/dashboard/courses/${course.id}`}>
                    <img
                      src={course.image_url || "/placeholder-course.jpg"}
                      alt={course.title}
                      className="w-[250px] h-[325px] object-cover rounded-[30px] hover:scale-105 transition-transform duration-200 shadow-md"
                    />
                  </Link>
                  <p className="mt-2 font-semibold text-sm text-center">{course.title}</p>
                  {/* Прогресс-бар */}
                  {progress && progress.total_lessons > 0 && (
                    <div className="w-[250px] mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Прогресс</span>
                        <span>{progress.completed_lessons}/{progress.total_lessons}</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Секция 3: Рекомендуемая литература */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Рекомендуемая литература</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <img
                src={book.image}
                alt={book.title}
                className="w-[250px] h-[325px] object-cover rounded-[30px] shadow-md"
              />
              <p className="mt-2 font-semibold text-center">{book.title}</p>
              <p className="text-sm text-muted-foreground text-center mb-3">{book.author}</p>
              <button className="border-2 border-orange-500 text-orange-500 px-6 py-2 rounded-full font-semibold hover:bg-orange-500 hover:text-white transition">
                Читать
              </button>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default MyCoursesPage