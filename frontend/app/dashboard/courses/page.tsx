'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Course {
  id: number
  title: string
  description: string
  image_url?: string
}

const MyCoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses/my')
        setCourses(res.data.data)
      } catch (err) {
        console.error('Ошибка фетча курсов:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-muted-foreground'>Загрузка...</p>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold'>Мои курсы</h1>
        <div className='bg-white rounded-lg p-12 text-center'>
          <p className='text-lg text-muted-foreground mb-4'>У вас пока нет курсов</p>
          <Link href='/dashboard/other-courses'>
            <Button>Перейти в каталог</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Мои курсы</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {courses.map((course) => (
          <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
            <Card className='hover:shadow-lg transition-shadow cursor-pointer h-full'>
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
              <CardContent>
                <Button variant='outline' className='w-full'>
                  Продолжить
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default MyCoursesPage