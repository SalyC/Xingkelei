"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import BuyButton from "@/components/BuyButton"
import Footer from "@/components/layout/Footer"

interface Course {
  id: number
  title: string
  description: string
  price: number
  image_url?: string
}

const OtherCoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses")
        setCourses(res.data.data)
      } catch (err) {
        console.error("Ошибка загрузки каталога:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Загрузка каталога...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Другие курсы</h1>
        <p className="text-muted-foreground mt-1">
          Выберите курс, чтобы получить новые знания
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-lg text-muted-foreground">
            Все доступные курсы уже у вас!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="flex flex-col items-center">
              <img
                src={course.image_url || "/placeholder-course.jpg"}
                alt={course.title}
                className="w-[250px] h-[325px] object-cover rounded-[30px] hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg"
              />
              <p className="mt-2 font-semibold text-lg text-center">
                {course.title}
              </p>

              <BuyButton courseId={course.id} className="mt-3 w-[250px] bg-[#1a2a36] text-white py-2 rounded-full font-semibold hover:bg-[#E6B422] hover:text-black transition-colors" />

              <Link
                href={`/courses/${course.id}`}
                className="mt-2 text-sm text-muted-foreground hover:text-[#E6B422] underline transition-colors"
                prefetch={false}
              >
                Подробнее о курсе →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OtherCoursesPage