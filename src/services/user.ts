/** Базовый URL API: https://wedev-api.sky.pro/api + /fitness (документация /api/fitness) */
const API_BASE = "https://wedev-api.sky.pro/api";
const baseUrl = import.meta.env.VITE_API_URL || `${API_BASE}/fitness`;

function isDuplicateCourseMessage(msg: string): boolean {
  const m = String(msg).toLowerCase();
  return (
    m.includes("уже") || m.includes("already") || m.includes("duplicate") || m.includes("exists")
  );
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

/**
 * POST /api/fitness/users/me/courses — добавить курс на бэкенд (wedev-api.sky.pro).
 * Тело: { "courseId": "..." } (JSON).
 * Важно: wedev-api отвечает 400, если передать заголовок Content-Type: application/json —
 * см. ответ API «…не умеет работать с этим заголовком, уберите его».
 */
export async function addCourseOnServer(courseId: string, token: string): Promise<boolean> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me/courses`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(token),
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

function tryCoursesArrays(o: Record<string, unknown>): unknown {
  if (Array.isArray(o.selectedCourses)) return o.selectedCourses;
  if (Array.isArray(o.courses)) return o.courses;
  if (Array.isArray(o.myCourses)) return o.myCourses;
  return null;
}

/** Разные варианты JSON от GET /users/me (док: { email, selectedCourses }) */
function pickSelectedCoursesPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  const direct = tryCoursesArrays(r);
  if (direct) return direct;
  for (const key of ["data", "user", "result", "body", "payload"]) {
    const v = r[key];
    if (v && typeof v === "object") {
      const nested = tryCoursesArrays(v as Record<string, unknown>);
      if (nested) return nested;
    }
  }
  return null;
}

export async function fetchSelectedCoursesFromServer(token: string): Promise<string[] | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/users/me`;
  try {
    const response = await fetch(url, {
      headers: authHeaders(token),
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
      headers: authHeaders(token),
    });
    if (!response.ok) {
      await response.text().catch(() => "");
    }
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}
