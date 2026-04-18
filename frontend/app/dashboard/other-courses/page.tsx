'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
        const res = await api.get('/courses')
        setCourses(res.data.data)
      } catch (err) {
        console.error('Ошибка фетча каталога:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-muted-foreground'>Загрузка каталога...</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Другие курсы</h1>
        <p className='text-muted-foreground mt-1'>
          Выберите курс, чтобы получить новые знания
        </p>
      </div>

      {courses.length === 0 ? (
        <div className='bg-white rounded-lg p-12 text-center'>
          <p className='text-lg text-muted-foreground'>Курсы пока не добавлены</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {courses.map((course) => (
            <Card key={course.id} className='flex flex-col h-full'>
              {course.image_url && (
                <div className='aspect-video w-full overflow-hidden rounded-t-lg'>
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className='w-full h-full object-cover'
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className='flex-1'>
                <p className='text-2xl font-bold text-primary'>
                  {course.price === 0 ? 'Бесплатно' : `${course.price} ₽`}
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/dashboard/courses/${course.id}`} className='w-full'>
                  <Button className='w-full'>Подробнее</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default OtherCoursesPage