export function BetSkeleton() {
  return (
    <div className="border border-slate-200 rounded-lg p-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-5 w-24 bg-slate-200 rounded ml-auto" />
          <div className="h-4 w-20 bg-slate-200 rounded ml-auto" />
          <div className="h-4 w-28 bg-slate-200 rounded ml-auto" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
      </div>
    </div>
  )
}

export function BetSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <BetSkeleton key={i} />
      ))}
    </div>
  )
}
