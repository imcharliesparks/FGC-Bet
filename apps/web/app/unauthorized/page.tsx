import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50 px-6">
      <div className="w-full max-w-xl space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/40">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-indigo-200">Access restricted</p>
          <h1 className="text-3xl font-bold text-white">Please sign in</h1>
          <p className="text-zinc-400">
            You need to be authenticated to view this page. Sign in to continue, or create an account if you don&apos;t have one yet.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <SignInButton mode="modal">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-lg border border-indigo-300/50 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-200 hover:bg-indigo-500/10">
              Create account
            </button>
          </SignUpButton>
          <Link
            href="/"
            className="ml-auto text-sm font-medium text-zinc-300 underline-offset-4 hover:text-white hover:underline"
          >
            Back to home
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200">Why am I seeing this?</p>
          <p className="mt-1">
            This page is protected. After you sign in, you&apos;ll be redirected back to your destination.
          </p>
        </div>
      </div>
    </div>
  )
}
