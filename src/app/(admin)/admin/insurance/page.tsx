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
import { Building2, Home, Shield } from "lucide-react";
import { addDays, isBefore, format } from "date-fns";
import Link from "next/link";
import { RequestAllButton } from "./request-all-button";

type Status = "VALID" | "EXPIRING" | "PENDING" | "MISSING";

const STATUS_META: Record<Status, { label: string; className: string }> = {
  VALID: { label: "Valid", className: "bg-green-50 text-green-700 border-green-200" },
  EXPIRING: { label: "Expiring soon", className: "bg-orange-50 text-orange-700 border-orange-200" },
  PENDING: { label: "Pending review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  MISSING: { label: "Missing / expired", className: "bg-red-50 text-red-700 border-red-200" },
};

async function getComplianceData() {
  const [leases, settings] = await Promise.all([
    db.lease.findMany({
      where: { status: "ACTIVE" },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
        insurance: { orderBy: { expirationDate: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.settings.findFirst(),
  ]);

  const leadDays = settings?.insuranceReminderLeadDays ?? 30;
  const now = new Date();

  const rows = leases.map((lease) => {
    const records = lease.insurance;
    // Latest valid (verified + unexpired) record drives the status.
    const validRecords = records.filter(
      (r) => r.verified && !isBefore(new Date(r.expirationDate), now)
    );
    const unexpiredUnverified = records.some(
      (r) => !r.verified && !isBefore(new Date(r.expirationDate), now)
    );

    let status: Status;
    let expirationDate: Date | null = null;
    if (validRecords.length > 0) {
      const soonest = validRecords.reduce((a, b) =>
        new Date(a.expirationDate) < new Date(b.expirationDate) ? a : b
      );
      expirationDate = new Date(soonest.expirationDate);
      status = isBefore(expirationDate, addDays(now, leadDays)) ? "EXPIRING" : "VALID";
    } else if (unexpiredUnverified) {
      status = "PENDING";
    } else {
      status = "MISSING";
    }

    return { lease, status, expirationDate };
  });

  const nonCompliantCount = rows.filter((r) => r.status === "MISSING").length;
  // Sort worst-first so problems surface at the top.
  const order: Record<Status, number> = { MISSING: 0, EXPIRING: 1, PENDING: 2, VALID: 3 };
  rows.sort((a, b) => order[a.status] - order[b.status]);

  return { rows, nonCompliantCount };
}

export default async function InsuranceCompliancePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { rows, nonCompliantCount } = await getComplianceData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Insurance Compliance</h1>
          <p className="text-slate-500 mt-1">
            Insurance status across all active leases
          </p>
        </div>
        <RequestAllButton nonCompliantCount={nonCompliantCount} />
      </div>

      {rows.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-slate-200 mb-3" />
            <p className="text-slate-500">No active leases</p>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ lease, status, expirationDate }) => {
                  const meta = STATUS_META[status];
                  const isCommercial = lease.leaseType === "COMMERCIAL";
                  return (
                    <TableRow key={lease.id}>
                      <TableCell>
                        <Link
                          href={`/admin/leases/${lease.id}`}
                          className="font-medium text-slate-900 hover:text-[#4f17ce]"
                        >
                          {lease.tenant.user.name}
                        </Link>
                        <div className="text-sm text-slate-500">{lease.tenant.user.email}</div>
                      </TableCell>
                      <TableCell>
                        {lease.unit.property.name} #{lease.unit.unitNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isCommercial
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {isCommercial ? (
                            <Building2 className="h-3 w-3 mr-1" />
                          ) : (
                            <Home className="h-3 w-3 mr-1" />
                          )}
                          {lease.leaseType || "RESIDENTIAL"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {expirationDate ? format(expirationDate, "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={meta.className}>
                          {meta.label}
                        </Badge>
                      </TableCell>
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
