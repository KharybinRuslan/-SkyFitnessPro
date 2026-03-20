import { useId, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./CourseCards.module.css";
import { getCourses } from "../../services/courses";
import type { CourseListItem } from "../../types/courses";
import { useAuth } from "../../context/useAuth";
import { useMyCourses } from "../../context/useMyCourses";

/** Соответствие nameEN курса и картинки (как было в статичном списке) */
const COURSE_IMAGES: Record<string, string> = {
  yoga: "/ioga.png",
  stretching: "/strething.png",
  fitness: "/fitnes.png",
  "step-aerobics": "/step-aerobika.png",
  stepairobic: "/step-aerobika.png", // API возвращает "StepAirobic"
  bodyflex: "/bogi.png",
};

function getCourseImage(nameEN: string): string {
  const key = nameEN.trim().toLowerCase().replace(/\s+/g, "-");
  return COURSE_IMAGES[key] ?? "/fitnes.png";
}

/** Сложность из API → уровень 1–5 (сколько синих полосок в иконке) */
function difficultyToLevel(difficulty: string | undefined): number {
  if (!difficulty) return 1;
  const d = difficulty.trim().toLowerCase();
  if (d === "начальный") return 1;
  if (d === "средний") return 3;
  if (d === "сложный") return 5;
  return 1;
}

function PlusIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.3333 26.6667C20.6971 26.6667 26.6667 20.6971 26.6667 13.3333C26.6667 5.96954 20.6971 0 13.3333 0C5.96954 0 0 5.96954 0 13.3333C0 20.6971 5.96954 26.6667 13.3333 26.6667ZM12 12V6.66667H14.6667V12H20V14.6667H14.6667V20H12V14.6667H6.66667V12H12Z"
        fill="white"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.3333 26.6667C20.6971 26.6667 26.6667 20.6971 26.6667 13.3333C26.6667 5.96954 20.6971 0 13.3333 0C5.96954 0 0 5.96954 0 13.3333C0 20.6971 5.96954 26.6667 13.3333 26.6667ZM6.66667 12V14.6667H20V12H6.66667Z"
        fill="white"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5 2.625C7.5 1.79657 6.82843 1.125 6 1.125C5.17157 1.125 4.5 1.79657 4.5 2.625C2.84315 2.625 1.5 3.96815 1.5 5.625H16.5C16.5 3.96815 15.1569 2.625 13.5 2.625C13.5 1.79657 12.8284 1.125 12 1.125C11.1716 1.125 10.5 1.79657 10.5 2.625H7.5Z"
        fill="#202020"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 7.125H16.5V11.325C16.5 13.0052 16.5 13.8452 16.173 14.487C15.8854 15.0515 15.4265 15.5104 14.862 15.798C14.2202 16.125 13.3802 16.125 11.7 16.125H6.3C4.61984 16.125 3.77976 16.125 3.13803 15.798C2.57354 15.5104 2.1146 15.0515 1.82698 14.487C1.5 13.8452 1.5 13.0052 1.5 11.325V7.125ZM10.5 11.325C10.5 10.905 10.5 10.6949 10.5817 10.5345C10.6537 10.3934 10.7684 10.2787 10.9095 10.2067C11.0699 10.125 11.28 10.125 11.7 10.125H12.3C12.72 10.125 12.9301 10.125 13.0905 10.2067C13.2316 10.2787 13.3463 10.3934 13.4183 10.5345C13.5 10.6949 13.5 10.905 13.5 11.325V11.925C13.5 12.345 13.5 12.5551 13.4183 12.7155C13.3463 12.8566 13.2316 12.9713 13.0905 13.0433C12.9301 13.125 12.72 13.125 12.3 13.125H11.7C11.28 13.125 11.0699 13.125 10.9095 13.0433C10.7684 12.9713 10.6537 12.8566 10.5817 12.7155C10.5 12.5551 10.5 12.345 10.5 11.925V11.325Z"
        fill="#202020"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15ZM6.75 3V7.5C6.75 7.91421 7.08579 8.25 7.5 8.25H11.25V6.75H8.25V3H6.75Z"
        fill="#202020"
      />
    </svg>
  );
}

const DIFFICULTY_BAR_PATHS = [
  "M15 2.625C15.2984 2.625 15.5845 2.74353 15.7955 2.9545C16.0065 3.16548 16.125 3.45163 16.125 3.75V14.25C16.125 14.5484 16.0065 14.8345 15.7955 15.0455C15.5845 15.2565 15.2984 15.375 15 15.375C14.7016 15.375 14.4155 15.2565 14.2045 15.0455C13.9935 14.8345 13.875 14.5484 13.875 14.25V3.75C13.875 3.45163 13.9935 3.16548 14.2045 2.9545C14.4155 2.74353 14.7016 2.625 15 2.625Z",
  "M12 4.875C12.2984 4.875 12.5845 4.99353 12.7955 5.2045C13.0065 5.41548 13.125 5.70163 13.125 6V14.25C13.125 14.5484 13.0065 14.8345 12.7955 15.0455C12.5845 15.2565 12.2984 15.375 12 15.375C11.7016 15.375 11.4155 15.2565 11.2045 15.0455C10.9935 14.8345 10.875 14.5484 10.875 14.25V6C10.875 5.70163 10.9935 5.41548 11.2045 5.2045C11.4155 4.99353 11.7016 4.875 12 4.875Z",
  "M9 7.125C9.29837 7.125 9.58452 7.24353 9.7955 7.4545C10.0065 7.66548 10.125 7.95163 10.125 8.25V14.25C10.125 14.5484 10.0065 14.8345 9.7955 15.0455C9.58452 15.2565 9.29837 15.375 9 15.375C8.70163 15.375 8.41548 15.2565 8.2045 15.0455C7.99353 14.8345 7.875 14.5484 7.875 14.25V8.25C7.875 7.95163 7.99353 7.66548 8.2045 7.4545C8.41548 7.24353 8.70163 7.125 9 7.125Z",
  "M6 9.375C6.29837 9.375 6.58452 9.49353 6.7955 9.7045C7.00647 9.91548 7.125 10.2016 7.125 10.5V14.25C7.125 14.5484 7.00647 14.8345 6.7955 15.0455C6.58452 15.2565 6.29837 15.375 6 15.375C5.70163 15.375 5.41548 15.2565 5.2045 15.0455C4.99353 14.8345 4.875 14.5484 4.875 14.25V10.5C4.875 10.2016 4.99353 9.91548 5.2045 9.7045C5.41548 9.49353 5.70163 9.375 6 9.375Z",
  "M3 11.625C3.29837 11.625 3.58452 11.7435 3.7955 11.9545C4.00647 12.1655 4.125 12.4516 4.125 12.75V14.25C4.125 14.5484 4.00647 14.8345 3.7955 15.0455C3.58452 15.2565 3.29837 15.375 3 15.375C2.70163 15.375 2.41548 15.2565 2.2045 15.0455C1.99353 14.8345 1.875 14.5484 1.875 14.25V12.75C1.875 12.4516 1.99353 12.1655 2.2045 11.9545C2.41548 11.7435 2.70163 11.625 3 11.625Z",
];

/** level 1–5: сколько полосок синие (слева направо). Остальные — серые. */
function DifficultyIcon({ level }: { level: number }) {
  const id = `clip-diff-${useId().replace(/:/g, "")}`;
  const filled = Math.min(5, Math.max(1, level));
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g clipPath={`url(#${id})`}>
        {DIFFICULTY_BAR_PATHS.map((d, i) => (
          <path
            key={i}
            fillRule="evenodd"
            clipRule="evenodd"
            d={d}
            fill={i >= 5 - filled ? "#00C1FF" : "#D9D9D9"}
          />
        ))}
      </g>
      <defs>
        <clipPath id={id}>
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

interface CourseCardProps {
  course: CourseListItem;
  isAuth: boolean;
  isInMyCourses: boolean;
  /** Пока грузим selectedCourses с API или идёт синхронизация курса */
  addDisabled?: boolean;
  removeDisabled?: boolean;
  onLoginClick?: () => void;
  onAddCourse?: (courseId: string) => void;
  onRemoveCourse?: (courseId: string) => void;
}

function CourseCard({
  course,
  isAuth,
  isInMyCourses,
  addDisabled = false,
  removeDisabled = false,
  onLoginClick,
  onAddCourse,
  onRemoveCourse,
}: CourseCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const title = course.nameRU;
  const image = getCourseImage(course.nameEN);
  const workoutCount = course.workouts?.length ?? 0;
  const daysLabel = course.durationInDays
    ? `${course.durationInDays} дней`
    : workoutCount
      ? `${workoutCount} занятий`
      : "—";
  const minutesLabel = course.dailyDurationInMinutes
    ? `${course.dailyDurationInMinutes.from}–${course.dailyDurationInMinutes.to} мин/день`
    : "—";
  const difficultyLevel = difficultyToLevel(course.difficulty);

  const isRemoveMode = isAuth && isInMyCourses;
  const tooltipText = isRemoveMode ? "Удалить курс с профиля" : "Добавить курс";

  const handleIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth && onLoginClick) {
      onLoginClick();
    } else if (isRemoveMode && onRemoveCourse) {
      if (removeDisabled) return;
      onRemoveCourse(course._id);
    } else if (isAuth && onAddCourse && !isInMyCourses) {
      if (addDisabled) return;
      onAddCourse(course._id);
    }
  };

  return (
    <Link to={`/course/${course._id}`} className={styles.cardLink}>
      <article className={styles.card}>
        <div className={styles.imageWrapper}>
          <div className={styles.imageClip}>
            <img src={image} alt={title} className={styles.image} />
          </div>
          <div
            className={styles.plusIcon}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button
              type="button"
              className={styles.plusButton}
              onClick={handleIconClick}
              aria-label={tooltipText}
              disabled={
                isRemoveMode ? removeDisabled : isAuth && !isInMyCourses ? addDisabled : false
              }
            >
              {isRemoveMode ? <MinusIcon /> : <PlusIcon />}
            </button>
            {showTooltip && (
              <span className={styles.addCourseTooltip} role="tooltip">
                {tooltipText}
              </span>
            )}
          </div>
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <CalendarIcon />
              {daysLabel}
            </span>
            <span className={styles.metaItem}>
              <ClockIcon />
              {minutesLabel}
            </span>
            <span className={styles.metaItem}>
              <DifficultyIcon level={difficultyLevel} />
              Сложность
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export interface CourseCardsProps {
  onLoginClick?: () => void;
}

export default function CourseCards({ onLoginClick }: CourseCardsProps) {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuth } = useAuth();
  const { myCourseIds, addCourse, removeCourse, myCoursesLoading, isCourseSyncPending } =
    useMyCourses();

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.cardSkeleton} aria-hidden>
              <div className={styles.skeletonImage} />
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonMeta} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.section}>
        <p className={styles.error}>{error}</p>
      </section>
    );
  }

  if (courses.length === 0) {
    return (
      <section className={styles.section}>
        <p className={styles.error}>Курсы пока не добавлены</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {courses.map((course) => (
          <CourseCard
            key={course._id}
            course={course}
            isAuth={isAuth}
            isInMyCourses={myCourseIds.includes(course._id)}
            addDisabled={myCoursesLoading || isCourseSyncPending(course._id)}
            removeDisabled={isCourseSyncPending(course._id)}
            onLoginClick={onLoginClick}
            onAddCourse={addCourse}
            onRemoveCourse={removeCourse}
          />
        ))}
      </div>
    </section>
  );
}
