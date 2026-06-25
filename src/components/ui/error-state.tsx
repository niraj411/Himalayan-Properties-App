import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

// Shown when a client-side fetch fails, so failures read as "couldn't load,
// retry" instead of masquerading as an empty state.
export function ErrorState({
  message = "Something went wrong while loading this page.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="font-semibold text-on-surface">Couldn&apos;t load</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
