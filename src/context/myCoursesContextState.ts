import { createContext } from "react";

export interface MyCoursesContextValue {
  /** ID курсов из GET /api/fitness/users/me (selectedCourses), без localStorage */
  myCourseIds: string[];
  /** Первичная подгрузка списка с сервера после входа */
  myCoursesLoading: boolean;
  /** Курс в процессе POST/DELETE с API (чтобы не дублировать запросы) */
  isCourseSyncPending: (courseId: string) => boolean;
  addCourse: (courseId: string) => void;
  removeCourse: (courseId: string) => void;
  getProgress: (courseId: string) => number;
  setProgress: (courseId: string, percent: number) => void;
  refresh: () => void;
}

export const MyCoursesContext = createContext<MyCoursesContextValue | null>(null);

export const defaultMyCoursesValue: MyCoursesContextValue = {
  myCourseIds: [],
  myCoursesLoading: false,
  isCourseSyncPending: () => false,
  addCourse: () => {},
  removeCourse: () => {},
  getProgress: () => 0,
  setProgress: () => {},
  refresh: () => {},
};
