"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import Footer from "@/components/layout/Footer"

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default DashboardLayout