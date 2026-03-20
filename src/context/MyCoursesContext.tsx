import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./useAuth";
import {
  getMyCourseIds,
  setMyCourseIds,
  getMyCourseProgress,
  setMyCourseProgress,
} from "../utils/authStorage";
import {
  addCourseOnServer,
  fetchSelectedCoursesFromServer,
  removeCourseOnServer,
} from "../services/user";
import { MyCoursesContext, type MyCoursesContextValue } from "./myCoursesContextState";

/** Синхронизация с API: при добавлении/удалении курса вызываем POST/DELETE /users/me/courses (нужно для сохранения прогресса). */
const SYNC_COURSES_WITH_SERVER = true;

export function MyCoursesProvider({ children }: { children: ReactNode }) {
  const { user, isAuth, token } = useAuth();
  const [version, setVersion] = useState(0);

  /** Подтянуть selectedCourses с API — источник правды, без merge (убирает «фантомные» id и лишние DELETE). */
  const refresh = useCallback(() => {
    const email = user?.email;
    if (!token || !email) {
      setVersion((v) => v + 1);
      return;
    }
    fetchSelectedCoursesFromServer(token).then((ids) => {
      if (ids !== null) {
        setMyCourseIds(email, ids);
      }
      setVersion((v) => v + 1);
    });
  }, [token, user?.email]);

  useEffect(() => {
    if (!isAuth || !token || !user?.email) return;
    refresh();
  }, [isAuth, token, user?.email, refresh]);

  const myCourseIds = useMemo((): string[] => {
    const email = user?.email;
    if (!isAuth || !email) return [];
    return getMyCourseIds(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version нужен для перечитывания после add/remove
  }, [isAuth, user?.email, version]);

  const addCourse = useCallback(
    (courseId: string): void => {
      const email = user?.email;
      if (!email) return;
      const ids = getMyCourseIds(email);
      if (ids.includes(courseId)) return;
      setMyCourseIds(email, [...ids, courseId]);
      setVersion((v) => v + 1);
      if (SYNC_COURSES_WITH_SERVER && token) {
        void addCourseOnServer(courseId, token).then((ok) => {
          if (!ok || !email) return;
          fetchSelectedCoursesFromServer(token).then((sids) => {
            if (sids !== null) setMyCourseIds(email, sids);
            setVersion((v) => v + 1);
          });
        });
      }
    },
    [user?.email, token]
  );

  const removeCourse = useCallback(
    (courseId: string): void => {
      const email = user?.email;
      if (!email) return;
      const ids = getMyCourseIds(email).filter((id) => id !== courseId);
      setMyCourseIds(email, ids);
      setVersion((v) => v + 1);
      if (SYNC_COURSES_WITH_SERVER && token) {
        void removeCourseOnServer(courseId, token).then((ok) => {
          if (ok || !email) return;
          fetchSelectedCoursesFromServer(token).then((sids) => {
            if (sids !== null) setMyCourseIds(email, sids);
            setVersion((v) => v + 1);
          });
        });
      }
    },
    [user?.email, token]
  );

  const getProgress = useCallback(
    (courseId: string): number => {
      const email = user?.email;
      if (!email) return 0;
      const progress = getMyCourseProgress(email);
      return progress[courseId] ?? 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version для актуального прогресса
    [user?.email, version]
  );

  const setProgress = useCallback(
    (courseId: string, percent: number): void => {
      const email = user?.email;
      if (!email) return;
      setMyCourseProgress(email, courseId, percent);
      setVersion((v) => v + 1);
    },
    [user?.email]
  );

  const value = useMemo<MyCoursesContextValue>(
    () => ({
      myCourseIds,
      addCourse,
      removeCourse,
      getProgress,
      setProgress,
      refresh,
    }),
    [myCourseIds, addCourse, removeCourse, getProgress, setProgress, refresh]
  );

  return <MyCoursesContext.Provider value={value}>{children}</MyCoursesContext.Provider>;
}
