import type {
  WorkoutListItem,
  WorkoutDetails,
  CourseProgressResponse,
  WorkoutProgressResponse,
} from "../types/workouts";

/** Базовый URL API: https://wedev-api.sky.pro/api + /fitness (см. документацию /api/fitness) */
const API_BASE = "https://wedev-api.sky.pro/api";
const baseUrl = import.meta.env.VITE_API_URL || `${API_BASE}/fitness`;

function authHeaders(token: string, withContentType = false): HeadersInit {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (withContentType) headers["Content-Type"] = "application/json";
  return headers;
}

export async function getCourseWorkouts(
  courseId: string,
  token: string
): Promise<WorkoutListItem[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/courses/${courseId}/workouts`;
  const response = await fetch(url, { headers: authHeaders(token) });
  if (response.status === 401) throw new Error("Требуется авторизация");
  if (response.status === 400) return [];
  if (!response.ok) throw new Error("Не удалось загрузить тренировки");
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function getWorkoutById(
  workoutId: string,
  token: string
): Promise<WorkoutDetails | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/workouts/${workoutId}`;
  try {
    const response = await fetch(url, { headers: authHeaders(token) });
    if (response.status === 401) throw new Error("Требуется авторизация");
    if (response.status === 404 || response.status === 400 || response.status === 500) {
      await response.text().catch(() => {});
      return null;
    }
    if (!response.ok) return null;
    return (await response.json()) as WorkoutDetails;
  } catch (e) {
    if (e instanceof Error && e.message === "Требуется авторизация") throw e;
    return null;
  }
}

/** Прогресс по курсу. При 4xx/5xx возвращаем null (бэкенд иногда отдаёт 500). */
export async function getCourseProgress(
  courseId: string,
  token: string
): Promise<CourseProgressResponse | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me/progress?courseId=${encodeURIComponent(courseId)}`;
  try {
    const response = await fetch(url, { headers: authHeaders(token) });
    if (
      response.status === 401 ||
      response.status === 400 ||
      response.status === 500 ||
      !response.ok
    ) {
      await response.text().catch(() => {});
      return null;
    }
    const data = await response.json();
    return data as CourseProgressResponse;
  } catch {
    return null;
  }
}

/** GET /users/me/progress?courseId=&workoutId= — прогресс по одной тренировке */
export async function getWorkoutProgress(
  courseId: string,
  workoutId: string,
  token: string
): Promise<WorkoutProgressResponse | null> {
  const params = new URLSearchParams({ courseId, workoutId });
  const url = `${baseUrl.replace(/\/$/, "")}/users/me/progress?${params.toString()}`;
  try {
    const response = await fetch(url, { headers: authHeaders(token) });
    if (response.status === 401 || response.status === 400 || !response.ok) return null;
    const data = await response.json();
    return data as WorkoutProgressResponse;
  } catch {
    return null;
  }
}

/** PATCH /api/fitness/courses/[courseId]/workouts/[workoutId] — body: { progressData: number[] } */
export async function updateWorkoutProgress(
  courseId: string,
  workoutId: string,
  progressData: number[],
  token: string
): Promise<void> {
  const path = `/courses/${encodeURIComponent(courseId)}/workouts/${encodeURIComponent(workoutId)}`;
  const q = new URLSearchParams({ courseId, workoutId });
  const url = `${baseUrl.replace(/\/$/, "")}${path}?${q.toString()}`;
  const payload: number[] = progressData.map((n) => Math.max(0, Math.floor(Number(n)) || 0));
  const body = JSON.stringify({ progressData: payload });
  const response = await fetch(url, {
    method: "PATCH",
    headers: authHeaders(token, false),
    body,
  });
  if (response.status === 401) throw new Error("Требуется авторизация");
  if (!response.ok) {
    const msg = await response.text().catch(() => "");
    let errMsg = "Не удалось сохранить прогресс";
    try {
      const data = msg ? JSON.parse(msg) : {};
      errMsg = data.message ?? data.error ?? errMsg;
    } catch {
      if (msg) errMsg = msg;
    }
    throw new Error(errMsg);
  }
}

/** PATCH /courses/[courseId]/reset — сбросить весь прогресс по курсу */
export async function resetCourseProgress(courseId: string, token: string): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/courses/${encodeURIComponent(courseId)}/reset`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (response.status === 401) throw new Error("Требуется авторизация");
  if (!response.ok) throw new Error("Не удалось сбросить прогресс курса");
}

/** PATCH /courses/[courseId]/workouts/[workoutId]/reset — сбросить прогресс по тренировке */
export async function resetWorkoutProgress(
  courseId: string,
  workoutId: string,
  token: string
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/courses/${courseId}/workouts/${workoutId}/reset`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (response.status === 401) throw new Error("Требуется авторизация");
  if (!response.ok) throw new Error("Не удалось сбросить прогресс");
}
