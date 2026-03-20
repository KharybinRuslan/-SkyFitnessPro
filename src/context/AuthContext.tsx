import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "../types/auth";
import type { LoginPayload, RegisterPayload } from "../types/auth";
import * as authService from "../services/auth";
import { getAuthData, setAuthData, clearAuthData, getStoredAvatar, setStoredAvatar, getStoredUserName, setStoredUserName } from "../utils/authStorage";
import { AuthContext, type AuthContextValue, type AuthState, type RegisterOutcome } from "./authContextState";

function mergeStoredProfile(email: string | undefined, user: AuthUser): AuthUser {
  if (!email) return user;
  const savedAvatar = getStoredAvatar(email);
  const savedName = getStoredUserName(email);
  return {
    ...user,
    ...(savedAvatar ? { avatar: savedAvatar } : {}),
    ...(savedName ? { name: savedName } : {}),
  };
}

function getInitialAuthState(): AuthState {
  const stored = getAuthData();
  if (stored?.token && stored.user) {
    const user = mergeStoredProfile(stored.user.email, stored.user);
    if (user !== stored.user) setAuthData(stored.token, user);
    return { user, token: stored.token, isAuth: true, isRestoring: false };
  }
  return { user: null, token: null, isAuth: false, isRestoring: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getInitialAuthState);

  const login = useCallback(async (payload: LoginPayload) => {
    const { token, user } = await authService.login(payload);
    const userWithEmail = user?.email ? user : { ...user, email: payload.email };
    const userMerged = mergeStoredProfile(userWithEmail?.email, userWithEmail);
    setAuthData(token, userMerged);
    setState({ user: userMerged, token, isAuth: true, isRestoring: false });
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<RegisterOutcome> => {
    const result = await authService.register(payload);
    if ("registrationOnly" in result && result.registrationOnly) return false;
    const { token, user } = result;
    const userWithEmail = user?.email ? user : { ...user, email: payload.email };
    const userMerged = mergeStoredProfile(userWithEmail?.email, userWithEmail);
    setAuthData(token, userMerged);
    setState({ user: userMerged, token, isAuth: true, isRestoring: false });
    return true;
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    setState({ user: null, token: null, isAuth: false, isRestoring: false });
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setState((prev) => {
      if (!prev.user || !prev.token) return prev;
      const updatedUser = { ...prev.user, ...updates };
      const email = prev.user.email;
      if (email) {
        if ("avatar" in updates) setStoredAvatar(email, updates.avatar ?? null);
        if ("name" in updates) setStoredUserName(email, updates.name ?? null);
      }
      setAuthData(prev.token, updatedUser);
      return { ...prev, user: updatedUser };
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateUser,
    }),
    [state, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
