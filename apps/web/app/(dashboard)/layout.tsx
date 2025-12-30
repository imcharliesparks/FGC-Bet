import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { getCurrentUser } from '@/lib/auth/helpers'
import { formatChips } from '@/lib/utils/format'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-slate-900">
                FGC Bet
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/matches"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Matches
                </Link>
                <Link
                  href="/bets"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  My Bets
                </Link>
                <Link
                  href="/wallet"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Wallet
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Chip Balance */}
              {user && (
                <div className="flex items-center space-x-2 bg-amber-100 px-4 py-2 rounded-lg">
                  <span className="text-2xl">🪙</span>
                  <div className="text-right">
                    <div className="text-xs text-amber-800 font-medium">Balance</div>
                    <div className="text-sm font-bold text-amber-900">
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
        <div className="sm:hidden border-t border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            >
              Dashboard
            </Link>
            <Link
              href="/matches"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            >
              Matches
            </Link>
            <Link
              href="/bets"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            >
              My Bets
            </Link>
            <Link
              href="/wallet"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
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
    </div>
  )
}
