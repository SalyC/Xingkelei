'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const CertificatesPage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Мои сертификаты</h1>
            <Card>
                <CardHeader>
                <CardTitle>Сертификаты об окончании курсов</CardTitle>
                <CardDescription>
                    Здесь будут отображаться ваши сертификаты после успешного завершения
                    обучения.
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
                    <Link href="/dashboard/courses">
                        <Button>Перейти в купленные курсы</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}

export default CertificatesPage