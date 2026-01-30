import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

type AuthUser = {
  username: string;
  groups: string[];
  folderId?: string;
};

type AuthContextValue = {
  status: "loading" | "signedOut" | "signedIn";
  user?: AuthUser;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [user, setUser] = useState<AuthUser | undefined>(undefined);

  const loadAuth = useCallback(async (forceRefresh = false) => {
    try {
      const current = await getCurrentUser();
      const session = await fetchAuthSession({ forceRefresh });
      const idToken = session.tokens?.idToken;
      const payload = idToken?.payload ?? {};
      const groupsClaim = payload["cognito:groups"];
      const groups = Array.isArray(groupsClaim)
        ? groupsClaim.filter((value): value is string => typeof value === "string")
        : typeof groupsClaim === "string" && groupsClaim.length > 0
          ? groupsClaim.split(",")
          : [];

      const folderId = typeof payload["custom:folderId"] === "string"
        ? payload["custom:folderId"]
        : undefined;

      setUser({
        username: current.username,
        groups,
        folderId,
      });
      setStatus("signedIn");
    } catch {
      setUser(undefined);
      setStatus("signedOut");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadAuth();

    const cancel = Hub.listen("auth", () => {
      loadAuth();
    });

    return () => {
      mounted = false;
      if (typeof cancel === "function") {
        cancel();
      }
    };
  }, [loadAuth]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      refresh: () => loadAuth(true),
      signOut: handleSignOut,
    }),
    [status, user, loadAuth, handleSignOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
