"use client";

/**
 * /verify-email — Email Verification Screen
 *
 * Backend contract: GET /auth/verify-email?token=<token>
 *
 * The verification token is delivered in the URL as a `token` query parameter.
 * This page calls verifyEmail(token) immediately on mount and shows the result.
 *
 * States:
 *   - loading  : verification request in progress
 *   - success  : email verified — show confirmation + link to sign in
 *   - error    : invalid/expired token — show message + link to sign in
 *   - no-token : URL is missing the token parameter
 *
 * useSearchParams() is isolated in a child component wrapped in Suspense,
 * as required by Next.js App Router for static page generation.
 *
 * Tokens are never logged.
 */

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { verifyEmail } from "@/services/auth";
import { ApiError } from "@/services/api";

type VerifyState = "loading" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>(
    token ? "loading" : "no-token"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    // Guard: only call once (React StrictMode double-mount)
    if (!token || called.current) return;
    called.current = true;

    verifyEmail(token)
      .then(() => setState("success"))
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("Verification failed. Please try again.");
        }
        setState("error");
      });
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
        <p className="sr-only">Verifying email…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <CheckCircle className="size-10 text-[#0F5132]" aria-hidden />
        <p className="text-sm leading-relaxed text-gray-500">
          Your email has been confirmed. Your account is now active.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-[#111111] underline-offset-4 hover:underline"
        >
          Sign in to OntDekker
        </Link>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <AlertTriangle className="size-10 text-[#F59E0B]" aria-hidden />
        {errorMessage && (
          <p className="text-sm leading-relaxed text-gray-500">
            {errorMessage}
          </p>
        )}
        <p className="text-sm text-gray-400">
          The link may have expired or already been used.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-[#111111] underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  // no-token
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <AlertTriangle className="size-10 text-[#F59E0B]" aria-hidden />
      <p className="text-sm leading-relaxed text-gray-500">
        Please use the link from your verification email.
      </p>
      <Link
        href="/login"
        className="text-sm font-medium text-[#111111] underline-offset-4 hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Verify your email" description="Confirming your address…">
      <Suspense
        fallback={
          <div className="flex justify-center py-4">
            <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </AuthCard>
  );
}
