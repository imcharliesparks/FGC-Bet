import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { requireAdmin } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
  } catch (error) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Navigation */}
      <nav className="bg-zinc-900/80 border-b border-zinc-800 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <Link href="/admin" className="text-2xl font-bold text-white">
                FGC Bet Admin
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <Link
                  href="/admin/matches"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-300 hover:text-white"
                >
                  Matches
                </Link>
                <Link
                  href="/admin/tournaments"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-300 hover:text-white"
                >
                  Tournaments
                </Link>
                <Link
                  href="/admin/players"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-zinc-300 hover:text-white"
                >
                  Players
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-zinc-300 hover:text-white"
              >
                Back to Site
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
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
