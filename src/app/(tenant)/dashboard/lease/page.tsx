import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import {
  FileText,
  Calendar,
  DollarSign,
  Home,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

async function getLeaseData(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      unit: {
        include: { property: true },
      },
      leases: {
        orderBy: { createdAt: "desc" },
        include: {
          unit: { include: { property: true } },
        },
      },
    },
  });

  return tenant;
}

export default async function TenantLeasePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    redirect("/login");
  }

  const tenant = await getLeaseData(session.user.tenantId);

  if (!tenant) {
    redirect("/login");
  }

  const activeLease = tenant.leases.find((l) => l.status === "ACTIVE");
  const pastLeases = tenant.leases.filter((l) => l.status !== "ACTIVE");

  const daysUntilExpiration = activeLease
    ? differenceInDays(new Date(activeLease.endDate), new Date())
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Lease</h1>
        <p className="text-slate-500 mt-1">View your lease agreement details</p>
      </div>

      {activeLease ? (
        <>
          {/* Expiration Warning */}
          {daysUntilExpiration !== null && daysUntilExpiration <= 60 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">
                    {daysUntilExpiration <= 0
                      ? "Your lease has expired"
                      : `Your lease expires in ${daysUntilExpiration} days`}
                  </p>
                  <p className="text-sm text-orange-700">
                    Please contact your property manager about renewal
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Lease */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Active Lease
              </CardTitle>
              <Badge className="bg-green-50 text-green-700">Active</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Info */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {activeLease.unit.property.name} - Unit #{activeLease.unit.unitNumber}
                  </h3>
                  <p className="text-slate-500">
                    {activeLease.unit.property.address}, {activeLease.unit.property.city},{" "}
                    {activeLease.unit.property.state} {activeLease.unit.property.zip}
                  </p>
                </div>
              </div>

              {/* Lease Details */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Start Date</span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {format(new Date(activeLease.startDate), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">End Date</span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {format(new Date(activeLease.endDate), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Monthly Rent</span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    ${activeLease.monthlyRent.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Security Deposit</span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {activeLease.depositAmount
                      ? `$${activeLease.depositAmount.toLocaleString()}`
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Document Link */}
              {activeLease.documentUrl && (
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <span className="font-medium">Lease Document</span>
                  </div>
                  <Button variant="outline" asChild>
                    <a
                      href={activeLease.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Document
                    </a>
                  </Button>
                </div>
              )}

              {/* Notes */}
              {activeLease.notes && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-500 mb-2">Notes</p>
                  <p className="text-slate-700">{activeLease.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Active Lease</h3>
            <p className="text-slate-500 text-center">
              You don&apos;t have an active lease at the moment.
              <br />
              Please contact your property manager for assistance.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Past Leases */}
      {pastLeases.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Past Leases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastLeases.map((lease) => (
                <div
                  key={lease.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {lease.unit.property.name} - Unit #{lease.unit.unitNumber}
                    </p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(lease.startDate), "MMM yyyy")} -{" "}
                      {format(new Date(lease.endDate), "MMM yyyy")}
                    </p>
                  </div>
                  <Badge
                    className={
                      lease.status === "EXPIRED"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-slate-100 text-slate-600"
                    }
                  >
                    {lease.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
