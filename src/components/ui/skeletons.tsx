import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Reusable loading shells so data pages show structure-shaped placeholders
// instead of a single full-page spinner.

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  const rowKeys = Array.from({ length: rows }, (_, i) => `r${i}`);
  const colKeys = Array.from({ length: cols }, (_, i) => `c${i}`);
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="divide-y divide-outline-variant/10">
          {rowKeys.map((rk) => (
            <div key={rk} className="flex items-center gap-4 px-5 py-4">
              {colKeys.map((ck, c) => (
                <Skeleton key={ck} className={`h-4 ${c === 0 ? "w-40" : "flex-1"}`} />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  const keys = Array.from({ length: count }, (_, i) => `s${i}`);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {keys.map((k) => (
        <Card key={k} className="border-0 shadow-sm">
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  const keys = Array.from({ length: count }, (_, i) => `l${i}`);
  return (
    <div className="space-y-3">
      {keys.map((k) => (
        <Card key={k} className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
