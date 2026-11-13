"use client";

import { useEffect, useState } from "react";
import { updateUserAttributes } from "aws-amplify/auth";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fetchPublicPhotos } from "@/lib/api/photos";
import { Skeleton } from "@/components/ui/Skeleton";

function useBackgroundPhoto() {
  return useQuery({
    queryKey: ["account-background"],
    queryFn: async () => (await fetchPublicPhotos({ limit: 1 })).photos[0] ?? null,
    staleTime: 10 * 60_000,
  });
}

export default function AccountPage() {
  const { user, refresh } = useAuth();
  const { data: background } = useBackgroundPhoto();
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGivenName(user?.givenName ?? "");
    setFamilyName(user?.familyName ?? "");
  }, [user?.givenName, user?.familyName]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGiven = givenName.trim();
    const trimmedFamily = familyName.trim();
    setError(null);
    setConfirmation(null);

    if (!trimmedGiven || !trimmedFamily) {
      setError("First name and last name are required.");
      return;
    }

    setSaving(true);
    try {
      await updateUserAttributes({
        userAttributes: {
          given_name: trimmedGiven,
          family_name: trimmedFamily,
          name: `${trimmedGiven} ${trimmedFamily}`,
        },
      });
      await refresh();
      setConfirmation("Your profile has been updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      {background && !backgroundLoaded && <Skeleton className="absolute inset-0" />}
      {background && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={background.url}
          alt=""
          onLoad={() => setBackgroundLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            backgroundLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-xl">
        <h1 className="font-serif text-2xl italic text-foreground">Account</h1>
        <p className="mt-2 text-sm text-muted">Update your name on file.</p>

        <form onSubmit={saveProfile} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-muted">
              Email
            </span>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-muted">
              First name
            </span>
            <input
              type="text"
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-muted">
              Last name
            </span>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {confirmation && <p className="text-sm text-accent">{confirmation}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Please wait…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
