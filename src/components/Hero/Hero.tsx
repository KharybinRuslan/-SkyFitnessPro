import styles from './Hero.module.css'

function SpeechBubbleTail() {
  return (
    <svg
      width="31"
      height="36"
      viewBox="0 0 31 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.bubbleTail}
    >
      <path
        d="M3.25285 34.7255C1.65097 35.9972 -0.601266 34.3288 0.148526 32.4259L12.4256 1.26757C12.9078 0.043736 14.4198 -0.389332 15.4768 0.393651L29.4288 10.7288C30.4858 11.5118 30.5121 13.0844 29.4819 13.9023L3.25285 34.7255Z"
        fill="#BCEC30"
      />
    </svg>
  )
}

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          Начните заниматься спортом
          <br className={styles.titleBr} />
          и улучшите качество жизни
        </h1>
        <div className={styles.bubbleWrapper}>
          <div className={styles.bubble}>
            Измени своё
            <br />
            тело за полгода!
          </div>
          <SpeechBubbleTail />
        </div>
      </div>
    </section>
  )
}
