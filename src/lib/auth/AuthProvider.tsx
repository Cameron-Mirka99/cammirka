"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  signOut as amplifySignOut,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { configureAmplify } from "./amplifyConfig";

export type AuthUser = {
  username: string;
  email?: string;
  givenName?: string;
  familyName?: string;
  fullName?: string;
  groups: string[];
  folderId?: string;
};

type AuthStatus = "loading" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeGroups(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    return raw
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const loadAuth = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      const session = await fetchAuthSession();
      const attributes = await fetchUserAttributes();

      const idTokenPayload = session.tokens?.idToken?.payload ?? {};
      const groups = normalizeGroups(idTokenPayload["cognito:groups"]);
      const folderId =
        (idTokenPayload["custom:folderId"] as string | undefined) ??
        attributes["custom:folderId"];

      const givenName = attributes.given_name;
      const familyName = attributes.family_name;
      const fullName =
        [givenName, familyName].filter(Boolean).join(" ").trim() ||
        attributes.name;

      setUser({
        username: current.username,
        email: attributes.email,
        givenName,
        familyName,
        fullName,
        groups,
        folderId,
      });
      setStatus("signedIn");
    } catch {
      setUser(null);
      setStatus("signedOut");
    }
  }, []);

  useEffect(() => {
    configureAmplify();
    loadAuth();

    const unsubscribe = Hub.listen("auth", () => {
      loadAuth();
    });
    return unsubscribe;
  }, [loadAuth]);

  const signOut = useCallback(async () => {
    await amplifySignOut();
    setUser(null);
    setStatus("signedOut");
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, refresh: loadAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
