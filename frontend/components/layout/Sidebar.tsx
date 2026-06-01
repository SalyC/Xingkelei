"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

// ===== SVG-строки (ваши исходные иконки) =====
const myCoursesSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="30" height="30" fill="url(#pattern0_474_156)"/>
<defs>
<pattern id="pattern0_474_156" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_474_156" transform="matrix(0.0141267 0 0 0.0139925 -0.0706336 -0.108675)"/>
</pattern>
<image id="image0_474_156" width="90" height="90" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFdklEQVR4nO2cTYgcVRDHO/iJnhREg7rrTv/rTVfN7kZd1IPGFWMkKoiC4FHWg6cYhVxET2r0oB70oBCDJ0FBMa4GLx6Mgho/gl9REwVBD3rSzWb9Skx2W2q7Q9pxZrp7umf69eT9oNidw3RX/ftNvXr13oznORwOh8PhcDgcDofD4XA4+oJILgXkMYA/BuQXgP+J/+rrbUStdVX7WGuCIDBEMk8kYZoBsrPRYKra59rh+7KJSBaziJwQe8n35daqfa8NRMEtRHIsj8gJO2YM31R1DHVJF4f6FDmMbRFo+VXHYjVE/EZBkcMojfBrVcdiLQBfVobIFNmKq0a6oCVciUKHRPxI1TFZidbF5Qote6qOyUp0EVKm0ID8XI5fwUZAdgByAOA/YtsP8PNEfINXNwqUdGG3Uq9oBQTIexnu826tFkslixyq9e8LX0vECznmgwUiXu/VAVuEDlZr+TwiH09V/JvvCzzbsSV1IFu66Dayd3u2AOC8ZrM5JSKn2zYZAsHGovc1hjd4FXIKIHMAf5Fwau/MzMxpNpV3gOwo/oB5u1cFvs8tQD7q/PQnpxNBbqt6wQLIgRKE3u8NG21bEvGf3Z2auijZ4C9R6JXkQ8yKtlqLCy1LpQvZ22m+O2WC29ch0J0ljeZX+/O5ZkIDrRsBPpri0Fz7+7Twz9vwp/+LfJBoqtGf36Wkjm9LETGDs5ImFsCf6gTZ6f1EfHORxr/vy6YCvtdmMlyTXj3wQrPZbPa6iO6SUO6RzQeLiKxo76Ko0MbI9d6gMYbvTHnaR7PWmUDL1wZ+1FvuGdyK5uR+00U72rsokLbe8YaB5qdeIhPJXXmvSdRaB8ijWhfrIgTgI/pXX2sJ10910YtonrB4CW6MmeiVLurUUiTi9SpcHpGH1lTy/eDyLo7sTcvJNtKIRvbuLOliqM0k7V0QyWcJJ76OS7iO1UVdMIY3aCWhaRHg32PT/7cPZeLrJrbmzEZDxipxwOFwnMyMj8sFgNwByJNEvEv7IoD8qvnx+OIEkB+jtiu/ScQPEwW3T0xMnl+179YzNjZ1DhDcH9XHstznomE5XnBsFpFzq47JxtH7DJH8VXT5S/+pbWUJkCfcKI+aOHMlHGoMU0x7JvdoHyarX7Ozs6f6fuu6eEU6H53jWE1dR6KGFy9E5zzkLUAeMKZ1hZVlrO4bAvL6gAUO2+zttHTSbDYvAfipPKvCxCdIH8Tj+gn1bEB3VQD5bsgih7F932kVNz09fXY08crhEu7xt15rfHz8zGoUPjFifqhI5DAy/sn3WxcnfJoqo+Hf4T7fVHKiVZ9w2y54lbZv7dqZs4yRa4rv6PS0RWNaVw9VaCJ51gKBw4TNR9teg72PHoosu5XblUYjmCxQG4d1N61a9BM0cKGJ5MWqg6XqbevAhY53RKoONKx6VA9c6KqDJDtsxQlNwzEnNJ28Qq8QyQu64alFvzF8m04mRPIcEX9Q0gouzQ4D/H50T9mqPmiZFvmkvqUeg6iF0E+nLX6ixQY/BPAn/QTd6eFG1+IH9dppS+i441hvofN+xRir/RO+D5Cv8t+LvyTiLcmTrVnQnknthc7T0myHiK8C5OWUBdIywC8RyZVe/6wZBaELo0fE4mMCyVOtKv4rxkwGdY3LWoca0UGYXbq3WPZBFyf0kLAuLuscGtW4rHNoVOOyzqFRjcs6h0Y1LuscGtW4rHNoVOOyzqFRjcs6h0Y1rhOnQC1xqBqhD3mDJu8vF3ijKfSeITjEW5zQsnngDgE4I88pJa8mUMZ4AP68/YdgBkbcnM8ktlcTKKPIRHThUB3TkU0k90bfgu0+QXo1gbqLq7F9GH/zYDgj2eFwOBwOh8PhcDgcDofDs5t/AXVk+8wXM9xZAAAAAElFTkSuQmCC"/>
</defs>
</svg>`

const otherCoursesSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="30" height="30" fill="url(#pattern0_315_88)"/>
<defs>
<pattern id="pattern0_315_88" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_315_88" transform="translate(-0.0322581 -0.0322581) scale(0.011828)"/>
</pattern>
<image id="image0_315_88" width="90" height="90" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFMElEQVR4nO2cW4gcRRSGy/v9hkJcXTPs9H96+pzZbNQVBRFXISL4ovggqEFBFPVJYkDxQRFEkYCIqKgxIoE8iAZBvEu8xEtEDYGYB6Mh6IO3ICoRN/GS3ZazO7uuuJPMznTXqZ7uH36Yp5o6H9WnqvtUlXOVKlWqVC7VarUjrftQChHJNoBXR1HzDOu+9LUAeZ9IUiLZC8gqAMdb96kvBchzLdAt8w9Ecr1z7iDrvvWVAH7ov6CnDfAHSZLE1v3rG8Wx3D4f6NboHgf4tmp0Z6A4Tm5sD3pmdMuGJEkGsvi/0iruAHQL9vdR1LzIur99D5qm8/bfgNxp3ee+B03/+onR0dHDrPteKBHJTV2A1ony5cHBwaOs+18YEcld3YGeytsb6/X6CdYxFEKAPNIt6Fbe/qR6m+xAmgJ6Ad1KIx+JyLGd/F9pBfDO3kFPwX6zmiDbaPHiJScRyUQ2oKdy9tPt/qvUimO+IivIc2CvsI4rOAH8aNagiWQfkFxiHVtIOhiQ73IArfl6V60mp7qiamRk5BhArs2iLSJelg/k2RTySiG/+gHJ2MwKQSex3tuTV/ME3fLNrigaGxs7lEgenrs6qNeZemmTSM4kksn8QfOvQ0PDi1zo0pcAQF77/2OZjPXSLhG/62E0z8Be50KWTiZEsnn+/Mda9ehKAC/3B3kW9oUuRMVxfAog2/cz0aztpl1NOYD85hu0VtpdaBoYGD2aSDYdoOPbF9quTqCAfO5/NM+mu6DW1ocQ8Uuddb7JC8n1RPKxFeSWN7lQRMT3LuBxvLuTNhuNxmkAf2oMecbnOmtpJ7Qm1zlo3nqgNqOoebEWVQMAPNPnZ511Xt7f5NfOUZuqtFY9AH7Sz1p5Qd6TJMnJzkq6563Ljr839zVXKx2aUgD+OQCo7Ub1rSaQdRenbjDsoeM3RFHzfN0RSiS7rUF24LdMQBPJMwEEn3oc0X9l8a1mgZCbrN9vrYMn/7CXewYtj1sHTTagV3s90kDEv1gHTTbe5g00kVwdQMCpkSe95Wkifj2AgFM787LcIev+B93kbR+smBngW3IHTcTnWQdK5qBllQfQstI6UDI3r/cAml+wD1SsvdkDaNkSQKCpsb/yAJp3BRBoamn9fOsBtOyxDpTsvdsH6Mx2cFJxvc8D6HKvoWnKPJ47aEB+sg9UrEH/6AP01/aBijXoHbmD1jMf9oGKNeh3fIBeZx+omFqLx7mDBuQ+60DJ3itzBx1FfFUAgaa2I7q3HbEdqV6XxdaBkq33ers0C5Bvyzua+W0vkFug15YXtKwo9Bk/KoYniOh0b6D1CgaAfy/haN7gfEt3V1oHTp6tT7IF6LPKNZr5Cz1I6h10C/aH1gDIn/XiQhvpHucAAKQevEWPjjhLEfEbAYBIc/RkEEfg4nh4RLezBgAkzclrXCgC5J4AgKTZm3c0Go3jXEhnvvUiKHswkqX/iKLkbBea4jge6qOtCJOAXONCVaMxfE4/FG8BvsOFLqLmlQD/WWDID7iiiIgvK+BGm8lCjOT5XmaKszWBx70fAspSwJLB0KvmgHyp7wKu6BKRwwG5P8C8PQHwY0Gtk7NQHA8nWgYKZML7TFdIrp8Vx3JBNpe3dgV4K1FynfkHIt9XTxDJGg/nFfWs+vNR1LzUlVkAjogivlyhd3MdxfwjV1c7vF6vpq/Vlp5oHWOQGhoaXqQlI13TAvyU1um0ugHINzr69Uvh9MQ69XunpgNAXiTiB/W2BKLmUrNKSKVKlSpVqlSpUqVKlSq5AuofNGAUUJpIjLwAAAAASUVORK5CYII="/>
</defs>
</svg>`

const certificatesSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="30" height="30" fill="url(#pattern0_315_93)"/>
<defs>
<pattern id="pattern0_315_93" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_315_93" transform="translate(-0.0769231 -0.0769231) scale(0.0128205)"/>
</pattern>
<image id="image0_315_93" width="90" height="90" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFLUlEQVR4nO2cTYgcRRTH34rGk9/gB2iWzLz/TL83mw9d73uMelGTeNXEEATJquhBVDCLYIw3Ez+IcQW9JqAiHpJ1c5boUU/ZiODJaKIuJApqGKmd3mQy6emdj96pV731gwfLbk931W9ra6urXhVRJBKJRCKRSKSNSqVyC7McAeQPF+5r9732ayLDMwboHKDN9mDWefezAu4fcQDJk52S22TvWrookg2gW5hld7WqD01NTV3f7br16zfeBsgv3UQD+muSJHd0+7y7NyCPALqHWe6ntQSzvNsh6zTQ2NZ53fj45luZ9escyWmrlpPuF3LtcxrbAVnouP59WgsAjW05wk4B+hKgewF9B9DFlSS3xSKzHgR02t0jvVeX5zS2U9nhpZFDz/JWK2ap7AB61L9oOUZlh1k/9y3alYHKDjLGwx5ijsoMM9/IrOd8i2bW31R1HZUVQN/2LflKyAEqY0sG5ACgl/wLvhyXXJlc2ShAxpj1CTd8SkcXRwE5YaG7yOlGzrkyXimvzjLrDrIMoB/4FofiwuYbZLWaPGBATrPg2ELWAPQZA2KaBcceskatJg8bENMsMtzMIlkjnY7snCkLOOTM5OTkDWSR1rSkb0FaSFgfeYwxy7fhS5bvzC+R1Wr6om9RGDJcHcg6gDznWxSGj2myDrMcMiCqOUy4pTayTGshta/lp6bRWMxagzSBqt7uFkkNSGoW1KpPujqRIcZaeRe5KQHNEINZzjPL80R0nVfDaTrAvG8hGEHr9pp+xqwf+ZaA0ck+4k10K+HQvwSMJOT3KBojadHn13oyTHNEog97zlleOTcOgYerIzPfTJ6Jw7vRv7CUaqg3Z+2F5apxdUlewf90dSHLlGNSSQ+SddL85MBFJ8+Sdcow8c+cvEDWycu0RyDh6kCWKdPiLDL21JighOkGC3m7xbyRbjFrlimq1cZWskYZU8KYZTdZw22W9C0GBUetNrGJLMIs75WoNR8iy7j/1un06XIi+nG3Z8SuUFc2Ob5c3lbZk8cpRFR1Xbp/xdrWirdKuWkIhjYLMct+KitsZPubOxGhlC3Z3oZOOUEhUq3Koxs2TNxVti3K4+N6d60mj5EFAJlJ+7x/APmSWd90p8Iwb7y3y/XHfIt2o4usslWrjftaZZf9zPpVq05LfwEzZEFyl3gq+zM6azUZBtCdOd3NjEXJrmCvZX2OWXfkCDiVzmdPpys1Ax2M4u6RP12bPU5m1tdXqNOMMclL/eBnvb9BykLWqTC95va5dICsNb6so37ylqlc17fyL3REsnuRnMZf9Xr9pu73aWxuHV7V2Jo3HelWogE5m1Pxs3mr1e7e7hnM8nTe3IXL2wD0797qtsqy+5C83Hr2FfFcZt2V85ydRTwDkDdMnI7Qr+S0z71Qr9frBW3mn8/qMorYPcWsCsjFfutXeMseRHJ7/1upbLqzoCMzP0yzh1wcLiJNy43/meXHIeo3Y0Dy5Zb3k8XD/er1iQcB+XnY+g0tuwjJbd3Iv60pyIZkPStJknsAeRXQH4bZqJNuWPoe0Ffcm13WNZVKMgHox4D+V1T9BpZdpGRcG6cB/SLtCj4B9Jsi38Kuflt199ZPW7sT3PBNzqxevUY+zh64i9lXVBmY9eVBy0Gh4FvysLIpFCxIHkY2hYIVyYPKplCwJHkQ2RQK1iT3K5tCwaLkfmRTKFiV3KtsCgXLknuRTaFgXfJKsikUQpCcJ5tCIRTJ3WRTKIQkOUs2hUJokjtlUyh4TzhZo2WPRCKRSCRCEfofcsPU7JrBaAoAAAAASUVORK5CYII="/>
</defs>
</svg>`

const logoutSvg = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="30" height="30" fill="url(#pattern0_315_95)"/>
<defs>
<pattern id="pattern0_315_95" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_315_95" transform="translate(-0.123066 -0.0845333) scale(0.0133333)"/>
</pattern>
<image id="image0_315_95" width="90" height="90" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>`

// ===== Компоненты иконок (применяем фильтр для перекраски) =====
const Icon = ({ svgString, active }: { svgString: string; active?: boolean }) => (
  <span
    dangerouslySetInnerHTML={{ __html: svgString }}
    style={{
      display: "inline-flex",
      filter: active
        ? "invert(39%) sepia(83%) saturate(3587%) hue-rotate(179deg) brightness(96%) contrast(101%)"
        : "none",
    }}
  />
)

const MyCoursesIcon = ({ active }: { active: boolean }) => <Icon svgString={myCoursesSvg} active={active} />
const OtherCoursesIcon = ({ active }: { active: boolean }) => <Icon svgString={otherCoursesSvg} active={active} />
const CertificatesIcon = ({ active }: { active: boolean }) => <Icon svgString={certificatesSvg} active={active} />
const LogoutIconComponent = () => <Icon svgString={logoutSvg} /> // без фильтра, всегда красный

// ===== Навигация =====
const navItems = [
  { name: "Мои курсы", href: "/dashboard/courses", icon: MyCoursesIcon },
  { name: "Другие курсы", href: "/dashboard/other-courses", icon: OtherCoursesIcon },
  { name: "Мои сертификаты", href: "/dashboard/certificates", icon: CertificatesIcon },
]

// ===== Компонент Sidebar =====
const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{
    first_name: string
    last_name: string
    role: string
    avatar_url?: string
  } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me")
        setUser(res.data.data)
      } catch (err) {
        console.error("Failed to fetch user", err)
        localStorage.removeItem("access_token")
        router.push("/login")
      }
    }
    fetchUser()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    router.push("/login")
  }

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : "?"
  const closeSidebar = () => setIsOpen(false)

  const burgerButton = (
    <button
      className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md"
      onClick={() => setIsOpen(!isOpen)}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    </button>
  )

  const overlay = isOpen && (
    <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={closeSidebar} />
  )

  const sidebarContent = (
    <aside className="w-80 border-r bg-white p-4 flex flex-col h-screen">
      <div className="font-bold text-xl mb-6 text-[#1e2a32] border-l-4 border-[#0099EC] pl-3">
        Клуб Синкэлэй
      </div>

      {user && (
        <Link href="/dashboard/profile" prefetch={false} className="block mb-6" onClick={closeSidebar}>
          <div
            className="flex items-center gap-4 p-4 rounded-[30px] hover:opacity-90 transition"
            style={{ backgroundColor: "rgba(217, 217, 217, 1)", width: "100%", height: "110px" }}
          >
            <Avatar className="h-12 w-12">
              {user.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.first_name} />
              ) : (
                <AvatarFallback className="bg-[#0099EC] text-white">{initials}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-gray-700">
                {user.role === "admin" ? "Админ" : "Студент курса"}
              </p>
            </div>
          </div>
        </Link>
      )}

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          const IconComponent = item.icon
          return (
            <Link key={item.href} href={item.href} onClick={closeSidebar}>
              <div
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-full text-base font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-[#e6f4ff] text-[#0099EC]"
                    : "hover:bg-[#f0f8ff] text-[#1e2a32]"
                }`}
              >
                <IconComponent active={active} />
                <span>{item.name}</span>
              </div>
            </Link>
          )
        })}

        {user?.role === "admin" && (
          <Link href="/dashboard/admin" prefetch={false} onClick={closeSidebar}>
            <div
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-full text-base font-medium transition-colors cursor-pointer ${
                pathname === "/dashboard/admin"
                  ? "bg-[#e6f4ff] text-[#0099EC]"
                  : "hover:bg-[#f0f8ff] text-[#1e2a32]"
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z"
                  stroke={pathname === "/dashboard/admin" ? "#0099EC" : "#1e2a32"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Админ-панель</span>
            </div>
          </Link>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <Link href="https://t.me/YangChessmanClub" prefetch={false} target="_blank" className="w-full" onClick={closeSidebar}>
            <Button
              className="w-full h-[89px] rounded-[20px] text-white font-semibold text-lg"
              style={{ backgroundColor: "rgba(0, 153, 236, 1)" }}
            >
              Вступить в клуб в tg
            </Button>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-full text-base font-medium hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogoutIconComponent />
            <span>Выйти</span>
          </button>
        </div>
      </nav>
    </aside>
  )

  return (
    <>
      {burgerButton}
      {overlay}
      <div className={`fixed top-0 left-0 z-40 h-full md:relative md:block ${isOpen ? "block" : "hidden"}`}>
        <div className="h-full transform transition-transform duration-300 ease-in-out md:translate-x-0">
          {sidebarContent}
        </div>
      </div>
    </>
  )
}

export default Sidebar