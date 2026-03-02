/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import {
  authenticateWithApiToken,
  clearStoredApiToken,
  getAuthStatusFromApi,
  getStoredApiBaseUrl,
  getStoredApiToken,
  setStoredApiBaseUrl,
  setStoredApiToken
} from "../../features/documents/api";

interface AuthContextValue {
  apiBaseUrl: string;
  authError: string | null;
  authRequired: boolean;
  isAuthenticated: boolean;
  isChecking: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  setApiBaseUrl: (nextBaseUrl: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [apiBaseUrl, setApiBaseUrlState] = useState(() => getStoredApiBaseUrl());
  const [authRequired, setAuthRequired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setIsChecking(true);
      setAuthError(null);

      if (!apiBaseUrl) {
        if (!cancelled) {
          setAuthRequired(false);
          setIsAuthenticated(true);
          setIsChecking(false);
        }

        return;
      }

      try {
        const status = await getAuthStatusFromApi();

        if (cancelled) {
          return;
        }

        setAuthRequired(status.authRequired);

        if (!status.authRequired) {
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }

        const storedToken = getStoredApiToken();

        if (!storedToken) {
          setIsAuthenticated(false);
          setIsChecking(false);
          return;
        }

        await authenticateWithApiToken(storedToken);

        if (!cancelled) {
          setIsAuthenticated(true);
          setIsChecking(false);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Auth bootstrap failed.";

        if (/access token|authentication required/i.test(message)) {
          clearStoredApiToken();
          setAuthRequired(true);
          setIsAuthenticated(false);
          setAuthError(message);
          setIsChecking(false);
          return;
        }

        setAuthRequired(false);
        setIsAuthenticated(true);
        setAuthError(`${message} Falling back to app-local access.`);
        setIsChecking(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  const value = useMemo<AuthContextValue>(
    () => ({
      apiBaseUrl,
      authError,
      authRequired,
      isAuthenticated,
      isChecking,
      login: async (token) => {
        const trimmedToken = token.trim();

        if (!trimmedToken) {
          throw new Error("Enter the DocManager access token.");
        }

        setIsChecking(true);
        try {
          await authenticateWithApiToken(trimmedToken);
          setStoredApiToken(trimmedToken);
          setAuthRequired(true);
          setIsAuthenticated(true);
          setAuthError(null);
        } finally {
          setIsChecking(false);
        }
      },
      logout: () => {
        clearStoredApiToken();
        setIsAuthenticated(!authRequired);
        setAuthError(null);
      },
      setApiBaseUrl: (nextBaseUrl) => {
        setStoredApiBaseUrl(nextBaseUrl);
        setApiBaseUrlState(getStoredApiBaseUrl());
      }
    }),
    [apiBaseUrl, authError, authRequired, isAuthenticated, isChecking]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
};
