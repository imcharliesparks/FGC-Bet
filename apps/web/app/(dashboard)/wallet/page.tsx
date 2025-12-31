import { requireAuth } from '@/lib/auth/helpers'
import { WalletService } from '@/lib/wallet/service'
import { formatChips, formatRelativeTime } from '@/lib/utils/format'
import { TransactionType, type Transaction } from '@repo/database'
import { revalidatePath } from 'next/cache'

async function addCredits(formData: FormData) {
  'use server'

  const user = await requireAuth()
  const amount = Number(formData.get('amount'))
  const note = (formData.get('note') as string | null)?.toString().slice(0, 120) || 'Manual top-up'

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount')
  }

  await WalletService.addChips(
    user.id,
    amount,
    TransactionType.ADMIN_ADJUSTMENT,
    `${note} (+${amount} chips)`
  )

  revalidatePath('/wallet')
}

export default async function WalletPage() {
  const user = await requireAuth()
  const [balance, transactions]: [number, Transaction[]] = await Promise.all([
    WalletService.getBalance(user.id),
    WalletService.getTransactions(user.id, 20),
  ])

  const quickAmounts = [100, 250, 500, 1000, 5000]

  return (
    <div className="space-y-8 text-zinc-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Wallet</h1>
          <p className="mt-2 text-zinc-400">
            View your chip balance, recent activity, and add more credits (stubbed top-up).
          </p>
        </div>
        <div className="rounded-lg border border-amber-300/40 bg-amber-900/30 px-4 py-3 shadow-lg shadow-black/20">
          <div className="text-xs font-medium uppercase tracking-wide text-amber-200">Current Balance</div>
          <div className="text-3xl font-bold text-amber-100">
            {formatChips(balance)} chips
          </div>
        </div>
      </div>

      {/* Add Credits */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/20">
        <h2 className="text-xl font-semibold text-white">Add Credits (stub)</h2>
        <p className="mt-2 text-sm text-zinc-400">
          This simulates a successful top-up without payment verification. Enter an amount and your balance will increase instantly.
        </p>

        <form action={addCredits} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-200">Amount (chips)</label>
            <div className="mt-2 grid grid-cols-5 gap-2 sm:max-w-xl">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="submit"
                  name="amount"
                  value={amt}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:border-indigo-300/60 hover:text-white"
                >
                  +{formatChips(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:max-w-xs">
            <label className="text-sm font-medium text-zinc-200" htmlFor="custom-amount">
              Custom amount
            </label>
            <input
              id="custom-amount"
              name="amount"
              type="number"
              min={1}
              step={1}
              placeholder="Enter chips"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none ring-2 ring-transparent transition focus:border-indigo-400 focus:ring-indigo-400/30"
            />
          </div>

          <div className="sm:max-w-md">
            <label className="text-sm font-medium text-zinc-200" htmlFor="note">
              Note (optional)
            </label>
            <input
              id="note"
              name="note"
              type="text"
              maxLength={120}
              placeholder="e.g. Test top-up"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none ring-2 ring-transparent transition focus:border-indigo-400 focus:ring-indigo-400/30"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Add Credits
            </button>
            <span className="self-center text-xs text-zinc-400">
              Stubbed: instantly adjusts your chip balance.
            </span>
          </div>
        </form>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/20">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          <p className="text-sm text-zinc-400">Last 20 transactions</p>
        </div>
        <div className="divide-y divide-zinc-800">
          {transactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-zinc-400">No transactions yet</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {tx.description || tx.type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatRelativeTime(tx.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-semibold ${
                      Number(tx.amount) > 0 ? 'text-emerald-300' : 'text-red-300'
                    }`}
                  >
                    {Number(tx.amount) > 0 ? '+' : '-'}
                    {formatChips(Math.abs(Number(tx.amount)))} chips
                  </div>
                  <div className="text-xs text-zinc-500">
                    Balance: {formatChips(Number(tx.balanceAfter))} chips
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
