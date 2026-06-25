"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Receipt, CreditCard } from "lucide-react";
import { chargeRemaining } from "@/lib/ledger";

interface Charge {
  id: string;
  kind: string;
  label: string;
  amount: number;
  amountPaid: number;
  dueDate: string | null;
  status: string;
  paidDate: string | null;
}

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

export default function TenantBalancePage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/charges?scope=tenant");
        if (res.ok) {
          const data = await res.json();
          setCharges(data.charges ?? []);
          setBalance(data.balance ?? 0);
        } else {
          toast.error("Failed to load your balance");
        }
      } catch {
        toast.error("Failed to load your balance");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const open = charges.filter((c) => c.status === "OPEN");
  const settled = charges.filter((c) => c.status !== "OPEN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Balance</h1>
        <p className="text-muted-foreground mt-1">Your current charges and account balance.</p>
      </div>

      {/* Balance hero */}
      {balance > 0 ? (
        <Card className="border-0 bg-gradient-to-br from-primary to-primary-container text-white shadow-ambient">
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/80">Amount due</p>
              <p className="text-3xl font-bold">{money(balance)}</p>
            </div>
            <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
              <Link href="/dashboard/payments"><CreditCard className="h-4 w-4" /> Pay now</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-on-surface">You&apos;re all caught up</p>
              <p className="text-sm text-muted-foreground">No outstanding charges on your account.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {open.length > 0 && (
        <ChargeTable title="Open charges" rows={open} />
      )}
      {settled.length > 0 && (
        <ChargeTable title="History" rows={settled} muted />
      )}

      {charges.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="mb-3 h-12 w-12 text-surface-container-highest" />
            <p className="text-muted-foreground">No charges on your account.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChargeTable({ title, rows, muted }: { title: string; rows: Charge[]; muted?: boolean }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <Card className="border-0 shadow-sm">
        <CardContent className="divide-y divide-outline-variant/10 p-0">
          {rows.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <p className={`truncate font-medium ${muted ? "text-muted-foreground" : "text-on-surface"}`}>{c.label}</p>
                <p className="text-xs text-muted-foreground">
                  {c.kind.replace(/_/g, " ").toLowerCase()}
                  {c.status === "OPEN" && c.dueDate ? ` · due ${fmtDate(c.dueDate)}` : ""}
                  {c.status === "PAID" && c.paidDate ? ` · paid ${fmtDate(c.paidDate)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className={`font-semibold ${muted ? "text-muted-foreground" : "text-on-surface"}`}>
                    {money(c.status === "OPEN" ? chargeRemaining(c) : c.amount)}
                  </span>
                  {c.status === "OPEN" && c.amountPaid > 0 && c.amountPaid < c.amount ? (
                    <p className="text-xs text-muted-foreground">{money(c.amountPaid)} paid of {money(c.amount)}</p>
                  ) : null}
                </div>
                <StatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PAID") return <Badge className="bg-emerald-600">Paid</Badge>;
  if (status === "WAIVED") return <Badge variant="secondary">Waived</Badge>;
  return <Badge className="bg-amber-600">Open</Badge>;
}
