/** Базовый URL API: https://wedev-api.sky.pro/api + /fitness (документация /api/fitness) */
const API_BASE = "https://wedev-api.sky.pro/api";
const baseUrl = import.meta.env.VITE_API_URL || `${API_BASE}/fitness`;

function isDuplicateCourseMessage(msg: string): boolean {
  const m = String(msg).toLowerCase();
  return (
    m.includes("уже") || m.includes("already") || m.includes("duplicate") || m.includes("exists")
  );
}

function authHeaders(token: string, withContentType = false): HeadersInit {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (withContentType) headers["Content-Type"] = "application/json";
  return headers;
}

/**
 * POST /api/fitness/users/me/courses — добавить курс на бэкенд (wedev-api.sky.pro).
 * Body по документации: { "courseId": "..." }
 */
export async function addCourseOnServer(courseId: string, token: string): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me/courses`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify({ courseId }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const msg = (() => {
        try {
          const data = text ? JSON.parse(text) : {};
          return data?.message ?? data?.error ?? text;
        } catch {
          return text;
        }
      })();
      if (
        response.status === 500 &&
        (msg === "Курс уже был добавлен!" || String(msg).includes("уже был добавлен"))
      )
        return;
      /* 400 — часто «курс уже в профиле» при рассинхроне localStorage и сервера */
      if (response.status === 400 && isDuplicateCourseMessage(String(msg))) return;
    }
  } catch {
    /* сеть: локальный список курсов уже обновлён */
  }
}

/**
 * GET /users/me — список курсов на сервере (selectedCourses).
 * Нужен, чтобы localStorage совпадал с API и не сыпались DELETE 500 / POST 400.
 */
export async function fetchSelectedCoursesFromServer(token: string): Promise<string[] | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me`;
  try {
    const response = await fetch(url, {
      headers: authHeaders(token, false),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json().catch(() => null);
    if (!data || typeof data !== "object") return null;
    const record = data as { selectedCourses?: unknown; courses?: unknown };
    const raw = record.selectedCourses ?? record.courses;
    if (!Array.isArray(raw)) return null;
    return raw.filter((id): id is string => typeof id === "string");
  } catch {
    return null;
  }
}

/**
 * DELETE /api/fitness/users/me/courses/[courseId] — удалить курс на бэкенде.
 */
export async function removeCourseOnServer(courseId: string, token: string): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me/courses/${encodeURIComponent(courseId)}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: authHeaders(token, false),
    });
    if (!response.ok) {
      await response.text().catch(() => "");
    }
  } catch {
    /* сеть: локальный список курсов уже обновлён */
  }
}
