import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/useAuth";
import { getCompletedWorkoutIds } from "../../utils/authStorage";
import { getCourseWorkouts, getCourseProgress } from "../../services/workouts";
import type { WorkoutListItem } from "../../types/workouts";
import styles from "./ChooseWorkoutModal.module.css";

function CompletedIcon() {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20ZM9.91339 14.1459L15.4134 7.64594L13.8866 6.35406L9.1373 11.9669L6.40258 8.8415L4.89742 10.1585L8.39742 14.1585C8.58922 14.3777 8.86704 14.5024 9.15829 14.5C9.44953 14.4976 9.72525 14.3683 9.91339 14.1459Z"
        fill="#BCEC30"
      />
    </svg>
  );
}

function IncompleteIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="10" cy="10" r="9.5" stroke="black" />
    </svg>
  );
}

/** Только для отображения в списке (первая часть до " / " или целиком). В запросы к API name не передаётся. */
function getWorkoutDisplayTitle(name: string): string {
  const part = name.split(" / ")[0]?.trim();
  return part || name;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  onSelectWorkout: (workoutId: string) => void;
};

export default function ChooseWorkoutModal({
  isOpen,
  onClose,
  courseId,
  courseName,
  onSelectWorkout,
}: Props) {
  const { token, user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [completedWorkoutIds, setCompletedWorkoutIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const email = user?.email ?? "";

  useEffect(() => {
    if (!isOpen || !courseId || !token) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      setSelectedWorkoutId(null);
      try {
        const [list, progress] = await Promise.all([
          getCourseWorkouts(courseId, token),
          getCourseProgress(courseId, token),
        ]);
        if (!cancelled) {
          setWorkouts(list);
          const fromApi =
            progress?.workoutsProgress?.filter((w) => w.workoutCompleted).map((w) => w.workoutId) ??
            [];
          const fromStorage = getCompletedWorkoutIds(email, courseId);
          const ids = fromApi.length > 0 ? fromApi : fromStorage;
          setCompletedWorkoutIds(ids);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setWorkouts([]);
          setCompletedWorkoutIds(getCompletedWorkoutIds(email, courseId));
          setError(err instanceof Error ? err.message : "Ошибка загрузки");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, courseId, token, email]);

  const isWorkoutCompleted = (workoutId: string): boolean =>
    completedWorkoutIds.includes(workoutId);

  const handleStart = () => {
    if (selectedWorkoutId) {
      onSelectWorkout(selectedWorkoutId);
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const content = (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="choose-workout-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 id="choose-workout-title" className={styles.title}>
          Выберите тренировку
        </h2>
        {loading && <p className={styles.message}>Загрузка…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && workouts.length === 0 && (
          <p className={styles.message}>Тренировки не найдены</p>
        )}
        {!loading && !error && workouts.length > 0 && (
          <>
            <ul className={styles.list}>
              {workouts.map((workout, index) => {
                const completed = isWorkoutCompleted(workout._id);
                const selected = selectedWorkoutId === workout._id;
                return (
                  <li key={workout._id}>
                    <button
                      type="button"
                      className={`${styles.item} ${selected ? styles.itemSelected : ""}`}
                      onClick={() => setSelectedWorkoutId(workout._id)}
                    >
                      <span className={styles.itemIcon}>
                        {completed ? <CompletedIcon /> : <IncompleteIcon />}
                      </span>
                      <span className={styles.itemContent}>
                        <span className={styles.itemTitle}>
                          {getWorkoutDisplayTitle(workout.name)}
                        </span>
                        <span className={styles.itemSubtitle}>
                          {courseName} / {index + 1} день
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className={styles.startButton}
              onClick={handleStart}
              disabled={!selectedWorkoutId}
            >
              Начать
            </button>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
