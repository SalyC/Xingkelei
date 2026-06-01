import styles from './Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.brandLogo} />
            <div className={styles.brandTitle}>Клуб Синкэлэй</div>
          </div>
          <div className={styles.contactsBlock}>
            <div className={styles.contactsHeading}>Контакты</div>
            <div className={styles.contactsList}>
              <p><a href="mailto:Kovrigasa@college.omsu.ru">Kovrigasa@college.omsu.ru</a></p>
              <p><a href="https://t.me/yangchessman" target="_blank" rel="noopener noreferrer">t.me/yangchessman</a></p>
              <p><a href="https://t.me/xingkeleiYang" target="_blank" rel="noopener noreferrer">t.me/xingkeleiYang</a></p>
            </div>
          </div>
        </div>

        {/* разделительная линия */}
        <div className={styles.footerDivider} />

        {/* нижняя часть */}
        <div className={styles.footerBottom}>
          <div className={styles.footerInfo}>
            <div className={styles.footerDescription}>
              Клуб Синкэлэй — облачная платформа цифрового образования. Платформа используется с целью оказания образовательных услуг.
            </div>
            <div className={styles.copyright}>© xingkeleiYang, 2026</div>
          </div>
          <div className={styles.footerCookie}>
            <div className={styles.cookieText}>
              Мы используем файлы cookie для персонализации сервисов и повышения удобства пользования сайтом. Если вы не согласны на их использование, поменяйте настройки браузера.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer