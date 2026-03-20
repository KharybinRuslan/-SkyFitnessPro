import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import styles from "./Header.module.css";

type Props = {
  onLoginClick: () => void;
};

function displayUserName(user: { email?: string; name?: string } | null): string {
  if (!user) return "";
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "";
}

function displayUserEmail(user: { email?: string; name?: string } | null): string {
  if (!user?.email) return "";
  return user.email;
}

function AvatarIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M41.6667 20.8333C41.6667 32.3393 32.3393 41.6667 20.8333 41.6667C9.3274 41.6667 0 32.3393 0 20.8333C0 9.3274 9.3274 0 20.8333 0C32.3393 0 41.6667 9.3274 41.6667 20.8333ZM33.3333 28.2738C33.3333 31.7256 27.7369 35.4167 20.8333 35.4167C13.9298 35.4167 8.33333 31.7256 8.33333 28.2738C8.33333 24.822 13.9298 22.9167 20.8333 22.9167C27.7369 22.9167 33.3333 24.822 33.3333 28.2738ZM20.8333 18.75C24.2851 18.75 27.0833 15.9518 27.0833 12.5C27.0833 9.04822 24.2851 6.25 20.8333 6.25C17.3816 6.25 14.5833 9.04822 14.5833 12.5C14.5833 15.9518 17.3816 18.75 20.8333 18.75Z"
        fill="#D9D9D9"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="13"
      height="8"
      viewBox="0 0 13 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12.0624 0.707154L6.38477 6.38477L0.707152 0.707154"
        stroke="black"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function Header({ onLoginClick }: Props) {
  const { isAuth, user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  const userName = displayUserName(user);
  const userEmail = displayUserEmail(user);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <a href="/" className={styles.logoLink}>
          <img src="/logo.svg" alt="SkyFitnessPro" className={styles.logo} />
          <span className={styles.tagline}>Онлайн-тренировки для занятий дома</span>
        </a>
        {isAuth ? (
          <div className={styles.userBlock} ref={dropdownRef}>
            <button
              type="button"
              className={styles.userTrigger}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <span className={styles.avatar}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className={styles.avatarImg} />
                ) : (
                  <AvatarIcon />
                )}
              </span>
              <span className={styles.userName}>{userName || "Пользователь"}</span>
              <span className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ""}`}>
                <ChevronIcon />
              </span>
            </button>
            {dropdownOpen && (
              <div className={styles.dropdown}>
                <p className={styles.dropdownName}>{userName || "Пользователь"}</p>
                <p className={styles.dropdownEmail}>{userEmail}</p>
                <div className={styles.dropdownButtons}>
                  <Link
                    to="/profile"
                    className={styles.profileButton}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Мой профиль
                  </Link>
                  <button
                    type="button"
                    className={styles.logoutButton}
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                  >
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className={styles.loginButton} onClick={onLoginClick}>
            Войти
          </button>
        )}
      </div>
    </header>
  );
}
