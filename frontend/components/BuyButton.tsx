"use client"

import { useRouter } from 'next/navigation'

const BuyButton = ({ courseId, className }: { courseId: number; className?: string }) => {
  const router = useRouter()

  const handleBuy = () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push(`/login?redirect=/dashboard/courses/${courseId}/payment`)
    } else {
      router.push(`/dashboard/courses/${courseId}/payment`)
    }
  }

  return (
    <button className={className} onClick={handleBuy}>
      КУПИТЬ
    </button>
  )
}

export default BuyButton