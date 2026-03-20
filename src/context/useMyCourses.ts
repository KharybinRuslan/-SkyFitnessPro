import { useContext } from "react";
import {
  MyCoursesContext,
  defaultMyCoursesValue,
  type MyCoursesContextValue,
} from "./myCoursesContextState";

export function useMyCourses(): MyCoursesContextValue {
  const ctx = useContext(MyCoursesContext);
  return ctx ?? defaultMyCoursesValue;
}
