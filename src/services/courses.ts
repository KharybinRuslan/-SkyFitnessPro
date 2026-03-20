import type { CourseListItem, CourseDetails } from "../types/courses";

const baseUrl = import.meta.env.VITE_API_URL || "https://wedev-api.sky.pro/api/fitness";

export async function getCourses(): Promise<CourseListItem[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/courses`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Не удалось загрузить курсы. Попробуйте позже.");
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Неверный формат ответа сервера");
  }
  return data as CourseListItem[];
}

export async function getCourseById(courseId: string): Promise<CourseDetails | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/courses/${courseId}`;
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("Не удалось загрузить курс. Попробуйте позже.");
  }
  const data = await response.json();
  return data as CourseDetails;
}
