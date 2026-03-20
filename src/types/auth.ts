/** Пользователь, возвращаемый API после логина/регистрации */
export interface AuthUser {
  email?: string;
  name?: string;
  id?: string;
  /** Data URL загруженного аватара (png, jpeg, webp, svg и т.д.) */
  avatar?: string;
  [key: string]: unknown;
}

/** Тело запроса на вход */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Тело запроса на регистрацию */
export interface RegisterPayload {
  email: string;
  password: string;
}

/** Успешный ответ API (поддержка разных форматов) */
export interface AuthSuccessResponse {
  token?: string;
  accessToken?: string;
  user?: AuthUser;
  data?: {
    token?: string;
    accessToken?: string;
    user?: AuthUser;
  };
}

/** Ответ API с ошибкой */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ message?: string; field?: string }>;
}
