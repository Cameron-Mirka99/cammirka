"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp, confirmSignUp } from "aws-amplify/auth";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPhotos } from "@/lib/api/photos";
import { photoApiBaseUrl } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  captureInviteFromUrl,
  redeemStoredInvite,
} from "@/lib/auth/inviteCode";
import { Skeleton } from "@/components/ui/Skeleton";

type Step = "signIn" | "signUp" | "confirm";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function useBackgroundPhoto() {
  return useQuery({
    queryKey: ["login-background"],
    queryFn: async () => (await fetchPublicPhotos({ limit: 1 })).photos[0] ?? null,
    staleTime: 10 * 60_000,
  });
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, refresh } = useAuth();
  const { data: background } = useBackgroundPhoto();
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  const [step, setStep] = useState<Step>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const redeemedOnce = useRef(false);

  useEffect(() => {
    captureInviteFromUrl(searchParams.get("invite"));
  }, [searchParams]);

  useEffect(() => {
    if (status !== "signedIn" || redeemedOnce.current) return;
    redeemedOnce.current = true;

    redeemStoredInvite().then((result) => {
      if (result.status === "error") {
        setError(result.message);
        redeemedOnce.current = false; // allow retry on the next sign-in
        return;
      }
      if (result.status === "redeemed") refresh();
      router.replace("/my-photos");
    });
  }, [status, router, refresh]);

  if (!photoApiBaseUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 text-center text-sm text-muted">
        API is not configured — set NEXT_PUBLIC_PHOTO_API_URL in .env.local.
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      if (step === "signIn") {
        await signIn({ username: email, password });
      } else if (step === "signUp") {
        const { nextStep } = await signUp({
          username: email,
          password,
          options: {
            userAttributes: { email, given_name: givenName, family_name: familyName },
          },
        });
        if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
          setStep("confirm");
          setNotice("Check your email for a confirmation code.");
        } else {
          await signIn({ username: email, password });
        }
      } else if (step === "confirm") {
        const { nextStep } = await confirmSignUp({
          username: email,
          confirmationCode: code,
        });
        if (nextStep.signUpStep === "DONE") {
          await signIn({ username: email, password });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
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
      <div className="absolute inset-0 bg-black/75" />

      <div className="relative z-10 w-full max-w-sm">
        <h1 className="font-serif text-2xl italic text-white">
          Private client access
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {step === "signIn" && "Sign in to view your private gallery."}
          {step === "signUp" && "Create an account to continue."}
          {step === "confirm" && "Enter the code we emailed you."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {step !== "confirm" && (
            <>
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={step === "signIn" ? "current-password" : "new-password"}
              />
              {step === "signUp" && (
                <>
                  <Field label="First name" value={givenName} onChange={setGivenName} />
                  <Field label="Last name" value={familyName} onChange={setFamilyName} />
                </>
              )}
            </>
          )}

          {step === "confirm" && (
            <Field label="Confirmation code" value={code} onChange={setCode} />
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {notice && <p className="text-sm text-white/70">{notice}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-white py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "Please wait…"
              : step === "signIn"
                ? "Sign in"
                : step === "signUp"
                  ? "Create account"
                  : "Confirm"}
          </button>
        </form>

        {step !== "confirm" && (
          <button
            onClick={() => {
              setStep(step === "signIn" ? "signUp" : "signIn");
              setError(null);
              setNotice(null);
            }}
            className="mt-6 w-full text-center text-xs uppercase tracking-wide text-white/60 hover:text-white"
          >
            {step === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wide text-white/50">
        {label}
      </span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/50"
      />
    </label>
  );
}
