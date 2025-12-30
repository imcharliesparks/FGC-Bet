export function MatchSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      {/* Header */}
      <div className="flex justify-between mb-3">
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="h-4 w-12 bg-slate-200 rounded" />
      </div>

      {/* Players */}
      <div className="space-y-3">
        {/* Player 1 */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-200 rounded" />
          </div>
        </div>

        {/* VS divider */}
        <div className="flex justify-center py-1">
          <div className="h-3 w-8 bg-slate-200 rounded" />
        </div>

        {/* Player 2 */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-200 rounded" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex justify-between">
          <div className="h-3 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export function MatchSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MatchSkeleton key={i} />
      ))}
    </div>
  )
}
