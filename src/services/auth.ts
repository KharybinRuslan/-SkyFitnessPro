import type {
  AuthUser,
  AuthSuccessResponse,
  ApiErrorResponse,
  LoginPayload,
  RegisterPayload,
} from "../types/auth";

const baseUrl = import.meta.env.VITE_API_URL || "https://wedev-api.sky.pro/api/fitness";

const authLoginPath = import.meta.env.VITE_API_AUTH_LOGIN || "/auth/login";
const authRegisterPath = import.meta.env.VITE_API_AUTH_REGISTER || "/auth/register";

export interface NormalizedAuthResult {
  token: string;
  user: AuthUser | null;
}

function normalizeAuthResponse(body: unknown): NormalizedAuthResult | null {
  if (!body || typeof body !== "object") return null;
  const data = body as AuthSuccessResponse;
  const token = data.token ?? data.accessToken ?? data.data?.token ?? data.data?.accessToken;
  const user = data.user ?? data.data?.user ?? null;
  if (!token || typeof token !== "string") return null;
  return { token, user: user ?? null };
}

function extractErrorMessage(response: Response, body: unknown): string {
  if (body && typeof body === "object") {
    const err = body as ApiErrorResponse;
    if (typeof err.message === "string" && err.message) return err.message;
    if (typeof err.error === "string" && err.error) return err.error;
    if (Array.isArray(err.errors) && err.errors[0]?.message) return err.errors[0].message;
  }
  if (response.status === 401) return "Неверный email или пароль";
  if (response.status === 404)
    return "Эндпоинт не найден (404). Проверьте VITE_API_URL и пути авторизации.";
  if (response.status >= 500) return "Ошибка сервера. Попробуйте позже.";
  return "Произошла ошибка. Попробуйте ещё раз.";
}

export async function login(payload: LoginPayload): Promise<NormalizedAuthResult> {
  const url = authLoginPath.startsWith("http")
    ? authLoginPath
    : `${baseUrl.replace(/\/$/, "")}${authLoginPath.startsWith("/") ? "" : "/"}${authLoginPath}`;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  let body: unknown;
  const contentType = response.headers.get("content-type");
  try {
    body = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();
    if (typeof body === "string") body = { message: body };
  } catch {
    body = {};
  }
  if (!response.ok) {
    throw new Error(extractErrorMessage(response, body));
  }
  const result = normalizeAuthResponse(body);
  if (!result) throw new Error("Неверный формат ответа сервера");
  return result;
}

export type RegisterResult =
  | { token: string; user: AuthUser | null; registrationOnly?: false }
  | { registrationOnly: true };

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const url = authRegisterPath.startsWith("http")
    ? authRegisterPath
    : `${baseUrl.replace(/\/$/, "")}${authRegisterPath.startsWith("/") ? "" : "/"}${authRegisterPath}`;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  let body: unknown;
  const contentType = response.headers.get("content-type");
  try {
    body = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();
    if (typeof body === "string") body = { message: body };
  } catch {
    body = {};
  }
  if (!response.ok) {
    throw new Error(extractErrorMessage(response, body));
  }
  const result = normalizeAuthResponse(body);
  if (result) return result;
  // Успешная регистрация без токена в ответе — пользователь должен войти
  return { registrationOnly: true };
}
