import { createContext } from "react";
import type { AuthUser } from "../types/auth";
import type { LoginPayload, RegisterPayload } from "../types/auth";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuth: boolean;
  isRestoring: boolean;
}

/** true = пользователь залогинен, false = только регистрация (нужно показать форму входа) */
export type RegisterOutcome = boolean;

export interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterOutcome>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
