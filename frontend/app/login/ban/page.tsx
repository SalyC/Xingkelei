import { Suspense } from "react"
import BanContent from "./BanContent"

export const dynamic = "force-dynamic"

export default function BanPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Загрузка...</div>}>
      <BanContent />
    </Suspense>
  )
}