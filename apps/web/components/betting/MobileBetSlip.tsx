'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { formatChips } from '@/lib/utils/format'

interface MobileBetSlipProps {
  matchId: string
  selection: 'PLAYER_1' | 'PLAYER_2'
  playerName: string
  odds: number // American odds
  onPlaceBet: (amount: number) => Promise<void>
  onClose: () => void
  userBalance: number
}

export function MobileBetSlip({
  playerName,
  odds,
  onPlaceBet,
  onClose,
  userBalance,
}: MobileBetSlipProps) {
  const [amount, setAmount] = useState<number>(10)
  const [isPlacing, setIsPlacing] = useState(false)

  const quickAmounts = [5, 10, 25, 50, 100]

  // Calculate potential payout using American odds
  const calculatePayout = (betAmount: number, americanOdds: number): number => {
    if (americanOdds > 0) {
      // Underdog: (bet * odds) / 100 + bet
      return betAmount + (betAmount * americanOdds) / 100
    } else {
      // Favorite: (bet / |odds|) * 100 + bet
      return betAmount + (betAmount / Math.abs(americanOdds)) * 100
    }
  }

  const potentialPayout = calculatePayout(amount, odds)
  const potentialProfit = potentialPayout - amount

  const handlePlaceBet = async () => {
    if (amount < 1) {
      toast.error('Minimum bet is 1 chip')
      return
    }

    if (amount > userBalance) {
      toast.error('Insufficient balance')
      return
    }

    setIsPlacing(true)
    try {
      await onPlaceBet(amount)
      toast.success('Bet placed successfully!')
      onClose()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to place bet'
      toast.error(message)
    } finally {
      setIsPlacing(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet / Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center bg-white md:bg-transparent z-50 animate-slide-up md:animate-fade-in">
        <div
          className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl p-6 w-full md:w-[90%] lg:w-[60%] xl:w-[50%] max-h-[85vh] md:max-h-[90vh] overflow-y-auto md:animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Handle Bar - Mobile Only */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4 md:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl leading-none touch-manipulation"
          aria-label="Close"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold mb-4 text-slate-900">Place Your Bet</h3>

        {/* Selected Player and Odds Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
          <div className="text-sm text-slate-600 mb-1">Betting on</div>
          <div className="text-lg font-bold text-slate-900 mb-2">{playerName}</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-blue-600">
              {odds > 0 ? '+' : ''}
              {odds}
            </div>
            <div className="text-sm text-slate-600">American Odds</div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-600">Your Balance</div>
          <div className="text-lg font-semibold text-slate-900">
            {formatChips(userBalance)} chips
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Bet Amount
          </label>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {quickAmounts.map((quick) => (
              <button
                key={quick}
                onClick={() => setAmount(quick)}
                disabled={quick > userBalance}
                className={`
                  py-3 px-3 rounded-lg border-2 font-medium transition-all touch-manipulation
                  ${
                    amount === quick
                      ? 'border-blue-500 bg-blue-50 text-blue-700 scale-105'
                      : quick > userBalance
                      ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'border-slate-300 hover:border-slate-400 active:scale-95'
                  }
                `}
              >
                {quick}
              </button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              min={1}
              max={userBalance}
              className="w-full pl-4 pr-4 py-4 border-2 border-slate-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none touch-manipulation"
              placeholder="Enter amount"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              chips
            </span>
          </div>
        </div>

        {/* Payout Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Potential Payout</span>
            <span className="text-2xl font-bold text-green-700">
              {formatChips(potentialPayout)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Potential Profit</span>
            <span className="text-lg font-semibold text-emerald-600">
              +{formatChips(potentialProfit)}
            </span>
          </div>
        </div>

        {/* Place Bet Button */}
        <button
          onClick={handlePlaceBet}
          disabled={isPlacing || amount < 1 || amount > userBalance}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-5 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg touch-manipulation active:scale-95"
        >
          {isPlacing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Placing Bet...
            </span>
          ) : (
            `Place Bet - ${formatChips(amount)}`
          )}
        </button>

        {/* Helper Text */}
        <p className="text-xs text-slate-500 text-center mt-3">
          Odds are locked at the time of bet placement
        </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .touch-manipulation {
          touch-action: manipulation;
        }

        .active\\:scale-95:active {
          transform: scale(0.95);
        }

        .active\\:scale-98:active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  )
}
