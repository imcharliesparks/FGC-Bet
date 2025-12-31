"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";

const featureLinks = [
  { href: "/dashboard", title: "Dashboard", description: "Your balance, active bets, and upcoming matches." },
  { href: "/matches", title: "Matches", description: "Browse matches, view odds, and place bets." },
  { href: "/bets", title: "My Bets", description: "Track active, settled, and cancelled wagers." },
  { href: "/api/bets", title: "Bets API", description: "Programmatic access to bet placement and details." },
  { href: "/api/wallet", title: "Wallet API", description: "Check balances and transactions." },
  { href: "/admin/matches", title: "Admin: Matches", description: "Create, edit, and manage matches." },
  { href: "/admin/tournaments", title: "Admin: Tournaments", description: "Import tournaments and view start.gg data." },
  { href: "/admin", title: "Admin Overview", description: "Entry point for all admin tools." },
];

export default function Home() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              FGC Bet
            </Link>
            <nav className="hidden gap-6 text-sm font-medium text-zinc-300 sm:flex">
              <Link href="/matches" className="hover:text-white">
                Matches
              </Link>
              <Link href="/tournaments" className="hover:text-white">
                Tournaments
              </Link>
              <Link href="/bets" className="hover:text-white">
                My Bets
              </Link>
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:text-white">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <SignedIn>
              <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-zinc-800">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-8 shadow-lg">
            <p className="text-sm font-semibold text-indigo-300">FGC Betting Platform</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl">
              Bet on fighting game esports with real-time odds and live updates.
            </h1>
            <p className="mt-4 text-base text-zinc-300">
              Manage your wallet, place bets, monitor live matches, and run admin operations — all in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/matches"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
              >
                View matches
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-zinc-800"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Quick stats</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              <li>Real-time updates via SSE</li>
              <li>ELO-based odds with house edge</li>
              <li>Wallet with chip balance and transactions</li>
              <li>Admin tools for matches and tournaments</li>
            </ul>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Explore features</h2>
            <span className="text-sm text-zinc-400">Jump into any area of the app</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:-translate-y-1 hover:border-white/50 hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{link.title}</h3>
                  <span className="text-xs text-zinc-500 group-hover:text-indigo-300">Open</span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
