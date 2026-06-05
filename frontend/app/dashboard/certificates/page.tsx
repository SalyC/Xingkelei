"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Certificate {
  id: number
  course_id: number
  course_title: string
  issued_at: string
  file_url: string
}

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await api.get("/certificates/my")
        setCertificates(res.data.data || [])
      } catch (err) {
        console.error("Failed to fetch certificates:", err)
        setCertificates([])
      } finally {
        setLoading(false)
      }
    }
    fetchCertificates()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Мои сертификаты</h1>
      {certificates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Сертификаты об окончании курсов</CardTitle>
            <CardDescription>
              Здесь будут отображаться ваши сертификаты после успешного завершения обучения.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center py-8">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" />
                <path d="M2 7l10 5 10-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              У вас нет сертификата. Время исправить!
            </p>
            <Link href="/dashboard/other-courses">
              <Button>Перейти в каталог курсов</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <CardTitle>{cert.course_title}</CardTitle>
                <CardDescription>
                  Выдан: {new Date(cert.issued_at).toLocaleDateString("ru-RU")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cert.file_url ? (
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api','')}${cert.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    download
                  >
                    Скачать PDF
                  </a>
                ) : (
                  <span className="text-muted-foreground">Файл не найден</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default CertificatesPage