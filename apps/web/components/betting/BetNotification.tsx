'use client'

import { useEffect } from 'react'
import { useUserBetUpdates } from '@/hooks/useUserBetUpdates'
import { useUser } from '@clerk/nextjs'
import { toast } from 'react-hot-toast'
import { formatChips } from '@/lib/utils/format'

export function BetNotification() {
  const { user } = useUser()
  const { betPlaced } = useUserBetUpdates(user?.id)

  useEffect(() => {
    if (betPlaced) {
      toast.success(
        <div>
          <div className="font-semibold">Bet Placed Successfully!</div>
          <div className="text-sm mt-1">
            {formatChips(betPlaced.amount)} chips at odds {betPlaced.odds > 0 ? '+' : ''}
            {betPlaced.odds}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Potential payout: {formatChips(betPlaced.potentialPayout)} chips
          </div>
        </div>,
        {
          duration: 5000,
          icon: '🎰',
        }
      )
    }
  }, [betPlaced])

  return null // This component only shows notifications
}
