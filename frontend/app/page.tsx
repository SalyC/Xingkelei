import styles from './page.module.css'
import Image from 'next/image'
import Link from 'next/link'
import { FaqAccordion } from '@/components/FaqAccordion'
import CourseCarousel from '@/components/CourseCarousel'
import BuyButton from '@/components/BuyButton'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  const speakers = [
    { name: 'Бобров Иван', avatar: '/bobrov.png', quote: '«Ведя урок по Харизме вдруг осенило, что это самые базовые вещи, которые должны объясняться в детстве»' },
    { name: 'Денисенко Дмитрий', avatar: '/denisenko.png', quote: '«Ведя урок по Харизме вдруг осенило, что это самые базовые вещи, которые должны объясняться в детстве»' },
    { name: 'Бахтурин Виталий', avatar: '/bakturin.png', quote: '«Ведя урок по Харизме вдруг осенило, что это самые базовые вещи, которые должны объясняться в детстве»' },
    { name: 'Конюшенко Богдан', avatar: '/konyushenko.png', quote: '«Ведя урок по Харизме вдруг осенило, что это самые базовые вещи, которые должны объясняться в детстве»' },
  ]

  const courses = [
    { id: 1, title: 'УПРАВЛЕНИЕ ФИНАНСАМИ', image: '/javoronok.png' },
    { id: 2, title: 'ЦЕНА ВРЕМЕНИ', image: '/finance.png' },
    { id: 3, title: 'ПСИХОЛОГИЯ', image: '/psychology.png' },
    { id: 4, title: 'ОБЩЕНИЯ', image: '/timemanagement.png' },
  ]

  return (
    <main className={styles.body}>
      <div className={styles.container}>
        <section className={`${styles.section} ${styles.heroSection}`}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleRow}>
                <span>Клуб</span>
                <span className={styles.heroSlogan}>
                    <svg width="20" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="10" fill="#0099EC"/>
                      <path d="M10 5V15" stroke="white" strokeLinecap="round"/>
                      <path d="M5 10H15" stroke="white" strokeLinecap="round"/>
                    </svg>
                  Ты сможешь изменить жизнь
                </span>
              </span>
              <span className={styles.heroAccent}>СИНКЭЛЭЙ</span>
            </h1>
          </div>
          <div className={styles.statsRow}>
            <Image src="/4courses.png" alt="4 курса" width={160} height={80} className={styles.statImage} />
            <Image src="/20materials.png" alt="20+ материалов" width={180} height={80} className={styles.statImage} />
          </div>

          {/* Главное фото + кнопки Вход/Регистрация */}
          <div className={styles.heroImageContainer}>
            <Image
              src="/mainphoto.png"
              alt="Клуб Синкэлэй"
              width={400}
              height={400}
              className={styles.heroImage}
              priority
            />
            <div className={styles.heroButtons}>
              <Link href="/login" className={styles.loginButton}>
                Вход
              </Link>
              <Link href="/register" className={styles.registerButton}>
                Регистрация
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>В ПОДПИСКУ ВХОДИТ</h2>
          <div className={styles.subscriptionContainer}>
            <CourseCarousel>
              {courses.map((course) => (
                <div key={course.id} className={styles.courseCard}>
                  <Image
                    src={course.image}
                    alt={course.title}
                    width={250}
                    height={325}
                    className={styles.courseImage}
                  />
                  <BuyButton courseId={course.id} className={styles.btnBuy} />
                  <Link href={`/courses/${course.id}`} className={styles.courseLink}>
                    Подробнее о курсе →
                  </Link>
                </div>
              ))}
            </CourseCarousel>
          </div>

          <div className={styles.formatsRow}>
            <span className={styles.formatBadgeBlue}><i className="fas fa-video"></i> Видео</span>
            <span className={styles.formatBadgeBlack}><i className="fas fa-podcast"></i> Подкасты</span>
            <span className={styles.formatBadgeBlue}><i className="fas fa-gamepad"></i> Игры</span>
            <span className={styles.formatBadgeBlack}><i className="fas fa-pen"></i> ДЗ</span>
            <span className={styles.formatBadgeBlue}><i className="fas fa-book"></i> Философия</span>
            <span className={styles.formatBadgeBlack}><i className="fas fa-scroll"></i> Истории</span>
            <span className={styles.formatBadgeBlue}><i className="fas fa-file-alt"></i> Конспект</span>
            <span className={styles.formatBadgeBlack}><i className="fas fa-certificate"></i> Сертификат</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>ПРИГЛАШЁННЫЕ ВЕДУЩИЕ</h2>
          <div className={styles.speakersGrid}>
            {speakers.map((speaker, index) => (
              <div key={index} className={styles.speakerCard}>
                <div className={styles.avatar}>
                  <Image
                    src={speaker.avatar}
                    alt={speaker.name}
                    width={100}
                    height={100}
                    className={styles.avatarImage}
                  />
                </div>
                <div className={styles.speakerName}>{speaker.name}</div>
                <div className={styles.speakerQuote}>{speaker.quote}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>FAQ</h2>
          <FaqAccordion styles={styles} />
        </section>
      </div>

      <Footer />
    </main>
  )
}