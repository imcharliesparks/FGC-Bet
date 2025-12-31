'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export function ImportTournamentForm() {
  const [slug, setSlug] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!slug.trim()) {
      toast.error('Please enter a tournament slug')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/import/startgg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentSlug: slug.trim(),
        }),
      })

      const data = (await response.json()) as {
        error?: string
        tournament?: { name: string }
        matchesImported?: number
      }

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      toast.success(
        `Successfully imported "${data.tournament?.name}" with ${data.matchesImported} matches!`
      )
      setSlug('')

      // Refresh the page to show new tournament
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import tournament')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-2">
          Tournament Slug
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
            placeholder="tournament/event-name/event/event-slug"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importing...' : 'Import'}
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Example: tournament/evo-2024/event/street-fighter-6
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Find the slug in the tournament URL on start.gg
        </p>
      </div>
    </form>
  )
}
