"use client";

import { useEffect, useState } from "react";
import { updateUserAttributes } from "aws-amplify/auth";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function AccountPage() {
  const { user, refresh } = useAuth();
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
    <div className="mx-auto max-w-md px-5 pb-24 pt-32 sm:px-8">
      <h1 className="font-serif text-2xl italic">Account</h1>

      <form onSubmit={saveProfile} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wide text-muted">
            Email
          </span>
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted"
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {confirmation && <p className="text-sm text-accent">{confirmation}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent px-6 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
