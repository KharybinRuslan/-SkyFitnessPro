const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Введите email";
  if (!EMAIL_REGEX.test(trimmed)) return "Введите корректный email";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Введите пароль";
  if (value.length < MIN_PASSWORD_LENGTH) return "Пароль должен быть не менее 6 символов";
  return null;
}

export function validateRepeatPassword(password: string, repeatPassword: string): string | null {
  if (!repeatPassword) return "Повторите пароль";
  if (password !== repeatPassword) return "Пароли не совпадают";
  return null;
}
