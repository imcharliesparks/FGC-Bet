import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { getCurrentUser, isAdmin } from '@/lib/auth/helpers'
import { formatChips } from '@/lib/utils/format'
import { BetNotification } from '@/components/betting/BetNotification'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const admin = await isAdmin()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Navigation */}
      <nav className="bg-zinc-900/80 border-b border-zinc-800 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-white">
                FGC Bet
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-300 hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  href="/matches"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-300 hover:text-white"
                >
                  Matches
                </Link>
                <Link
                  href="/bets"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-300 hover:text-white"
                >
                  My Bets
                </Link>
                <Link
                  href="/wallet"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-300 hover:text-white"
                >
                  Wallet
                </Link>
                <Link
                  href="/tournaments"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-300 hover:text-white"
                >
                  Tournaments
                </Link>
                {admin && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-300 hover:text-white"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Chip Balance */}
              {user && (
                <div className="flex items-center space-x-2 rounded-lg border border-amber-300/40 bg-amber-900/30 px-4 py-2">
                  <span className="text-2xl">💰</span>
                  <div className="text-right">
                    <div className="text-xs text-amber-200 font-medium">Balance</div>
                    <div className="text-sm font-bold text-amber-100">
                      {formatChips(Number(user.chipBalance))}
                    </div>
                  </div>
                </div>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden border-t border-zinc-800 bg-zinc-900/80 backdrop-blur">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/80"
            >
              Dashboard
            </Link>
            <Link
              href="/matches"
              className="block px-3 py-2 rounded-md text-base font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/80"
            >
              Matches
            </Link>
            <Link
              href="/bets"
              className="block px-3 py-2 rounded-md text-base font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/80"
            >
              My Bets
            </Link>
            <Link
              href="/wallet"
              className="block px-3 py-2 rounded-md text-base font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/80"
            >
              Wallet
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Real-time Notifications */}
      <BetNotification />
    </div>
  )
}
