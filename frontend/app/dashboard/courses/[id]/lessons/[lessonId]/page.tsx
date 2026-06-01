"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"

interface Lesson {
  id: number
  title: string
  content: string
  video_url?: string
  audio_url?: string
  order: number
  completed?: boolean
}

const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

const LessonPage = () => {
  const params = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await api.get(`/courses/${params.id}/lessons/${params.lessonId}`)
        setLesson(res.data.data)
      } catch (err) {
        console.error("Failed to fetch lesson:", err)
        router.push(`/dashboard/courses/${params.id}`)
      } finally {
        setLoading(false)
      }
    }
    fetchLesson()
  }, [params.id, params.lessonId, router])

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await api.post(`/courses/${params.id}/lessons/${params.lessonId}/complete`)
      setLesson((prev) => prev ? { ...prev, completed: true } : prev)
    } catch (err) {
      console.error(err)
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  if (!lesson) return null

  const youtubeId = lesson.video_url ? getYouTubeVideoId(lesson.video_url) : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/dashboard/courses/${params.id}`)}>
        ← К списку уроков
      </Button>

      <h1 className="text-3xl font-bold">{lesson.title}</h1>

      {youtubeId && (
        <div className="mb-6 aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-xl shadow-md"
          ></iframe>
        </div>
      )}

      {!youtubeId && lesson.video_url && (
        <div className="mb-6">
          <video controls className="w-full rounded-xl shadow-md" style={{ maxHeight: "500px" }}>
            <source src={lesson.video_url} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
        </div>
      )}

      {lesson.audio_url && (
        <div className="mb-6">
          <audio controls className="w-full">
            <source src={lesson.audio_url} type="audio/mp3" />
            Ваш браузер не поддерживает аудио.
          </audio>
        </div>
      )}

      <div className="prose prose-gray max-w-none">
        {lesson.content.split("\n").map((paragraph, idx) => (
          <p key={idx} className="mb-4">{paragraph}</p>
        ))}
      </div>

      <div className="flex justify-end">
        {lesson.completed ? (
          <span className="text-green-600 font-semibold">✓ Урок завершён</span>
        ) : (
          <Button onClick={handleComplete} disabled={completing}>
            {completing ? "Завершаем..." : "Завершить урок"}
          </Button>
        )}
      </div>
    </div>
  )
}

export default LessonPage