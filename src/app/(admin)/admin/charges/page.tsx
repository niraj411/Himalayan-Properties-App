import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt } from "lucide-react";
import { format, isBefore } from "date-fns";
import Link from "next/link";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Portfolio-wide view of money owed: every OPEN charge across all leases, with
// the tenant/property it belongs to. Drill into a lease to manage its charges.
async function getOutstanding() {
  const charges = await db.charge.findMany({
    where: { status: "OPEN" },
    include: {
      lease: {
        include: {
          tenant: { include: { user: true } },
          unit: { include: { property: true } },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }],
  });
  const total = charges.reduce((s, c) => s + c.amount, 0);
  const tenants = new Set(charges.map((c) => c.lease.tenantId)).size;
  return { charges, total, tenants };
}

export default async function OutstandingPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const { charges, total, tenants } = await getOutstanding();
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Outstanding</h1>
        <p className="text-muted-foreground mt-1">Open charges across all leases</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total outstanding" value={money(total)} accent />
        <SummaryCard label="Open charges" value={String(charges.length)} />
        <SummaryCard label="Tenants with a balance" value={String(tenants)} />
      </div>

      {charges.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-surface-container-highest mb-3" />
            <p className="text-muted-foreground">No outstanding charges — everyone&apos;s current.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((c) => {
                  const overdue = c.dueDate && isBefore(new Date(c.dueDate), now);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/admin/leases/${c.leaseId}`} className="font-medium text-on-surface hover:text-primary">
                          {c.lease.tenant.user.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.lease.unit.property.name} #{c.lease.unit.unitNumber}
                      </TableCell>
                      <TableCell>
                        <span className="text-on-surface">{c.label}</span>
                        <Badge variant="secondary" className="ml-2 align-middle">{c.kind.replace(/_/g, " ").toLowerCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        {c.dueDate ? (
                          <span className={overdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {format(new Date(c.dueDate), "MMM d, yyyy")}{overdue ? " · overdue" : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-on-surface">{money(c.amount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${accent ? "text-primary" : "text-on-surface"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
