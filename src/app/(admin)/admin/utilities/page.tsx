import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plug, Receipt, AlertTriangle } from "lucide-react";
import {
  utilityTypeLabel,
  billStatus,
  BILL_STATUS_LABELS,
  formatBillPeriod,
  formatBillDate,
  usageSummary,
  type BillStatus,
} from "@/lib/utilities";

// Admin-only portfolio view of utility bills across every property. Tenants
// never see this page or its data (route group is admin-gated, and bills have
// no tenant-scoped API).

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const STATUS_CLASS: Record<BillStatus, string> = {
  PAID: "bg-green-50 text-green-700 border-green-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  DUE_SOON: "bg-amber-50 text-amber-700 border-amber-200",
  DUE: "bg-surface-container-high text-on-surface border-transparent",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function getData() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const twelveAgo = new Date(Date.UTC(year - 1, now.getUTCMonth(), now.getUTCDate()));

  const properties = await db.property.findMany({
    orderBy: { name: "asc" },
    include: {
      units: { select: { id: true, unitNumber: true } },
      utilities: {
        orderBy: [{ sortOrder: "asc" }, { type: "asc" }],
        include: {
          bills: { orderBy: { periodEnd: "desc" } },
        },
      },
    },
  });

  type Bill = (typeof properties)[number]["utilities"][number]["bills"][number];

  const openBills: (Bill & { propertyName: string; propertyId: string; utilityType: string; providerName: string })[] = [];
  const monthly: Record<string, number[]> = {}; // propertyId -> 12 month totals for `year`
  let portfolioYtd = 0;
  let portfolioTrailing = 0;

  const rows = properties.map((p) => {
    monthly[p.id] = Array(12).fill(0);
    let ytd = 0;
    let trailing = 0;
    const utilities = p.utilities.map((u) => {
      const last = u.bills[0] ?? null;
      const trailingBills = u.bills.filter((b) => b.periodEnd >= twelveAgo);
      const trailingTotal = trailingBills.reduce((s, b) => s + b.amount, 0);
      for (const b of u.bills) {
        if (b.periodEnd.getUTCFullYear() === year) {
          ytd += b.amount;
          monthly[p.id][b.periodEnd.getUTCMonth()] += b.amount;
        }
        if (b.periodEnd >= twelveAgo) trailing += b.amount;
        if (!b.paidAt) {
          openBills.push({
            ...b,
            propertyName: p.name,
            propertyId: p.id,
            utilityType: u.type,
            providerName: u.providerName,
          });
        }
      }
      return {
        id: u.id,
        type: u.type,
        providerName: u.providerName,
        accountNumber: u.accountNumber,
        unitNumber: u.unitId ? p.units.find((x) => x.id === u.unitId)?.unitNumber ?? null : null,
        billCount: u.bills.length,
        last,
        trailingTotal,
        trailingAvg: trailingBills.length ? trailingTotal / trailingBills.length : null,
      };
    });
    portfolioYtd += ytd;
    portfolioTrailing += trailing;
    return { id: p.id, name: p.name, type: p.type, utilities, ytd, trailing };
  });

  openBills.sort((a, b) => {
    const ad = a.dueDate?.getTime() ?? Infinity;
    const bd = b.dueDate?.getTime() ?? Infinity;
    return ad - bd;
  });

  const activeMonths = MONTHS.map((_, i) => i).filter((i) => rows.some((r) => monthly[r.id][i] !== 0));

  return { rows, openBills, monthly, activeMonths, year, portfolioYtd, portfolioTrailing };
}

export default async function UtilitiesOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { rows, openBills, monthly, activeMonths, year, portfolioYtd, portfolioTrailing } = await getData();
  const openTotal = openBills.reduce((s, b) => s + b.amount, 0);
  const anyBills = rows.some((r) => r.utilities.some((u) => u.billCount > 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Utilities</h1>
        <p className="text-slate-500 mt-1">
          Owner-paid utility bills across the portfolio. Admin only, never shown to tenants.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label={`${year} to date`} value={money(portfolioYtd)} />
        <Stat label="Last 12 months" value={money(portfolioTrailing)} />
        <Stat
          label="Open bills"
          value={openBills.length === 0 ? "None" : `${openBills.length} / ${money(openTotal)}`}
          tone={openBills.length > 0 ? "warn" : "ok"}
        />
        <Stat label="Properties tracked" value={rows.filter((r) => r.utilities.length > 0).length.toString()} />
      </div>

      {openBills.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Open bills
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Utility</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openBills.map((b) => {
                  const status = billStatus(b);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/properties/${b.propertyId}`} className="hover:text-primary">
                          {b.propertyName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {utilityTypeLabel(b.utilityType)} ({b.providerName})
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatBillPeriod(b.periodStart, b.periodEnd)}</TableCell>
                      <TableCell className="whitespace-nowrap">{b.dueDate ? formatBillDate(b.dueDate) : "n/a"}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(b.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CLASS[status]}>{BILL_STATUS_LABELS[status]}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {rows.length === 0 || !anyBills ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-12 w-12 text-slate-200 mb-3" />
            <p className="text-slate-500">No utility bills logged yet.</p>
            <p className="text-slate-400 text-sm mt-1">
              Open a property, add the provider under Utilities, then use Log bill.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plug className="h-5 w-5" />
                By provider
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Utility</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Latest bill</TableHead>
                    <TableHead className="text-right">Latest amount</TableHead>
                    <TableHead className="text-right">12 mo total</TableHead>
                    <TableHead className="text-right">Avg / bill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.flatMap((r) =>
                    r.utilities.map((u, i) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {i === 0 ? (
                            <Link href={`/admin/properties/${r.id}`} className="hover:text-primary">
                              {r.name}
                            </Link>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {utilityTypeLabel(u.type)}
                          <span className="text-slate-500"> ({u.providerName}{u.unitNumber ? `, Unit ${u.unitNumber}` : ""})</span>
                        </TableCell>
                        <TableCell className="text-slate-600 tabular-nums">{u.accountNumber || "n/a"}</TableCell>
                        <TableCell className="text-slate-600 whitespace-nowrap">
                          {u.last ? (
                            <>
                              {formatBillPeriod(u.last.periodStart, u.last.periodEnd)}
                              {usageSummary(u.last) ? <span className="text-slate-400"> / {usageSummary(u.last)}</span> : null}
                            </>
                          ) : (
                            "No bills yet"
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{u.last ? money(u.last.amount) : "n/a"}</TableCell>
                        <TableCell className="text-right tabular-nums">{u.billCount ? money(u.trailingTotal) : "n/a"}</TableCell>
                        <TableCell className="text-right tabular-nums">{u.trailingAvg != null ? money(u.trailingAvg) : "n/a"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {activeMonths.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{year} by month</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      {activeMonths.map((m) => (
                        <TableHead key={m} className="text-right">{MONTHS[m]}</TableHead>
                      ))}
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows
                      .filter((r) => r.utilities.some((u) => u.billCount > 0))
                      .map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          {activeMonths.map((m) => (
                            <TableCell key={m} className="text-right tabular-nums text-slate-600">
                              {monthly[r.id][m] !== 0 ? money(monthly[r.id][m]) : ""}
                            </TableCell>
                          ))}
                          <TableCell className="text-right tabular-nums font-medium">{money(r.ytd)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="px-4 py-3">
        <p className="text-xs text-slate-500">{label}</p>
        <p
          className={`text-lg font-semibold tabular-nums ${
            tone === "warn" ? "text-amber-700" : tone === "ok" ? "text-green-700" : "text-on-surface"
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
