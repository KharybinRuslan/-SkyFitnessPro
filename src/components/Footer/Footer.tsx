import styles from './Footer.module.css'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.toTopButton}
          onClick={scrollToTop}
        >
          Наверх ↑
        </button>
      </div>
    </footer>
  )
}
