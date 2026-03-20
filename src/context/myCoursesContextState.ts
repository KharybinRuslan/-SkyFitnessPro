import { createContext } from "react";

export interface MyCoursesContextValue {
  myCourseIds: string[];
  addCourse: (courseId: string) => void;
  removeCourse: (courseId: string) => void;
  getProgress: (courseId: string) => number;
  setProgress: (courseId: string, percent: number) => void;
  refresh: () => void;
}

export const MyCoursesContext = createContext<MyCoursesContextValue | null>(null);

export const defaultMyCoursesValue: MyCoursesContextValue = {
  myCourseIds: [],
  addCourse: () => {},
  removeCourse: () => {},
  getProgress: () => 0,
  setProgress: () => {},
  refresh: () => {},
};
