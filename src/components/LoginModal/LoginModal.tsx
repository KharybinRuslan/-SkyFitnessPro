import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/useAuth";
import { validateEmail, validatePassword, validateRepeatPassword } from "../../utils/validation";
import styles from "./LoginModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function getScrollbarWidth(): number {
  const outer = document.createElement("div");
  outer.style.overflow = "scroll";
  outer.style.width = "100px";
  outer.style.visibility = "hidden";
  document.body.appendChild(outer);
  const inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);
  const width = outer.offsetWidth - inner.offsetWidth;
  document.body.removeChild(outer);
  return width;
}

export default function LoginModal({ isOpen, onClose }: Props) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<"email" | "password" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    setErrorField(null);
    setEmail("");
    setPassword("");
    setRepeatPassword("");
  }, []);

  const handleSwitchMode = () => {
    resetForm();
    setMode((m) => (m === "login" ? "register" : "login"));
  };

  const runValidation = useCallback((): boolean => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setErrorField("email");
      return false;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setErrorField("password");
      return false;
    }
    if (mode === "register") {
      const repeatError = validateRepeatPassword(password, repeatPassword);
      if (repeatError) {
        setError(repeatError);
        setErrorField("password");
        return false;
      }
    }
    return true;
  }, [email, password, repeatPassword, mode]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setErrorField(null);
      setSuccessMessage(null);
      if (!runValidation()) return;
      setIsLoading(true);
      try {
        await login({ email: email.trim(), password });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка входа");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, login, onClose, runValidation]
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setErrorField(null);
      setSuccessMessage(null);
      if (!runValidation()) return;
      setIsLoading(true);
      try {
        const loggedIn = await register({
          email: email.trim(),
          password,
        });
        if (loggedIn) {
          onClose();
        } else {
          setSuccessMessage("Регистрация успешна. Войдите в аккаунт.");
          setMode("login");
          setRepeatPassword("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка регистрации");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, register, onClose, runValidation]
  );

  const handleSubmit = mode === "login" ? handleLogin : handleRegister;

  const isFormValid =
    mode === "login"
      ? !!email.trim() && !!password
      : !!email.trim() && !!password && !!repeatPassword && password === repeatPassword;

  const isSubmitDisabled = !isFormValid || isLoading;

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth();
      const hadScrollbar = document.documentElement.scrollHeight > window.innerHeight;
      if (hadScrollbar) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const submitLabel =
    mode === "login"
      ? isLoading
        ? "Входим..."
        : "Войти"
      : isLoading
        ? "Регистрируем..."
        : "Зарегистрироваться";

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <img src="/logo.svg" alt="SkyFitnessPro" className={styles.logo} />
        <form className={styles.content} onSubmit={handleSubmit}>
          <div className={styles.inputs}>
            <input
              type="email"
              placeholder={mode === "login" ? "Логин" : "Эл. почта"}
              className={`${styles.input} ${errorField === "email" ? styles.inputError : ""}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setErrorField(null);
              }}
              autoComplete="email"
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="Пароль"
              className={`${styles.input} ${errorField === "password" ? styles.inputError : ""}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
                setErrorField(null);
              }}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              disabled={isLoading}
            />
            {mode === "register" && (
              <input
                type="password"
                placeholder="Повторите пароль"
                className={`${styles.input} ${errorField === "password" ? styles.inputError : ""}`}
                value={repeatPassword}
                onChange={(e) => {
                  setRepeatPassword(e.target.value);
                  setError(null);
                  setErrorField(null);
                }}
                autoComplete="new-password"
                disabled={isLoading}
              />
            )}
          </div>
          {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}
          <div className={styles.buttons}>
            {mode === "login" ? (
              <>
                <button
                  type="submit"
                  className={`${styles.loginButton} ${isSubmitDisabled ? styles.inactive : ""}`}
                  disabled={isSubmitDisabled}
                >
                  {submitLabel}
                </button>
                <button
                  type="button"
                  className={styles.registerButton}
                  onClick={handleSwitchMode}
                  disabled={isLoading}
                >
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  className={`${styles.loginButton} ${isSubmitDisabled ? styles.inactive : ""}`}
                  disabled={isSubmitDisabled}
                >
                  {submitLabel}
                </button>
                <button
                  type="button"
                  className={styles.registerButton}
                  onClick={handleSwitchMode}
                  disabled={isLoading}
                >
                  Войти
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
