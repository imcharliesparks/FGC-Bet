import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50 px-6">
      <div className="w-full max-w-xl space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/40">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-indigo-200">404</p>
          <h1 className="text-3xl font-bold text-white">Page not found</h1>
          <p className="text-zinc-400">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Go home
          </Link>
          <Link
            href="/matches"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-indigo-300/50 hover:bg-indigo-500/10"
          >
            View matches
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200">Need help?</p>
          <p className="mt-1">
            Double-check the URL or use the navigation to find what you need.
          </p>
        </div>
      </div>
    </div>
  )
}
