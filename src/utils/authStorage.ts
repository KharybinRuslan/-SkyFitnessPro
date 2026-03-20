import type { AuthUser } from "../types/auth";

const STORAGE_KEY_TOKEN = "skyfitness_auth_token";
const STORAGE_KEY_USER = "skyfitness_auth_user";
const STORAGE_KEY_AVATARS = "skyfitness_avatars";
const STORAGE_KEY_NAMES = "skyfitness_user_names";
const STORAGE_KEY_MY_COURSE_PROGRESS = "skyfitness_my_course_progress";
const STORAGE_KEY_COMPLETED_WORKOUTS = "skyfitness_completed_workouts";

export interface AuthData {
  token: string;
  user: AuthUser | null;
}

function getAuthData(): AuthData | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!token) return null;
    const userRaw = localStorage.getItem(STORAGE_KEY_USER);
    const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
    return { token, user };
  } catch {
    return null;
  }
}

function setAuthData(token: string, user: AuthUser | null): void {
  try {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_USER, user ? JSON.stringify(user) : "");
  } catch {
    // ignore storage errors
  }
}

function getStoredAvatar(email: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AVATARS);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[profileKey(email)] ?? null;
  } catch {
    return null;
  }
}

function setStoredAvatar(email: string, dataUrl: string | null): void {
  try {
    const key = profileKey(email);
    const raw = localStorage.getItem(STORAGE_KEY_AVATARS);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (dataUrl) {
      map[key] = dataUrl;
    } else {
      delete map[key];
    }
    localStorage.setItem(STORAGE_KEY_AVATARS, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function profileKey(email: string): string {
  return email.trim().toLowerCase();
}

function getStoredUserName(email: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NAMES);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[profileKey(email)] ?? null;
  } catch {
    return null;
  }
}

function setStoredUserName(email: string, name: string | null): void {
  try {
    const key = profileKey(email);
    const raw = localStorage.getItem(STORAGE_KEY_NAMES);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (name && name.trim()) {
      map[key] = name.trim();
    } else {
      delete map[key];
    }
    localStorage.setItem(STORAGE_KEY_NAMES, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function clearAuthData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch {
    // ignore
  }
}

function getMyCourseProgress(email: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MY_COURSE_PROGRESS);
    if (!raw) return {};
    const map = JSON.parse(raw) as Record<string, Record<string, number>>;
    return map[profileKey(email)] ?? {};
  } catch {
    return {};
  }
}

function setMyCourseProgress(email: string, courseId: string, percent: number): void {
  try {
    const key = profileKey(email);
    const raw = localStorage.getItem(STORAGE_KEY_MY_COURSE_PROGRESS);
    const map = raw ? (JSON.parse(raw) as Record<string, Record<string, number>>) : {};
    if (!map[key]) map[key] = {};
    map[key][courseId] = Math.min(100, Math.max(0, percent));
    localStorage.setItem(STORAGE_KEY_MY_COURSE_PROGRESS, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** ID тренировок, отмеченных как выполненные по курсу (для галочек в модалке и прогресса). */
function getCompletedWorkoutIds(email: string, courseId: string): string[] {
  try {
    const key = profileKey(email);
    const raw = localStorage.getItem(STORAGE_KEY_COMPLETED_WORKOUTS);
    const map = raw ? (JSON.parse(raw) as Record<string, Record<string, string[]>>) : {};
    return map[key]?.[courseId] ?? [];
  } catch {
    return [];
  }
}

function setWorkoutCompleted(email: string, courseId: string, workoutId: string): void {
  try {
    const key = profileKey(email);
    const raw = localStorage.getItem(STORAGE_KEY_COMPLETED_WORKOUTS);
    const map = raw ? (JSON.parse(raw) as Record<string, Record<string, string[]>>) : {};
    if (!map[key]) map[key] = {};
    if (!map[key][courseId]) map[key][courseId] = [];
    if (!map[key][courseId].includes(workoutId)) {
      map[key][courseId] = [...map[key][courseId], workoutId];
    }
    localStorage.setItem(STORAGE_KEY_COMPLETED_WORKOUTS, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** Очистить список завершённых тренировок по курсу (при «Начать заново»). */
function clearCompletedWorkoutsForCourse(email: string, courseId: string): void {
  try {
    const key = profileKey(email);
    const raw = localStorage.getItem(STORAGE_KEY_COMPLETED_WORKOUTS);
    const map = raw ? (JSON.parse(raw) as Record<string, Record<string, string[]>>) : {};
    if (!map[key]) return;
    map[key] = { ...map[key], [courseId]: [] };
    localStorage.setItem(STORAGE_KEY_COMPLETED_WORKOUTS, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export {
  getAuthData,
  setAuthData,
  getStoredAvatar,
  setStoredAvatar,
  getStoredUserName,
  setStoredUserName,
  clearAuthData,
  getMyCourseProgress,
  setMyCourseProgress,
  getCompletedWorkoutIds,
  setWorkoutCompleted,
  clearCompletedWorkoutsForCourse,
};
