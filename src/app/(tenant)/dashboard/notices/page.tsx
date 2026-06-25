"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { CardListSkeleton } from "@/components/ui/skeletons";

interface Notice {
  id: string;
  type: string;
  subject: string;
  body: string;
  amountDue: number | null;
  sentAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  LATE: "Past-due notice",
  DEMAND: "Demand for payment",
  CO_DEMAND: "Compliance / possession",
  CUSTOM: "Notice",
};
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function TenantNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/notices?scope=tenant");
      if (!res.ok) throw new Error();
      setNotices(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Notices</h1>
          <p className="text-muted-foreground mt-1">Official letters from property management.</p>
        </div>
        <CardListSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Notices</h1>
          <p className="text-muted-foreground mt-1">Official letters from property management.</p>
        </div>
        <ErrorState message="We couldn't load this page." onRetry={load} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Notices</h1>
        <p className="text-muted-foreground mt-1">Official letters from property management.</p>
      </div>

      {notices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="mb-3 h-12 w-12 text-surface-container-highest" />
            <p className="text-muted-foreground">No notices. Nothing needs your attention right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => {
            const open = openId === n.id;
            return (
              <Card key={n.id} className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : n.id)}
                    aria-expanded={open}
                    aria-controls={`notice-panel-${n.id}`}
                    className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{TYPE_LABEL[n.type] ?? n.type}</Badge>
                        <span className="text-xs text-muted-foreground">{fmtDate(n.sentAt)}</span>
                      </div>
                      <p className="mt-1 truncate font-medium text-on-surface">{n.subject}</p>
                    </div>
                    {n.amountDue != null && (
                      <span className="shrink-0 font-semibold text-primary">
                        {n.amountDue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </span>
                    )}
                  </button>
                  {open && (
                    <pre id={`notice-panel-${n.id}`} role="region" className="mx-5 mb-5 whitespace-pre-wrap rounded-xl bg-surface-container-low p-4 font-sans text-sm text-on-surface">
                      {n.body}
                    </pre>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
