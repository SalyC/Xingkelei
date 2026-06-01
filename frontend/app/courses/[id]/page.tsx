"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import BuyButton from "@/components/BuyButton"

interface Lesson {
  id: number
  title: string
  video_url?: string
  audio_url?: string
}

interface Course {
  id: number
  title: string
  description: string
  lessons: Lesson[]
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

const PublicCoursePage = () => {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/public/courses/${params.id}`, {
          signal: controller.signal,
        })
        setCourse(res.data.data)
      } catch (err) {
        if (axios.isCancel(err)) return
        console.error("Failed to load course", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
    return () => controller.abort()
  }, [params.id])

  if (loading) return <div className="p-6 text-center">Загрузка...</div>
  if (!course) return <div className="p-6 text-center">Курс не найден</div>

  const demoLesson = course.lessons?.[0]
  const youtubeId = demoLesson?.video_url ? getYouTubeVideoId(demoLesson.video_url) : null

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <Button variant="ghost" onClick={() => router.push("/")}>← На главную</Button>
      <h1 className="text-4xl font-bold">{course.title}</h1>
      <p className="text-lg text-muted-foreground">{course.description}</p>

      {demoLesson && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Демо-урок: {demoLesson.title}</h2>
          {youtubeId ? (
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl shadow-md"
              ></iframe>
            </div>
          ) : demoLesson.video_url ? (
            <video controls className="w-full rounded-xl shadow-md" style={{ maxHeight: "500px" }}>
              <source src={demoLesson.video_url} type="video/mp4" />
            </video>
          ) : null}
          {demoLesson.audio_url && (
            <audio controls className="w-full mt-4">
              <source src={demoLesson.audio_url} type="audio/mp3" />
              Ваш браузер не поддерживает аудио.
            </audio>
          )}
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <BuyButton courseId={course.id} className="bg-[#1a2a36] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#E6B422] hover:text-black transition-colors" />
        <Button variant="outline" onClick={() => router.push("/register")}>Зарегистрироваться</Button>
      </div>
    </div>
  )
}

export default PublicCoursePage