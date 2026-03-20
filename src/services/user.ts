/** Базовый URL API: https://wedev-api.sky.pro/api + /fitness (документация /api/fitness) */
const API_BASE = "https://wedev-api.sky.pro/api";
const baseUrl =
  import.meta.env.VITE_API_URL || `${API_BASE}/fitness`;

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
export async function addCourseOnServer(
  courseId: string,
  token: string
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me/courses`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(token, false),
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
      if (response.status === 500 && (msg === "Курс уже был добавлен!" || String(msg).includes("уже был добавлен"))) return;
      if (import.meta.env.DEV && msg) {
        console.warn("[POST /users/me/courses]", response.status, msg);
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[POST /users/me/courses] сеть:", e);
  }
}

/**
 * DELETE /api/fitness/users/me/courses/[courseId] — удалить курс на бэкенде.
 */
export async function removeCourseOnServer(
  courseId: string,
  token: string
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me/courses/${encodeURIComponent(courseId)}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: authHeaders(token, false),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      if (import.meta.env.DEV && text) {
        try {
          const data = JSON.parse(text);
          console.warn("[DELETE /users/me/courses]", response.status, data?.message ?? text);
        } catch {
          console.warn("[DELETE /users/me/courses]", response.status, text);
        }
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[DELETE /users/me/courses] сеть:", e);
  }
}
