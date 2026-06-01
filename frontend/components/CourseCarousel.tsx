"use client"

import { useRef } from 'react'
import styles from '@/app/page.module.css'

export default function CourseCarousel({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <div className={styles.carouselContainer}>
      <button className={styles.arrowButton} onClick={scrollLeft} aria-label="Прокрутить влево">
        ‹
      </button>
      <div className={styles.carouselTrack} ref={trackRef}>
        {children}
      </div>
      <button className={styles.arrowButton} onClick={scrollRight} aria-label="Прокрутить вправо">
        ›
      </button>
    </div>
  )
}