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
import { Bell } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { AnnounceComposer } from "./announce-composer";
import { EmailNowButton } from "./email-now-button";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const TYPE_LABEL: Record<string, string> = {
  LATE: "Late notice",
  DEMAND: "Demand for payment",
  CO_DEMAND: "Compliance / possession",
  CUSTOM: "Custom",
  ANNOUNCEMENT: "Announcement",
};

// Portfolio-wide log of every notice sent (or attempted), newest first. Drill
// into a lease to compose/resend; this is the audit trail across all tenants.
async function getNotices() {
  return db.notice.findMany({
    include: {
      lease: {
        include: {
          tenant: { include: { user: true } },
          unit: { include: { property: true } },
        },
      },
    },
    orderBy: { sentAt: "desc" },
  });
}

// Properties with their active-lease count, for the announcement composer.
async function getPropertyOptions() {
  const properties = await db.property.findMany({
    select: {
      id: true,
      name: true,
      units: { select: { leases: { where: { status: "ACTIVE" }, select: { id: true } } } },
    },
    orderBy: { name: "asc" },
  });
  return properties.map((p) => ({
    id: p.id,
    name: p.name,
    activeLeases: p.units.reduce((n, u) => n + u.leases.length, 0),
  }));
}

export default async function NoticesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [notices, properties] = await Promise.all([getNotices(), getPropertyOptions()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Notices</h1>
          <p className="text-muted-foreground mt-1">Announcements and every past-due, demand, and compliance notice across all leases</p>
        </div>
        <AnnounceComposer properties={properties} />
      </div>

      {notices.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-surface-container-highest mb-3" />
            <p className="text-muted-foreground">No notices yet. Post an announcement here, or compose a notice from a lease&apos;s detail page.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(n.sentAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/leases/${n.leaseId}`} className="font-medium text-on-surface hover:text-primary">
                        {n.lease.tenant.user.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{n.toEmail}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {n.lease.unit.property.name} #{n.lease.unit.unitNumber}
                    </TableCell>
                    <TableCell className="text-on-surface">{TYPE_LABEL[n.type] ?? n.type}</TableCell>
                    <TableCell className="text-right text-on-surface">{n.amountDue != null ? money(n.amountDue) : "—"}</TableCell>
                    <TableCell>
                      {n.status === "SENT" ? (
                        <Badge className="bg-green-600">Sent</Badge>
                      ) : n.status === "POSTED" ? (
                        <Badge className="bg-primary" title="Visible in the tenant portal; not emailed">Posted</Badge>
                      ) : (
                        <Badge className="bg-destructive" title={n.errorText ?? undefined}>Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                      {n.status === "POSTED" && <EmailNowButton noticeId={n.id} toEmail={n.toEmail} />}
                      <a
                        href={`/api/notices/${n.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        PDF
                      </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
