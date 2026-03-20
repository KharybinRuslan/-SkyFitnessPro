import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./useAuth";
import { getMyCourseProgress, setMyCourseProgress } from "../utils/authStorage";
import {
  addCourseOnServer,
  fetchSelectedCoursesFromServer,
  removeCourseOnServer,
} from "../services/user";
import { MyCoursesContext, type MyCoursesContextValue } from "./myCoursesContextState";

/**
 * Список «мои курсы» только с GET /api/fitness/users/me (selectedCourses).
 * Добавление/удаление: POST/DELETE по POSTMAN_REQUESTS.md, без localStorage для id.
 */
export function MyCoursesProvider({ children }: { children: ReactNode }) {
  const { user, isAuth, token } = useAuth();
  const [myCourseIds, setMyCourseIds] = useState<string[]>([]);
  const [myCoursesInitialized, setMyCoursesInitialized] = useState(false);
  const [pendingSyncIds, setPendingSyncIds] = useState<string[]>([]);
  const [progressVersion, setProgressVersion] = useState(0);

  const myCourseIdsRef = useRef(myCourseIds);
  myCourseIdsRef.current = myCourseIds;

  const syncPendingRef = useRef<Set<string>>(new Set());

  const loadFromServer = useCallback(async () => {
    if (!token) {
      setMyCourseIds([]);
      setMyCoursesInitialized(true);
      return;
    }
    const ids = await fetchSelectedCoursesFromServer(token);
    if (ids !== null) {
      setMyCourseIds(ids);
    }
    setMyCoursesInitialized(true);
  }, [token]);

  const refresh = useCallback(() => {
    if (!token) return;
    void fetchSelectedCoursesFromServer(token).then((ids) => {
      if (ids !== null) setMyCourseIds(ids);
    });
  }, [token]);

  useEffect(() => {
    if (!isAuth || !token) {
      setMyCourseIds([]);
      setMyCoursesInitialized(false);
      syncPendingRef.current.clear();
      setPendingSyncIds([]);
      return;
    }
    setMyCoursesInitialized(false);
    void loadFromServer();
  }, [isAuth, token, loadFromServer]);

  const beginSync = useCallback((courseId: string): boolean => {
    if (syncPendingRef.current.has(courseId)) return false;
    syncPendingRef.current.add(courseId);
    setPendingSyncIds((p) => (p.includes(courseId) ? p : [...p, courseId]));
    return true;
  }, []);

  const endSync = useCallback((courseId: string) => {
    syncPendingRef.current.delete(courseId);
    setPendingSyncIds((p) => p.filter((id) => id !== courseId));
  }, []);

  const addCourse = useCallback(
    (courseId: string) => {
      if (!isAuth || !token) return;
      if (myCourseIdsRef.current.includes(courseId)) return;
      if (!beginSync(courseId)) return;

      setMyCourseIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));

      void (async () => {
        try {
          await addCourseOnServer(courseId, token);
        } finally {
          const ids = await fetchSelectedCoursesFromServer(token);
          if (ids !== null) setMyCourseIds(ids);
          endSync(courseId);
        }
      })();
    },
    [isAuth, token, beginSync, endSync]
  );

  const removeCourse = useCallback(
    (courseId: string) => {
      if (!isAuth || !token) return;
      if (!myCourseIdsRef.current.includes(courseId)) return;
      if (!beginSync(courseId)) return;

      setMyCourseIds((prev) => prev.filter((id) => id !== courseId));

      void (async () => {
        try {
          const ok = await removeCourseOnServer(courseId, token);
          if (!ok) {
            const ids = await fetchSelectedCoursesFromServer(token);
            if (ids !== null) setMyCourseIds(ids);
          }
        } finally {
          endSync(courseId);
        }
      })();
    },
    [isAuth, token, beginSync, endSync]
  );

  const getProgress = useCallback(
    (courseId: string): number => {
      const email = user?.email;
      if (!email) return 0;
      const progress = getMyCourseProgress(email);
      return progress[courseId] ?? 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- progressVersion для перечитывания из localStorage
    [user?.email, progressVersion]
  );

  const setProgress = useCallback(
    (courseId: string, percent: number): void => {
      const email = user?.email;
      if (!email) return;
      setMyCourseProgress(email, courseId, percent);
      setProgressVersion((v) => v + 1);
    },
    [user?.email]
  );

  const myCoursesLoading = Boolean(isAuth && token && !myCoursesInitialized);

  const isCourseSyncPending = useCallback(
    (courseId: string) => pendingSyncIds.includes(courseId),
    [pendingSyncIds]
  );

  const value = useMemo<MyCoursesContextValue>(
    () => ({
      myCourseIds,
      myCoursesLoading,
      isCourseSyncPending,
      addCourse,
      removeCourse,
      getProgress,
      setProgress,
      refresh,
    }),
    [
      myCourseIds,
      myCoursesLoading,
      isCourseSyncPending,
      addCourse,
      removeCourse,
      getProgress,
      setProgress,
      refresh,
    ]
  );

  return <MyCoursesContext.Provider value={value}>{children}</MyCoursesContext.Provider>;
}
