import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "Клуб Синкэлэй",
  description: "Облачная платформа цифрового образования",
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

export default RootLayout