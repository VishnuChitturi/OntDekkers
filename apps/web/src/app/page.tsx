import Link from "next/link";

/**
 * Root page — Phase 1 RC navigation hub.
 *
 * Provides direct links to every implemented feature area so that all
 * services can be tested without a final homepage design.
 * This is NOT the final UI. It will be replaced in a later sprint.
 */
export default function RootPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">OntDekker — Phase 1 RC</h1>

      <nav className="flex flex-col gap-3 w-full max-w-xs">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Authentication</p>
        <Link href="/login" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Login</Link>
        <Link href="/register" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Register</Link>
        <Link href="/forgot-password" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Forgot Password</Link>

        <p className="text-sm text-gray-500 uppercase tracking-widest mt-4 mb-1">User Profiles</p>
        <Link href="/profile" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">My Profile</Link>

        <p className="text-sm text-gray-500 uppercase tracking-widest mt-4 mb-1">Guides & Expeditions</p>
        <Link href="/guides" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Guides Directory</Link>
        <Link href="/my-guides" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">My Guides</Link>
        <Link href="/my-trips" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">My Trips / Expeditions</Link>
      </nav>
    </main>
  );
}
