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
 * Тело по документации: { "courseId": "..." }.
 * @returns true если курс на сервере можно считать добавленным (успех или «уже есть»)
 */
export async function addCourseOnServer(courseId: string, token: string): Promise<boolean> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me/courses`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(token, true),
      body: JSON.stringify({ courseId }),
    });
    if (response.ok) return true;
    const text = await response.text().catch(() => "");
    const msg = (() => {
      try {
        const data = text ? JSON.parse(text) : {};
        return data?.message ?? data?.error ?? text;
      } catch {
        return text;
      }
    })();
    const s = String(msg);
    if (
      response.status === 500 &&
      (s.includes("Курс уже был добавлен") || s.includes("уже был добавлен"))
    )
      return true;
    /* 400 — часто «уже в профиле»; пустое тело тоже встречается у прокси */
    if (response.status === 400 && (!s.trim() || isDuplicateCourseMessage(s))) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * GET /users/me — список курсов на сервере (selectedCourses).
 * Нужен, чтобы localStorage совпадал с API и не сыпались DELETE 500 / POST 400.
 */
function normalizeCourseIdList(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") out.push(item);
    else if (item && typeof item === "object" && "_id" in item) {
      const id = (item as { _id: unknown })._id;
      if (typeof id === "string") out.push(id);
    }
  }
  return out;
}

function pickSelectedCoursesPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  const nested = r.data;
  if (nested && typeof nested === "object") {
    const d = nested as Record<string, unknown>;
    if (Array.isArray(d.selectedCourses)) return d.selectedCourses;
    if (Array.isArray(d.courses)) return d.courses;
  }
  if (Array.isArray(r.selectedCourses)) return r.selectedCourses;
  if (Array.isArray(r.courses)) return r.courses;
  return null;
}

export async function fetchSelectedCoursesFromServer(token: string): Promise<string[] | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me`;
  try {
    const response = await fetch(url, {
      headers: authHeaders(token, false),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json().catch(() => null);
    const raw = pickSelectedCoursesPayload(data);
    return normalizeCourseIdList(raw);
  } catch {
    return null;
  }
}

/**
 * DELETE /api/fitness/users/me/courses/[courseId] — удалить курс на бэкенде.
 * @returns true если сервер подтвердил удаление
 */
export async function removeCourseOnServer(courseId: string, token: string): Promise<boolean> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me/courses/${encodeURIComponent(courseId)}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: authHeaders(token, false),
    });
    if (!response.ok) {
      await response.text().catch(() => "");
    }
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}
