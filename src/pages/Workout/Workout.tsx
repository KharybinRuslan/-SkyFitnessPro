import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useMyCourses } from "../../context/useMyCourses";
import { getCompletedWorkoutIds, setWorkoutCompleted } from "../../utils/authStorage";
import { getCourseById } from "../../services/courses";
import {
  getWorkoutById,
  getCourseWorkouts,
  getCourseProgress,
  updateWorkoutProgress,
} from "../../services/workouts";
import type { WorkoutDetails } from "../../types/workouts";
import { toEmbedVideoUrl } from "../../utils/videoUrl";
import styles from "./Workout.module.css";

/** Только спиннер и стрелки ↑↓ — без ручного набора и вставки. */
function progressNumberInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Tab" || e.key === "Escape") return;
  if (e.key === "ArrowUp" || e.key === "ArrowDown") return;
  e.preventDefault();
}

const SuccessCheckIcon = () => (
  <svg
    width="57"
    height="57"
    viewBox="0 0 57 57"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M28.3333 56.6667C43.9814 56.6667 56.6667 43.9814 56.6667 28.3333C56.6667 12.6853 43.9814 0 28.3333 0C12.6853 0 0 12.6853 0 28.3333C0 43.9814 12.6853 56.6667 28.3333 56.6667ZM28.0879 40.0802L43.6713 21.6635L39.3454 18.0032L25.889 33.9062L18.1406 25.0509L13.876 28.7824L23.7927 40.1158C24.3361 40.7368 25.1233 41.0901 25.9485 41.0832C26.7737 41.0764 27.5549 40.7101 28.0879 40.0802Z"
      fill="#BCEC30"
    />
  </svg>
);

export default function Workout() {
  const { courseId, workoutId } = useParams<{ courseId: string; workoutId: string }>();
  const { token, isAuth, user } = useAuth();
  const { setProgress: setCourseProgress } = useMyCourses();
  const email = user?.email ?? "";
  const [workout, setWorkout] = useState<WorkoutDetails | null>(null);
  const [courseName, setCourseName] = useState<string>("");
  const [progressData, setProgressData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formValues, setFormValues] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formFieldsScrollRef = useRef<HTMLDivElement>(null);
  const [formScrollOverflow, setFormScrollOverflow] = useState(false);

  const closeProgressForm = useCallback(() => {
    setFormScrollOverflow(false);
    setShowProgressForm(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!courseId || !workoutId || !token) {
        if (!token) setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      Promise.all([
        getWorkoutById(workoutId, token),
        getCourseById(courseId).then((c) => {
          if (c) setCourseName(c.nameRU);
          return c;
        }),
        getCourseWorkouts(courseId, token),
        getCourseProgress(courseId, token),
      ])
        .then(async ([w, , list, progress]) => {
          if (cancelled) return;
          // list всегда для текущего courseId; ищем тренировку только по _id (name в запросы не уходит)
          let workoutData: WorkoutDetails | null =
            w ?? list?.find((wo) => wo._id === workoutId) ?? null;
          if (!workoutData) throw new Error("Тренировка не найдена");
          const fromList = list?.find((wo) => wo._id === workoutId);
          if (fromList) {
            if (!workoutData.exercises?.length && fromList.exercises?.length) {
              workoutData = { ...workoutData, exercises: fromList.exercises };
            }
            if (!workoutData.video && fromList.video) {
              workoutData = { ...workoutData, video: fromList.video };
            }
          }
          if (!workoutData.exercises?.length && token) {
            const detail = await getWorkoutById(workoutId, token).catch(() => null);
            if (detail?.exercises?.length) {
              workoutData = { ...workoutData, exercises: detail.exercises };
            }
            if (!workoutData.video && detail?.video) {
              workoutData = { ...workoutData, video: detail.video };
            }
          }
          if (cancelled) return;
          setWorkout(workoutData);
          const wp = progress?.workoutsProgress?.find((p) => p.workoutId === workoutId);
          const data = wp?.progressData ?? (workoutData.exercises ?? []).map(() => 0);
          setProgressData(data);
          setFormValues(data);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Ошибка");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [courseId, workoutId, token]);

  useEffect(
    () => () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    },
    []
  );

  /** padding справа у полей только если блок реально скроллится */
  useLayoutEffect(() => {
    if (!showProgressForm) return;
    const check = () => {
      const node = formFieldsScrollRef.current;
      if (!node) return;
      setFormScrollOverflow(node.scrollHeight > node.clientHeight + 1);
    };
    check();
    const raf = requestAnimationFrame(check);
    const el = formFieldsScrollRef.current;
    const ro = new ResizeObserver(check);
    if (el) ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [showProgressForm, workout?._id, workout?.exercises?.length]);

  const handleSaveProgress = () => {
    if (!courseId || !workoutId || !token || !workout) return;
    const exercises = workout.exercises ?? [];
    const payload: number[] = Array.from({ length: exercises.length }, (_, i) => {
      const v = formValues[i];
      return Math.max(0, Math.floor(Number(v) || 0));
    });
    setSaving(true);
    updateWorkoutProgress(courseId, workoutId, payload, token)
      .then(() => {
        setProgressData([...payload]);
        closeProgressForm();
        setShowSuccessPopup(true);
        setWorkoutCompleted(email, courseId, workoutId);
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => setShowSuccessPopup(false), 2500);
        const applyProgressFromStorage = (list: { _id: string }[]) => {
          const completedIds = getCompletedWorkoutIds(email, courseId);
          const percent = list.length
            ? Math.round((completedIds.length / list.length) * 100)
            : completedIds.length > 0
              ? 100
              : 0;
          setCourseProgress(courseId, Math.min(100, percent));
        };
        getCourseWorkouts(courseId, token).then((list) => {
          applyProgressFromStorage(list);
        });
        getCourseProgress(courseId, token).then((progress) => {
          if (progress?.workoutsProgress?.length) {
            const completed = progress.workoutsProgress.filter((w) => w.workoutCompleted).length;
            const percent = Math.round((completed / progress.workoutsProgress.length) * 100);
            setCourseProgress(courseId, percent);
          }
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка сохранения"))
      .finally(() => setSaving(false));
  };

  if (!isAuth) {
    return (
      <div className={styles.section}>
        <p>Войдите, чтобы просматривать тренировки.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.section}>
        <p>Загрузка…</p>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className={styles.section}>
        <p>{error ?? "Тренировка не найдена"}</p>
      </div>
    );
  }

  const exercises = workout.exercises ?? [];

  /** Убираем "(15 повторений)" из названия — показываем только название и процент. */
  const getExerciseDisplayName = (name: string): string =>
    name.replace(/\s*\(\d+\s*повторений\)\s*$/i, "").trim() || name;

  return (
    <div className={styles.section}>
      <h1 className={styles.title}>{courseName}</h1>

      <div className={styles.videoWrap}>
        {workout.video ? (
          <>
            <div className={styles.videoFrame}>
              <iframe
                title={workout.name}
                src={toEmbedVideoUrl(workout.video)}
                className={styles.video}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </>
        ) : (
          <div className={styles.videoFrame}>
            <div className={styles.videoPlaceholder}>Видео не доступно</div>
          </div>
        )}
      </div>

      <div className={styles.progressCard}>
        <h2 className={styles.progressTitle}>Упражнения</h2>
        <ul className={styles.exerciseList}>
          {exercises.length === 0 ? (
            <li className={styles.exerciseItem}>
              <span className={styles.exerciseLabel}>
                Нет данных об упражнениях для этой тренировки. Попробуйте обновить страницу позже.
              </span>
            </li>
          ) : (
            exercises.map((ex, i) => {
              const q = ex.quantity || 1;
              const value = progressData[i] ?? 0;
              const percent = Math.min(100, Math.round((value / q) * 100));
              const displayName = getExerciseDisplayName(ex.name);
              return (
                <li key={ex._id} className={styles.exerciseItem}>
                  <span className={styles.exerciseLabel}>
                    {displayName} {percent}%
                  </span>
                  <svg
                    className={styles.progressBarSvg}
                    viewBox="0 0 320 6"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <rect width="320" height="6" rx="3" fill="#F7F7F7" />
                    <rect width={320 * (percent / 100)} height="6" rx="3" fill="#00c1ff" />
                  </svg>
                </li>
              );
            })
          )}
        </ul>
        {exercises.length > 0 && (
          <button
            type="button"
            className={styles.progressButton}
            onClick={() => setShowProgressForm(true)}
          >
            Заполнить свой прогресс
          </button>
        )}
      </div>

      {showProgressForm && (
        <div className={styles.formOverlay} onClick={closeProgressForm}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.formTitle}>Мой прогресс</h3>
            <div ref={formFieldsScrollRef} className={styles.formFieldsScroll}>
              <div
                className={
                  formScrollOverflow
                    ? `${styles.formFieldsScrollInner} ${styles.formFieldsScrollInnerWithGap}`
                    : styles.formFieldsScrollInner
                }
              >
                {exercises.map((ex, i) => (
                  <label key={ex._id} className={styles.formRow}>
                    <span className={styles.formLabel}>{ex.name}</span>
                    <input
                      type="number"
                      min={0}
                      max={ex.quantity * 2 || 999}
                      step={1}
                      inputMode="none"
                      autoComplete="off"
                      value={formValues[i] ?? 0}
                      onKeyDown={progressNumberInputKeyDown}
                      onPaste={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      onChange={(e) => {
                        const next = [...formValues];
                        next[i] = parseInt(e.target.value, 10) || 0;
                        setFormValues(next);
                      }}
                      className={styles.formInput}
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.formCancel} onClick={closeProgressForm}>
                Отмена
              </button>
              <button
                type="button"
                className={styles.formSubmit}
                onClick={handleSaveProgress}
                disabled={saving}
              >
                {saving ? "Сохранение…" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div
          className={styles.successOverlay}
          role="alert"
          aria-live="polite"
          onClick={() => setShowSuccessPopup(false)}
        >
          <div className={styles.successPopup} onClick={(e) => e.stopPropagation()}>
            <p className={styles.successTitle}>Ваш прогресс засчитан!</p>
            <SuccessCheckIcon />
          </div>
        </div>
      )}
    </div>
  );
}
