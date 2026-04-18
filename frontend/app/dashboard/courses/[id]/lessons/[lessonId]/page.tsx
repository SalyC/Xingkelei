'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Lesson {
  id: number
  title: string
  content: string
  order: number
}

const LessonPage = () => {
  const params = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await api.get(
          `/courses/${params.id}/lessons/${params.lessonId}`
        )
        setLesson(res.data.data)
      } catch (err) {
        console.error('Failed to fetch lesson:', err)
        router.push(`/dashboard/courses/${params.id}`)
      } finally {
        setLoading(false)
      }
    }
    fetchLesson()
  }, [params.id, params.lessonId, router])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-muted-foreground'>Загрузка...</p>
      </div>
    )
  }

  if (!lesson) return null

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <Button
          variant='ghost'
          onClick={() => router.push(`/dashboard/courses/${params.id}`)}
        >
          ← К списку уроков
        </Button>
        <Button>Завершить урок</Button>
      </div>

      <Card>
        <CardContent className='pt-6'>
          <h1 className='text-3xl font-bold mb-6'>{lesson.title}</h1>
          <div className='prose prose-gray max-w-none'>
            {lesson.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className='mb-4'>
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LessonPage