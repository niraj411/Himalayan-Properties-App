"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ClipboardList,
  Loader2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
  Mail,
  Phone,
  User,
  Briefcase,
  DollarSign,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentAddress: string | null;
  employerName: string | null;
  employerPhone: string | null;
  jobTitle: string | null;
  monthlyIncome: number | null;
  moveInDate: string | null;
  numberOfOccupants: number | null;
  pets: string | null;
  references: string | null;
  additionalNotes: string | null;
  status: string;
  createdAt: string;
  property: { name: string } | null;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/applications");
      if (response.ok) {
        setApplications(await response.json());
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Application ${status.toLowerCase()}`);
        fetchApplications();
        setSelectedApplication(null);
      } else {
        toast.error("Failed to update application");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      const response = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Application deleted");
        fetchApplications();
      } else {
        toast.error("Failed to delete application");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tenant Applications</h1>
        <p className="text-slate-500 mt-1">Review and manage rental applications</p>
      </div>

      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No applications yet</h3>
            <p className="text-slate-500 text-center">
              Applications will appear here when prospective tenants apply
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedApplication(app)}
                  >
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {app.firstName} {app.lastName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {app.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {app.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{app.property?.name || "General"}</TableCell>
                    <TableCell>
                      {app.monthlyIncome ? (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                          {app.monthlyIncome.toLocaleString()}/mo
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={app.status === "APPROVED" ? "default" : "secondary"}
                        className={
                          app.status === "PENDING"
                            ? "bg-yellow-50 text-yellow-700"
                            : app.status === "APPROVED"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {format(new Date(app.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {app.status === "PENDING" && (
                            <>
                              <DropdownMenuItem onClick={() => updateStatus(app.id, "APPROVED")}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(app.id, "REJECTED")}>
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(app.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedApplication.firstName} {selectedApplication.lastName}
                    </h3>
                    <p className="text-slate-500">{selectedApplication.email}</p>
                  </div>
                </div>
                <Badge
                  className={
                    selectedApplication.status === "PENDING"
                      ? "bg-yellow-50 text-yellow-700"
                      : selectedApplication.status === "APPROVED"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }
                >
                  {selectedApplication.status}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{selectedApplication.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{selectedApplication.email}</span>
                    </div>
                    {selectedApplication.currentAddress && (
                      <p className="text-sm text-slate-600 mt-2">{selectedApplication.currentAddress}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Employment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedApplication.employerName && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span>{selectedApplication.employerName}</span>
                      </div>
                    )}
                    {selectedApplication.jobTitle && (
                      <p className="text-sm text-slate-600">{selectedApplication.jobTitle}</p>
                    )}
                    {selectedApplication.monthlyIncome && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span>${selectedApplication.monthlyIncome.toLocaleString()}/month</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {selectedApplication.moveInDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Move-in: {format(new Date(selectedApplication.moveInDate), "MMM d, yyyy")}</span>
                  </div>
                )}
                {selectedApplication.numberOfOccupants && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{selectedApplication.numberOfOccupants} occupant(s)</span>
                  </div>
                )}
              </div>

              {selectedApplication.pets && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Pets</p>
                  <p className="text-slate-700">{selectedApplication.pets}</p>
                </div>
              )}

              {selectedApplication.references && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">References</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedApplication.references}</p>
                </div>
              )}

              {selectedApplication.additionalNotes && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Additional Notes</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedApplication.additionalNotes}</p>
                </div>
              )}

              {selectedApplication.status === "PENDING" && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => updateStatus(selectedApplication.id, "REJECTED")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus(selectedApplication.id, "APPROVED")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
