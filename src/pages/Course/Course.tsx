import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCourseById } from "../../services/courses";
import type { CourseDetails } from "../../types/courses";
import { useAuth } from "../../context/useAuth";
import { useMyCourses } from "../../context/useMyCourses";
import styles from "./Course.module.css";

const COURSE_HERO_IMAGES: Record<string, string> = {
  yoga: "/ioga.png",
  stretching: "/strething.png",
  fitness: "/fitnes.png",
  stepairobic: "/step-aerobika.png",
  bodyflex: "/bogi.png",
};

/** Цвет фона героя по _id курса. */
const COURSE_HERO_COLORS: Record<string, string> = {
  q02a6i: "#7D458C",
  "6i67sm": "#FF7E65",
  ab1c3f: "#FFC700",
  ypox9r: "#F7A012",
  kfpq8e: "#2491D2",
};

function getHeroImage(nameEN: string): string {
  const key = nameEN.trim().toLowerCase().replace(/\s+/g, "-");
  return COURSE_HERO_IMAGES[key] ?? "/fitnes.png";
}

/** Ключ курса по nameEN (как в API). */
function getCourseKey(nameEN: string): string {
  return nameEN.trim().toLowerCase().replace(/\s+/g, "-");
}

/** По 5 ключевых пунктов из описания для блока «Начните путь к новому телу» (заданы вручную по каждому курсу). */
const COURSE_CTA_POINTS: Record<string, string[]> = {
  yoga: [
    "проработка всех групп мышц",
    "тренировка суставов",
    "улучшение циркуляции крови",
    "упражнения заряжают бодростью",
    "помогают противостоять стрессам",
  ],
  stretching: [
    "система упражнений для разогрева",
    "самостоятельное направление фитнеса",
    "в комплексе с другими направлениями",
    "гимнастика в период восстановления",
    "развить гибкость и расслабиться",
  ],
  fitness: [
    "сочетание фитнеса и танцев",
    "объединение хореографии и аэробики",
    "танцевальный фитнес дома",
    "получить удовольствие",
    "тело меняется в лучшую сторону",
  ],
  stepairobic: [
    "аэробные упражнения",
    "комплексы шагов под музыку",
    "эффективное сжигание калорий",
    "укрепление суставов",
    "улучшение здоровья",
  ],
  bodyflex: [
    "сочетание физических упражнений",
    "укрепление и растяжка мышц",
    "эффективный фитнес дома",
    "правильное дыхание",
    "состоянии повышенной готовности",
  ],
};

function getCtaPointsForCourse(nameEN: string): string[] {
  const key = getCourseKey(nameEN);
  const points = COURSE_CTA_POINTS[key];
  return points ? points.slice(0, 5) : [];
}

function DirectionsPlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9.21373 1.11751C9.3702 0.454433 9.44843 0.122896 9.57424 0.0482295C9.68259 -0.0160765 9.81741 -0.0160765 9.92576 0.0482295C10.0516 0.122896 10.1298 0.454434 10.2863 1.11751L11.0497 4.35302C11.3337 5.55636 11.4757 6.15803 11.7843 6.64596C12.0571 7.07744 12.4226 7.44285 12.854 7.71574C13.342 8.02432 13.9436 8.1663 15.147 8.45025L18.3825 9.21373C19.0456 9.3702 19.3771 9.44843 19.4518 9.57424C19.5161 9.68259 19.5161 9.81741 19.4518 9.92576C19.3771 10.0516 19.0456 10.1298 18.3825 10.2863L15.147 11.0497C13.9436 11.3337 13.342 11.4757 12.854 11.7843C12.4226 12.0571 12.0571 12.4226 11.7843 12.854C11.4757 13.342 11.3337 13.9436 11.0497 15.147L10.2863 18.3825C10.1298 19.0456 10.0516 19.3771 9.92576 19.4518C9.81741 19.5161 9.68259 19.5161 9.57424 19.4518C9.44843 19.3771 9.3702 19.0456 9.21373 18.3825L8.45025 15.147C8.1663 13.9436 8.02432 13.342 7.71574 12.854C7.44285 12.4226 7.07744 12.0571 6.64596 11.7843C6.15803 11.4757 5.55636 11.3337 4.35301 11.0497L1.11751 10.2863C0.454433 10.1298 0.122896 10.0516 0.0482295 9.92576C-0.0160765 9.81741 -0.0160765 9.68259 0.0482295 9.57424C0.122896 9.44843 0.454434 9.3702 1.11751 9.21373L4.35302 8.45025C5.55636 8.1663 6.15803 8.02432 6.64596 7.71574C7.07744 7.44285 7.44285 7.07744 7.71574 6.64596C8.02432 6.15803 8.1663 5.55636 8.45025 4.35301L9.21373 1.11751Z"
        fill="black"
      />
    </svg>
  );
}

type CourseProps = {
  onLoginClick?: () => void;
};

export default function Course({ onLoginClick }: CourseProps) {
  const { courseId } = useParams<{ courseId: string }>();
  const { isAuth } = useAuth();
  const { myCourseIds, addCourse, removeCourse, myCoursesLoading, isCourseSyncPending } =
    useMyCourses();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(() => !!courseId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    getCourseById(courseId)
      .then(setCourse)
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className={styles.section}>
        <p>Загрузка курса…</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={styles.section}>
        <p>{error ?? "Курс не найден"}</p>
      </div>
    );
  }

  const heroImage = getHeroImage(course.nameEN);

  const fitting = course.fitting ?? [];
  const directions = course.directions ?? [];
  const descriptionPoints = getCtaPointsForCourse(course.nameEN);

  return (
    <div className={styles.section}>
      {/* Первый блок: герой с названием курса */}
      <div
        className={styles.hero}
        style={{ background: COURSE_HERO_COLORS[course._id] ?? "#ffc700" }}
      >
        <h1 className={styles.heroTitle}>{course.nameRU}</h1>
        <div className={styles.heroImageWrap}>
          <img src={heroImage} alt="" className={styles.heroImage} />
        </div>
      </div>

      {/* Второй блок: Подойдет для вас, если */}
      {fitting.length > 0 && (
        <section className={styles.fittingBlock}>
          <h2 className={styles.fittingTitle}>Подойдет для вас, если:</h2>
          <ul className={styles.fittingList}>
            {fitting.map((text, index) => (
              <li key={index} className={styles.fittingCard}>
                <span className={styles.fittingNum}>{index + 1}</span>
                <p className={styles.fittingText}>{text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Третий блок: Направления */}
      {directions.length > 0 && (
        <section className={styles.directionsBlock}>
          <h2 className={styles.directionsTitle}>Направления</h2>
          <div className={styles.directionsBox}>
            <ul className={styles.directionsList}>
              {directions.map((name, index) => (
                <li key={index} className={styles.directionsItem}>
                  <span className={styles.directionsIcon}>
                    <DirectionsPlusIcon />
                  </span>
                  <span className={styles.directionsText}>{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Последний блок: Начните путь к новому телу */}
      <section className={styles.ctaBlock}>
        <div className={styles.ctaContainer}>
          <div className={styles.ctaImageWrap}>
            <picture>
              <source media="(max-width: 1160px)" srcSet="/putmob.png" />
              <img src="/put.png" alt="" className={styles.ctaImage} />
            </picture>
          </div>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              Начните путь <br />к новому телу
            </h2>
            {descriptionPoints.length > 0 ? (
              <ul className={styles.ctaDescriptionList}>
                {descriptionPoints.map((point, index) => (
                  <li key={index} className={styles.ctaDescriptionItem}>
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              course.description && <p className={styles.ctaDescription}>{course.description}</p>
            )}
            {isAuth ? (
              myCourseIds.includes(course._id) ? (
                <button
                  type="button"
                  className={styles.ctaButton}
                  onClick={() => removeCourse(course._id)}
                  disabled={isCourseSyncPending(course._id)}
                >
                  Удалить курс с профиля
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.ctaButton}
                  onClick={() => addCourse(course._id)}
                  disabled={myCoursesLoading || isCourseSyncPending(course._id)}
                >
                  Добавить курс
                </button>
              )
            ) : (
              <button type="button" className={styles.ctaButton} onClick={() => onLoginClick?.()}>
                Войдите, чтобы добавить курс
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
