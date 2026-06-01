"use client"

import { useState } from "react"
import styles from "./CookieConsent.module.css"

const CookieConsent = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("cookiesAccepted") !== "true"
  })

  const handleAccept = () => {
    localStorage.setItem("cookiesAccepted", "true")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.cookieBar}>
      <span className={styles.cookieText}>
        🍪 Мы используем файлы cookie для персонализации сервисов и повышения удобства пользования сайтом. Если вы не согласны на их использование, поменяйте настройки браузера.
      </span>
      <button className={styles.acceptButton} onClick={handleAccept}>
        Принять
      </button>
    </div>
  )
}

export default CookieConsent