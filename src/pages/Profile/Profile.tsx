import { useId, useState, useRef, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useMyCourses } from "../../context/useMyCourses";
import { getCourses } from "../../services/courses";
import {
  getCourseWorkouts,
  resetCourseProgress,
} from "../../services/workouts";
import {
  getCompletedWorkoutIds,
  clearCompletedWorkoutsForCourse,
} from "../../utils/authStorage";
import type { CourseListItem } from "../../types/courses";
import Footer from "../../components/Footer";
import ChooseWorkoutModal from "../../components/ChooseWorkoutModal";
import StartOverConfirmModal from "../../components/StartOverConfirmModal";
import styles from "./Profile.module.css";

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14.166 2.5a1.77 1.77 0 0 1 2.5 2.5l-11 11-2.666 1 1-2.666 11-11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function displayUserName(
  user: { email?: string; name?: string } | null,
): string {
  if (!user) return "";
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "";
}

const ACCEPTED_IMAGE_TYPES =
  "image/png,image/svg+xml,image/jpeg,image/webp,image/gif";

const COURSE_IMAGES: Record<string, string> = {
  yoga: "/ioga.png",
  stretching: "/strething.png",
  fitness: "/fitnes.png",
  stepairobic: "/step-aerobika.png",
  bodyflex: "/bogi.png",
};

const COURSE_COLORS: Record<string, string> = {
  q02a6i: "#7D458C",
  "6i67sm": "#FF7E65",
  ab1c3f: "#FFC700",
  ypox9r: "#F7A012",
  kfpq8e: "#2491D2",
};

function getCourseImage(nameEN: string): string {
  const key = nameEN.trim().toLowerCase().replace(/\s+/g, "-");
  return COURSE_IMAGES[key] ?? "/fitnes.png";
}

function MinusIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 27 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.3333 26.6667C20.6971 26.6667 26.6667 20.6971 26.6667 13.3333C26.6667 5.96954 20.6971 0 13.3333 0C5.96954 0 0 5.96954 0 13.3333C0 20.6971 5.96954 26.6667 13.3333 26.6667ZM6.66667 12V14.6667H20V12H6.66667Z"
        fill="white"
      />
    </svg>
  );
}

function CalendarIconSmall() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 2.625C7.5 1.79657 6.82843 1.125 6 1.125C5.17157 1.125 4.5 1.79657 4.5 2.625C2.84315 2.625 1.5 3.96815 1.5 5.625H16.5C16.5 3.96815 15.1569 2.625 13.5 2.625C13.5 1.79657 12.8284 1.125 12 1.125C11.1716 1.125 10.5 1.79657 10.5 2.625H7.5Z"
        fill="#202020"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 7.125H16.5V11.325C16.5 13.0052 16.5 13.8452 16.173 14.487C15.8854 15.0515 15.4265 15.5104 14.862 15.798C14.2202 16.125 13.3802 16.125 11.7 16.125H6.3C4.61984 16.125 3.77976 16.125 3.13803 15.798C2.57354 15.5104 2.1146 15.0515 1.82698 14.487C1.5 13.8452 1.5 13.0052 1.5 11.325V7.125Z"
        fill="#202020"
      />
    </svg>
  );
}

function ClockIconSmall() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
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

function difficultyToLevel(difficulty: string | undefined): number {
  if (!difficulty) return 1;
  const d = difficulty.trim().toLowerCase();
  if (d === "начальный") return 1;
  if (d === "средний") return 3;
  if (d === "сложный") return 5;
  return 1;
}

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

function MyCourseCard({
  course,
  progress,
  onRemove,
  onStartOver,
  onStartOverClick,
  onOpenWorkoutModal,
}: {
  course: CourseListItem;
  progress: number;
  onRemove: () => void;
  onStartOver: () => void;
  onStartOverClick?: (courseId: string, courseName: string) => void;
  onOpenWorkoutModal?: (courseId: string, courseName: string) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const title = course.nameRU;
  const image = getCourseImage(course.nameEN);
  const daysLabel = course.durationInDays
    ? `${course.durationInDays} дней`
    : "—";
  const minutesLabel = course.dailyDurationInMinutes
    ? `${course.dailyDurationInMinutes.from}–${course.dailyDurationInMinutes.to} мин/день`
    : "—";
  const difficultyLevel = difficultyToLevel(course.difficulty);
  const bgColor = COURSE_COLORS[course._id] ?? "#f0f0f0";

  const buttonText =
    progress >= 100
      ? "Начать заново"
      : progress > 0
        ? "Продолжить"
        : "Начать тренировки";

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (progress >= 100 && onStartOverClick) {
      onStartOverClick(course._id, course.nameRU);
      return;
    }
    if (progress >= 100) onStartOver();
    onOpenWorkoutModal?.(course._id, course.nameRU);
  };

  return (
    <article className={styles.myCourseCard}>
      <div className={styles.myCourseImageWrap} style={{ background: bgColor }}>
        <div className={styles.myCourseImageClip}>
          <img src={image} alt={title} className={styles.myCourseImage} />
        </div>
        <div
          className={styles.myCourseRemoveWrap}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            type="button"
            className={styles.myCourseRemoveBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Удалить курс"
          >
            <MinusIcon />
          </button>
          {showTooltip && (
            <span className={styles.myCourseTooltip} role="tooltip">
              Удалить курс
            </span>
          )}
        </div>
      </div>
      <div className={styles.myCourseContent}>
        <h3 className={styles.myCourseTitle}>{title}</h3>
        <div className={styles.myCourseMeta}>
          <span className={styles.myCourseMetaItem}>
            <CalendarIconSmall />
            {daysLabel}
          </span>
          <span className={styles.myCourseMetaItem}>
            <ClockIconSmall />
            {minutesLabel}
          </span>
          <span className={styles.myCourseMetaItem}>
            <DifficultyIcon level={difficultyLevel} />
            Сложность
          </span>
        </div>
        <p className={styles.myCourseProgressLabel}>Прогресс {progress}%</p>
        <div className={styles.myCourseProgressBar}>
          <div
            className={styles.myCourseProgressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          className={styles.myCourseButton}
          onClick={handleButtonClick}
        >
          {buttonText}
        </button>
      </div>
    </article>
  );
}

function ProfileAvatar({
  avatarUrl,
  onUpload,
}: {
  avatarUrl?: string;
  onUpload: (dataUrl: string) => void;
}) {
  const maskId = useId().replace(/:/g, "");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") onUpload(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const defaultSvg = (
    <svg
      width="197"
      height="197"
      viewBox="0 0 197 197"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.avatarSvg}
    >
      <mask
        id={maskId}
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="197"
        height="197"
      >
        <path
          d="M0 20C0 8.95431 8.95431 0 20 0L177 0C188.046 0 197 8.9543 197 20V177C197 188.046 188.046 197 177 197H20C8.95431 197 0 188.046 0 177L0 20Z"
          fill="#D9D9D9"
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M0 20C0 8.95431 8.9543 0 20 0L177 0C188.046 0 197 8.9543 197 20V177C197 188.046 188.046 197 177 197H20C8.95431 197 0 188.046 0 177L0 20Z"
          fill="#D9D9D9"
        />
        <path
          d="M98.5 125.095C50.3529 125.095 9.22177 155.134 -7.1748 197.492H204.175C187.778 155.134 146.647 125.095 98.5 125.095Z"
          fill="white"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M98.0073 100.751C117.999 100.751 134.206 84.5919 134.206 64.6582C134.206 44.7244 117.999 28.5649 98.0073 28.5649C78.0153 28.5649 61.8086 44.7244 61.8086 64.6582C61.8086 84.5919 78.0153 100.751 98.0073 100.751Z"
          fill="white"
        />
      </g>
    </svg>
  );

  return (
    <label className={styles.avatarLabel} title="Загрузить фото">
      <input
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        onChange={handleFileChange}
        className={styles.avatarInput}
        aria-label="Загрузить фото профиля"
      />
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className={styles.avatarImage} />
      ) : (
        defaultSvg
      )}
    </label>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { isAuth, isRestoring, user, logout, updateUser, token } = useAuth();
  const { myCourseIds, removeCourse, getProgress, setProgress, refresh } =
    useMyCourses();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [allCourses, setAllCourses] = useState<CourseListItem[]>([]);
  const [workoutModal, setWorkoutModal] = useState<{
    courseId: string;
    courseName: string;
  } | null>(null);
  const [startOverModal, setStartOverModal] = useState<{
    courseId: string;
    courseName: string;
  } | null>(null);
  const [startOverLoading, setStartOverLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    getCourses()
      .then(setAllCourses)
      .catch(() => setAllCourses([]));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Синхронизируем прогресс курсов из завершённых тренировок (один раз при смене списка курсов, без setProgress в deps — иначе цикл)
  const profileEmail = user?.email ?? "";
  const courseIdsKey = myCourseIds.join(",");
  useEffect(() => {
    if (!profileEmail || !token || myCourseIds.length === 0) return;
    let cancelled = false;
    myCourseIds.forEach((courseId) => {
      getCourseWorkouts(courseId, token)
        .then((list) => {
          if (cancelled || !list.length) return;
          const completedIds = getCompletedWorkoutIds(profileEmail, courseId);
          const percent = Math.round((completedIds.length / list.length) * 100);
          if (percent > 0) setProgress(courseId, Math.min(100, percent));
        })
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setProgress стабилен; по courseIdsKey не перезапускаем при том же наборе id
  }, [profileEmail, token, courseIdsKey]);

  const myCourses = myCourseIds
    .map((id) => allCourses.find((c) => c._id === id))
    .filter((c): c is CourseListItem => c != null);

  if (isRestoring) {
    return null; // ждём восстановления сессии из localStorage
  }

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  const userName = displayUserName(user);
  const displayName = userName || "Пользователь";

  const startEditName = () => {
    setEditNameValue((user?.name ?? userName) || "");
    setIsEditingName(true);
  };

  const saveName = () => {
    const trimmed = editNameValue.trim();
    updateUser({ name: trimmed || undefined });
    setIsEditingName(false);
  };

  const cancelEditName = () => {
    setEditNameValue("");
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveName();
    if (e.key === "Escape") cancelEditName();
  };

  return (
    <>
      <section className={styles.section}>
        <div className={styles.container}>
          <h1 className={styles.title}>Профиль</h1>
          <div className={styles.card}>
            <div className={styles.avatarWrap}>
              <ProfileAvatar
                avatarUrl={user?.avatar}
                onUpload={(dataUrl) => updateUser({ avatar: dataUrl })}
              />
            </div>
            <div className={styles.info}>
              {isEditingName ? (
                <div className={styles.nameEditRow}>
                  <input
                    ref={nameInputRef}
                    type="text"
                    className={styles.nameInput}
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    placeholder="Введите имя"
                    maxLength={100}
                  />
                  <div className={styles.nameEditActions}>
                    <button
                      type="button"
                      className={styles.nameSaveButton}
                      onClick={saveName}
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      className={styles.nameCancelButton}
                      onClick={cancelEditName}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.nameRow}>
                  <p className={styles.name}>{displayName}</p>
                  <button
                    type="button"
                    className={styles.editNameButton}
                    onClick={startEditName}
                    title="Изменить имя"
                    aria-label="Изменить имя"
                  >
                    <PencilIcon />
                  </button>
                </div>
              )}
              <p className={styles.login}>Эл. почта: {profileEmail || "—"}</p>
              <button
                type="button"
                className={styles.logoutButton}
                onClick={logout}
              >
                Выйти
              </button>
            </div>
          </div>

          {myCourses.length > 0 && (
            <div className={styles.myCoursesSection}>
              <h2 className={styles.title}>Мои курсы</h2>
              <div className={styles.myCoursesGrid}>
                {myCourses.map((course) => (
                  <MyCourseCard
                    key={course._id}
                    course={course}
                    progress={getProgress(course._id)}
                    onRemove={() => removeCourse(course._id)}
                    onStartOver={() => setProgress(course._id, 0)}
                    onStartOverClick={(id, name) =>
                      setStartOverModal({ courseId: id, courseName: name })
                    }
                    onOpenWorkoutModal={(id, name) =>
                      setWorkoutModal({ courseId: id, courseName: name })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      {myCourses.length > 0 && <Footer />}
      <ChooseWorkoutModal
        isOpen={!!workoutModal}
        onClose={() => setWorkoutModal(null)}
        courseId={workoutModal?.courseId ?? ""}
        courseName={workoutModal?.courseName ?? ""}
        onSelectWorkout={(workoutId) => {
          if (workoutModal) {
            navigate(`/course/${workoutModal.courseId}/workout/${workoutId}`);
            setWorkoutModal(null);
          }
        }}
      />
      <StartOverConfirmModal
        isOpen={!!startOverModal}
        onClose={() => setStartOverModal(null)}
        loading={startOverLoading}
        onConfirm={async () => {
          if (!startOverModal || !token) return;
          setStartOverLoading(true);
          try {
            await resetCourseProgress(startOverModal.courseId, token);
            setProgress(startOverModal.courseId, 0);
            clearCompletedWorkoutsForCourse(
              profileEmail,
              startOverModal.courseId,
            );
            refresh();
            setStartOverModal(null);
          } catch {
            // ошибка уже отображается через API; модалку можно оставить для повтора
          } finally {
            setStartOverLoading(false);
          }
        }}
      />
    </>
  );
}
