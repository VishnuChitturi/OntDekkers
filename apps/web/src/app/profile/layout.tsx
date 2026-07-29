"use client";

/**
 * /profile — Authenticated Profile Layout
 *
 * Minimal authenticated shell for the profile section.
 * Wraps all /profile/* routes with ProtectedRoute so:
 *   - Session restoration loading does not cause false redirects.
 *   - Unauthenticated users are redirected to /login with return path preserved.
 *
 * Provides a lightweight top bar with the brand mark and LogoutButton.
 * The full application navigation shell belongs to a future checkpoint.
 */

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {/* Minimal authenticated top bar */}
      <div className="min-h-screen bg-[#FBF9F4]">
        <header className="sticky top-0 z-10 border-b border-[#EAE7DF] bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <span className="text-base font-bold tracking-tight text-[#111111]">
              OntDekker
            </span>
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
