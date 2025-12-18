import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Home,
  Users,
  FileText,
  Wrench,
  AlertTriangle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { format, addDays, isBefore } from "date-fns";
import Link from "next/link";

async function getDashboardData() {
  const [
    propertiesCount,
    unitsCount,
    vacantUnitsCount,
    tenantsCount,
    activeLeasesCount,
    openMaintenanceCount,
    pendingApplicationsCount,
    expiringLeases,
    recentMaintenanceRequests,
  ] = await Promise.all([
    db.property.count(),
    db.unit.count(),
    db.unit.count({ where: { status: "VACANT" } }),
    db.tenant.count({ where: { unitId: { not: null } } }),
    db.lease.count({ where: { status: "ACTIVE" } }),
    db.maintenanceRequest.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.application.count({ where: { status: "PENDING" } }),
    db.lease.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lte: addDays(new Date(), 60) },
      },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
      },
      orderBy: { endDate: "asc" },
      take: 5,
    }),
    db.maintenanceRequest.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    propertiesCount,
    unitsCount,
    vacantUnitsCount,
    tenantsCount,
    activeLeasesCount,
    openMaintenanceCount,
    pendingApplicationsCount,
    expiringLeases,
    recentMaintenanceRequests,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const data = await getDashboardData();

  const stats = [
    {
      name: "Properties",
      value: data.propertiesCount,
      icon: Building2,
      href: "/admin/properties",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      name: "Total Units",
      value: data.unitsCount,
      subtext: `${data.vacantUnitsCount} vacant`,
      icon: Home,
      href: "/admin/properties",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      name: "Active Tenants",
      value: data.tenantsCount,
      icon: Users,
      href: "/admin/tenants",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      name: "Active Leases",
      value: data.activeLeasesCount,
      icon: FileText,
      href: "/admin/leases",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      name: "Open Requests",
      value: data.openMaintenanceCount,
      icon: Wrench,
      href: "/admin/maintenance",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      name: "Applications",
      value: data.pendingApplicationsCount,
      subtext: "pending",
      icon: DollarSign,
      href: "/admin/applications",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, {session.user.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.name}</p>
                {stat.subtext && (
                  <p className="text-xs text-slate-400 mt-1">{stat.subtext}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expiring Leases */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Expiring Leases
            </CardTitle>
            <Link href="/admin/leases" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.expiringLeases.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No leases expiring soon</p>
            ) : (
              <ul className="space-y-3">
                {data.expiringLeases.map((lease) => {
                  const isExpired = isBefore(new Date(lease.endDate), new Date());
                  return (
                    <li key={lease.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-medium text-slate-900">
                          {lease.tenant.user.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {lease.unit.property.name} - Unit {lease.unit.unitNumber}
                        </p>
                      </div>
                      <Badge variant={isExpired ? "destructive" : "secondary"} className="flex items-center gap-1">
                        {isExpired && <AlertTriangle className="h-3 w-3" />}
                        {format(new Date(lease.endDate), "MMM d, yyyy")}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Maintenance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-red-500" />
              Open Maintenance Requests
            </CardTitle>
            <Link href="/admin/maintenance" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentMaintenanceRequests.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No open maintenance requests</p>
            ) : (
              <ul className="space-y-3">
                {data.recentMaintenanceRequests.map((request) => (
                  <li key={request.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">{request.title}</p>
                      <p className="text-sm text-slate-500">
                        {request.unit.property.name} - Unit {request.unit.unitNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          request.priority === "EMERGENCY"
                            ? "destructive"
                            : request.priority === "HIGH"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {request.priority}
                      </Badge>
                      <Badge variant="outline">
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
    </div>
  );
}
