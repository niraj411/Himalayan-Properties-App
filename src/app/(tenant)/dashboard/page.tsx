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
} from "lucide-react";

async function getTenantData(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      user: true,
      unit: {
        include: { property: true },
      },
      leases: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      maintenanceRequests: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  return tenant;
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
        <h1 className="text-2xl font-bold text-slate-900">Welcome</h1>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Profile Setup Required
            </h3>
            <p className="text-slate-500 text-center max-w-md">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {tenant.user.name.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s your rental overview</p>
      </div>

      {/* Unit Info */}
      {tenant.unit ? (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white">
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
                <p className="text-blue-100 mt-1">
                  {tenant.unit.property.address}, {tenant.unit.property.city},{" "}
                  {tenant.unit.property.state} {tenant.unit.property.zip}
                </p>
              </div>
              {activeLease && (
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Monthly Rent</p>
                  <p className="text-3xl font-bold">
                    ${activeLease.monthlyRent.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Home className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500">No unit assigned yet</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard/maintenance">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Maintenance</h3>
              <p className="text-sm text-slate-500 mt-1">
                {openRequests.length > 0
                  ? `${openRequests.length} open request(s)`
                  : "Submit a request"}
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
              <h3 className="font-semibold text-slate-900">Payments</h3>
              <p className="text-sm text-slate-500 mt-1">View payment info</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/lease">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900">My Lease</h3>
              <p className="text-sm text-slate-500 mt-1">View lease details</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Lease Info */}
      {activeLease && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Lease Information
            </CardTitle>
            <Badge className="bg-green-50 text-green-700">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Start Date</p>
                <p className="font-medium">
                  {format(new Date(activeLease.startDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">End Date</p>
                <p className="font-medium">
                  {format(new Date(activeLease.endDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Security Deposit</p>
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
            <Wrench className="h-5 w-5 text-orange-600" />
            Open Maintenance Requests
          </CardTitle>
          <Link href="/dashboard/maintenance">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {openRequests.length === 0 ? (
            <p className="text-slate-500 py-4 text-center">
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
                    <p className="font-medium text-slate-900">{request.title}</p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={request.priority === "EMERGENCY" ? "destructive" : "secondary"}
                      className={
                        request.priority === "HIGH"
                          ? "bg-orange-50 text-orange-700"
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
                          ? "bg-purple-50 text-purple-700"
                          : "bg-blue-50 text-blue-700"
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
