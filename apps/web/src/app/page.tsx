/**
 * OntDekker — root page entry point.
 *
 * The full application shell (Navbar + Sidebar + virtual router) is
 * assembled in Checkpoint 23. For now this stub confirms the scaffold
 * builds and renders correctly.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          OntDekker
        </h1>
        <p className="text-sm text-charcoal font-mono uppercase tracking-wider">
          Discover the world, slowly.
        </p>
        <p className="text-xs text-muted-slate font-mono">
          Frontend scaffold — Checkpoint 21 ✓
        </p>
      </div>
    </main>
  );
}
