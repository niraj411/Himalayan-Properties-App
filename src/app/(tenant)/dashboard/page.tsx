import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import {
  Home,
  FileText,
  Wrench,
  CreditCard,
  Calendar,
  AlertCircle,
  Plus,
  Receipt,
  Bell,
} from "lucide-react";
import { openBalance } from "@/lib/ledger";
import { leaseIdsForTenant } from "@/lib/ledger-db";

async function getTenantData(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      user: true,
      unit: {
        include: { property: true },
      },
      maintenanceRequests: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!tenant) return null;

  const leases = await db.lease.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ tenantId }, { coTenants: { some: { id: tenantId } } }],
    },
    take: 1,
    orderBy: { createdAt: "desc" },
  });

  // Outstanding balance across all of this tenant's leases (same math as the
  // Balance page) so the dashboard can surface "what do I owe" at a glance.
  const leaseIds = await leaseIdsForTenant(tenantId);
  const charges = await db.charge.findMany({
    where: { leaseId: { in: leaseIds } },
    select: { amount: true, amountPaid: true, status: true },
  });
  const balance = openBalance(charges);

  return { ...tenant, leases, balance };
}

export default async function TenantDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (!session.user.tenantId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-on-surface">Welcome</h1>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium text-on-surface mb-2">
              Profile Setup Required
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Your tenant profile is being set up. Please contact your property manager
              if you need assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tenant = await getTenantData(session.user.tenantId);

  if (!tenant) {
    redirect("/login");
  }

  const activeLease = tenant.leases[0];
  const openRequests = tenant.maintenanceRequests;
  const balance = tenant.balance;
  const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">
          Welcome back, {tenant.user.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your rental overview</p>
      </div>

      {/* Unit Info */}
      {tenant.unit ? (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-primary to-primary-container text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-5 w-5" />
                  <span className="font-medium">Your Unit</span>
                </div>
                <h2 className="text-2xl font-bold">
                  {tenant.unit.property.name} - Unit #{tenant.unit.unitNumber}
                </h2>
                <p className="text-white/80 mt-1">
                  {tenant.unit.property.address}, {tenant.unit.property.city},{" "}
                  {tenant.unit.property.state} {tenant.unit.property.zip}
                </p>
              </div>
              {activeLease && (
                <div className="text-right">
                  <p className="text-white/80 text-sm">Monthly Rent</p>
                  <p className="text-3xl font-bold">
                    ${((activeLease.monthlyRent ?? 0) + (activeLease.nnnMonthly ?? 0)).toLocaleString()}
                  </p>
                  {activeLease.nnnMonthly ? (
                    <p className="text-white/80 text-xs mt-1">
                      base ${activeLease.monthlyRent.toLocaleString()} + NNN ${activeLease.nnnMonthly.toLocaleString()}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Home className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No unit assigned yet</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/dashboard/balance">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-on-surface">Balance</h3>
              <p className={`text-sm mt-1 ${balance > 0 ? "font-medium text-primary" : "text-muted-foreground"}`}>
                {balance > 0 ? `${money(balance)} due` : "All caught up"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/payments">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-on-surface">Payments</h3>
              <p className="text-sm text-muted-foreground mt-1">Pay rent &amp; view history</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/maintenance">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-on-surface">Maintenance</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {openRequests.length > 0
                  ? `${openRequests.length} open request(s)`
                  : "Submit a request"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/notices">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-on-surface">Notices</h3>
              <p className="text-sm text-muted-foreground mt-1">Letters &amp; notifications</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/lease">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-on-surface">My Lease</h3>
              <p className="text-sm text-muted-foreground mt-1">View lease details</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Lease Info */}
      {activeLease && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Lease Information
            </CardTitle>
            <Badge className="bg-green-50 text-green-700">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {format(new Date(activeLease.startDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {format(new Date(activeLease.endDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security Deposit</p>
                <p className="font-medium">
                  {activeLease.depositAmount
                    ? `$${activeLease.depositAmount.toLocaleString()}`
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Maintenance Requests */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-600" />
            Open Maintenance Requests
          </CardTitle>
          <Link href="/dashboard/maintenance">
            <Button size="sm" className="">
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {openRequests.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              No open maintenance requests
            </p>
          ) : (
            <ul className="space-y-3">
              {openRequests.map((request) => (
                <li
                  key={request.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-on-surface">{request.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={request.priority === "EMERGENCY" ? "destructive" : "secondary"}
                      className={
                        request.priority === "HIGH"
                          ? "bg-amber-50 text-amber-700"
                          : request.priority === "EMERGENCY"
                          ? ""
                          : "bg-slate-100"
                      }
                    >
                      {request.priority}
                    </Badge>
                    <Badge
                      className={
                        request.status === "IN_PROGRESS"
                          ? "bg-primary/10 text-primary"
                          : "bg-primary/10 text-primary"
                      }
                    >
                      {request.status === "IN_PROGRESS" ? "In Progress" : "Open"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
