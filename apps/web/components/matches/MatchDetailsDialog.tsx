'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { formatGameName, formatRelativeTime } from '@/lib/utils/format'

type Player = {
  gamerTag: string
  country?: string | null
  eloRating?: number | null
  startGgId?: string | null
}

type Tournament = {
  name: string
  slug?: string | null
  location?: string | null
}

type MatchDetails = {
  id: string
  startGgId?: string | null
  round?: string | null
  bestOf?: number | null
  status: string
  game: string
  bettingOpen: boolean
  scheduledStart: Date | string
  actualStart?: Date | string | null
  completedAt?: Date | string | null
  streamUrl?: string | null
  vodUrl?: string | null
  player1: Player
  player2: Player
  player1Score?: number | null
  player2Score?: number | null
  tournament: Tournament
  _count?: {
    bets?: number
  }
}

interface MatchDetailsDialogProps {
  match: MatchDetails
  trigger: React.ReactNode
}

export function MatchDetailsDialog({ match, trigger }: MatchDetailsDialogProps) {
  const statusBadge = (() => {
    switch (match.status) {
      case 'LIVE':
        return 'bg-red-500/15 text-red-700 border border-red-100'
      case 'COMPLETED':
        return 'bg-green-500/15 text-green-700 border border-green-100'
      case 'CANCELLED':
        return 'bg-zinc-500/15 text-zinc-700 border border-zinc-100'
      default:
        return 'bg-blue-500/15 text-blue-700 border border-blue-100'
    }
  })()

  const hasScores =
    match.player1Score !== null &&
    match.player2Score !== null &&
    match.player1Score !== undefined &&
    match.player2Score !== undefined

  const winner =
    hasScores && match.player1Score! > match.player2Score!
      ? 'player1'
      : hasScores && match.player2Score! > match.player1Score!
      ? 'player2'
      : null
  const scoreline =
    hasScores && match.bestOf
      ? `${match.player1Score}-${match.player2Score} (best of ${match.bestOf})`
      : hasScores
      ? `${match.player1Score}-${match.player2Score}`
      : null

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {formatGameName(match.game)}
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {match.player1.gamerTag} vs {match.player2.gamerTag}
              </div>
              <div className="text-sm text-slate-600">
                <Link
                  href={`/tournaments/${match.tournament?.id ?? ''}/matches`}
                  className="hover:underline hover:text-indigo-600"
                >
                  {match.tournament.name}
                </Link>
                {match.round ? ` • ${match.round}` : ''}
                {match.bestOf ? ` • Best of ${match.bestOf}` : ''}
              </div>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}
            >
              {match.status}
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Detailed match context pulled from start.gg import
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">
              Schedule
            </div>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>
                Scheduled:{' '}
                <span className="font-medium">
                  {formatRelativeTime(new Date(match.scheduledStart))}
                </span>
              </li>
              {match.actualStart && (
                <li>
                  Started:{' '}
                  <span className="font-medium">
                    {formatRelativeTime(new Date(match.actualStart))}
                  </span>
                </li>
              )}
              {match.completedAt && (
                <li>
                  Completed:{' '}
                  <span className="font-medium">
                    {formatRelativeTime(new Date(match.completedAt))}
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">
              Meta
            </div>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>
                Tournament:{' '}
                <span className="font-medium">{match.tournament.name}</span>
              </li>
              {match.tournament.location && (
                <li>
                  Location:{' '}
                  <span className="font-medium">{match.tournament.location}</span>
                </li>
              )}
              {match._count?.bets !== undefined && (
                <li>
                  Bets placed:{' '}
                  <span className="font-medium">{match._count.bets}</span>
                </li>
              )}
              <li>
                Betting:{' '}
                <span className="font-medium">
                  {match.bettingOpen ? 'Open' : 'Closed'}
                </span>
              </li>
              {match.startGgId && (
                <li>
                  Start.gg ID:{' '}
                  <span className="font-mono text-xs">{match.startGgId}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {hasScores && (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-xs font-semibold uppercase text-slate-500 mb-1">
              Result
            </div>
            <div className="flex items-center justify-between text-sm text-slate-800">
              <div className="font-semibold">
                Winner:{' '}
                {winner === 'player1'
                  ? match.player1.gamerTag
                  : winner === 'player2'
                  ? match.player2.gamerTag
                  : '—'}
              </div>
              {scoreline && <div className="text-slate-600">{scoreline}</div>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PlayerCard
            label="Player 1"
            player={match.player1}
            score={hasScores ? match.player1Score ?? undefined : undefined}
            highlight={hasScores && (match.player1Score ?? 0) > (match.player2Score ?? 0)}
            result={
              hasScores
                ? (match.player1Score ?? 0) > (match.player2Score ?? 0)
                  ? 'WIN'
                  : 'LOSS'
                : undefined
            }
          />
          <PlayerCard
            label="Player 2"
            player={match.player2}
            score={hasScores ? match.player2Score ?? undefined : undefined}
            highlight={hasScores && (match.player2Score ?? 0) > (match.player1Score ?? 0)}
            result={
              hasScores
                ? (match.player2Score ?? 0) > (match.player1Score ?? 0)
                  ? 'WIN'
                  : 'LOSS'
                : undefined
            }
          />
        </div>

        {(match.streamUrl || match.vodUrl) && (
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
              Links
            </div>
            <div className="flex flex-wrap gap-3">
              {match.streamUrl && (
                <a
                  href={match.streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-500 underline"
                >
                  Stream
                </a>
              )}
              {match.vodUrl && (
                <a
                  href={match.vodUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-500 underline"
                >
                  VOD
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface PlayerCardProps {
  label: string
  player: Player
  score?: number
  highlight?: boolean
  result?: 'WIN' | 'LOSS'
}

function PlayerCard({ label, player, score, highlight, result }: PlayerCardProps) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-slate-900">
        {player.gamerTag}
      </div>
      {score !== undefined && (
        <div className="text-sm font-semibold text-slate-700">Score: {score}</div>
      )}
      {result && (
        <div
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            result === 'WIN'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-zinc-200 text-zinc-700'
          }`}
        >
          {result === 'WIN' ? 'Winner' : 'Loser'}
        </div>
      )}
      <div className="mt-1 space-y-1 text-xs text-slate-600">
        {player.eloRating !== undefined && (
          <div>ELO: {player.eloRating ?? '—'}</div>
        )}
        {player.country && <div>Country: {player.country}</div>}
        {player.startGgId && (
          <div className="text-[11px] text-slate-500">
            Start.gg ID: <span className="font-mono">{player.startGgId}</span>
          </div>
        )}
      </div>
    </div>
  )
}
