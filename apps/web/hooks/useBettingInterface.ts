import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { api } from '@/lib/trpc/react'
import { useMatchOdds } from './useMatchOdds'

export function useBettingInterface(matchId: string) {
  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<
    'PLAYER_1' | 'PLAYER_2' | null
  >(null)

  const { data: match } = api.matches.byId.useQuery({ id: matchId })
  const { odds, isLoading: oddsLoading } = useMatchOdds(matchId)
  const { data: wallet } = api.wallet.balance.useQuery()
  const utils = api.useUtils()
  const placeBet = api.bets.place.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      utils.matches.invalidate()
      utils.bets.invalidate()
      utils.wallet.invalidate()
    },
  })

  const openBetSlip = (player: 'PLAYER_1' | 'PLAYER_2') => {
    if (!match?.bettingOpen) {
      toast.error('Betting is closed for this match')
      return
    }
    setSelectedPlayer(player)
    setBetSlipOpen(true)
  }

  const handlePlaceBet = async (amount: number) => {
    if (!selectedPlayer) return

    await placeBet.mutateAsync({
      matchId,
      betType: 'MONEYLINE',
      selection: selectedPlayer,
      amount,
    })
  }

  const closeBetSlip = () => {
    setBetSlipOpen(false)
    setSelectedPlayer(null)
  }

  const selectedPlayerName =
    selectedPlayer === 'PLAYER_1'
      ? match?.player1.gamerTag
      : match?.player2.gamerTag

  const selectedPlayerOdds =
    selectedPlayer === 'PLAYER_1' ? odds?.player1Odds : odds?.player2Odds

  return {
    betSlipOpen,
    selectedPlayer,
    selectedPlayerName,
    selectedPlayerOdds,
    userBalance: wallet?.balance ?? 0,
    match,
    odds,
    oddsLoading,
    openBetSlip,
    handlePlaceBet,
    closeBetSlip,
    canBet: match?.bettingOpen && !oddsLoading && odds,
  }
}
