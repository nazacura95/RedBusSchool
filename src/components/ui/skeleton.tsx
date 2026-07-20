export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-200 ${className}`} />;
}

export function TableRowsSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-32" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DrawerSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando…">
      <div>
        <Skeleton className="mb-3 h-3 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-3 w-20" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
