"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { confirmDialog } from "@/components/ui/confirm";
import { format } from "date-fns";
import {
  ClipboardList,
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
  Store,
  Home,
  FileText,
  ExternalLink,
  Plus,
  Undo2,
  Wallet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorState } from "@/components/ui/error-state";
import { TableSkeleton } from "@/components/ui/skeletons";

interface Application {
  id: string;
  applicationType: string;
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
  businessName: string | null;
  taxReturnsUrl: string | null;
  bankStatementsUrl: string | null;
  unitId: string | null;
  intendedUse: string | null;
  desiredTerm: string | null;
  guarantorName: string | null;
  status: string;
  adminNotes: string | null;
  holdingDeposit: number | null;
  holdingDepositDate: string | null;
  refundAmount: number | null;
  refundDate: string | null;
  createdAt: string;
  property: { name: string; type: string } | null;
  unit: { unitNumber: string } | null;
}

interface PropertyOption {
  id: string;
  name: string;
  type: string;
  units: { id: string; unitNumber: string; status: string }[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

function statusClass(status: string) {
  switch (status) {
    case "PENDING": return "bg-amber-50 text-amber-700";
    case "APPROVED": return "bg-green-50 text-green-700";
    case "WITHDRAWN": return "bg-surface-container-high text-on-surface-variant";
    default: return "bg-red-50 text-red-700";
  }
}

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toInputDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

interface InternalForm {
  adminNotes: string;
  holdingDeposit: string;
  holdingDepositDate: string;
  refundAmount: string;
  refundDate: string;
}

const emptyNewApplicant = {
  applicationType: "RESIDENTIAL",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  propertyId: "",
  unitId: "",
  moveInDate: "",
  status: "PENDING",
  adminNotes: "",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [internal, setInternal] = useState<InternalForm>({ adminNotes: "", holdingDeposit: "", holdingDepositDate: "", refundAmount: "", refundDate: "" });
  const [savingInternal, setSavingInternal] = useState(false);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [newApplicant, setNewApplicant] = useState({ ...emptyNewApplicant });
  const [creating, setCreating] = useState(false);

  const openApplication = (app: Application) => {
    setSelectedApplication(app);
    setInternal({
      adminNotes: app.adminNotes ?? "",
      holdingDeposit: app.holdingDeposit != null ? String(app.holdingDeposit) : "",
      holdingDepositDate: toInputDate(app.holdingDepositDate),
      refundAmount: app.refundAmount != null ? String(app.refundAmount) : "",
      refundDate: toInputDate(app.refundDate),
    });
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/applications");
      if (!response.ok) throw new Error();
      setApplications(await response.json());
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetch("/api/properties")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: PropertyOption[]) => setProperties(Array.isArray(list) ? list : []))
      .catch(() => setProperties([]));
  }, []);

  const saveInternal = async () => {
    if (!selectedApplication) return;
    setSavingInternal(true);
    try {
      const response = await fetch(`/api/applications/${selectedApplication.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(internal),
      });
      if (!response.ok) throw new Error();
      toast.success("Application updated");
      fetchApplications();
      setSelectedApplication(null);
    } catch {
      toast.error("Failed to save application");
    } finally {
      setSavingInternal(false);
    }
  };

  const createApplicant = async () => {
    const a = newApplicant;
    if (!a.firstName || !a.lastName || !a.email || !a.phone) {
      toast.error("Name, email and phone are required");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...a,
          propertyId: a.propertyId || null,
          unitId: a.unitId || null,
          moveInDate: a.moveInDate || null,
        }),
      });
      if (!response.ok) throw new Error();
      const created: Application = await response.json();
      toast.success("Applicant logged");
      setLogOpen(false);
      setNewApplicant({ ...emptyNewApplicant });
      await fetchApplications();
      openApplication({ ...created, property: created.property ?? null, unit: created.unit ?? null });
    } catch {
      toast.error("Failed to log applicant");
    } finally {
      setCreating(false);
    }
  };

  const selectedProperty = properties.find((p) => p.id === newApplicant.propertyId);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Application marked ${STATUS_LABEL[status]?.toLowerCase() ?? status.toLowerCase()}`);
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
    if (!(await confirmDialog({ title: "Delete application?", description: "This permanently deletes the application.", confirmText: "Delete", destructive: true }))) return;

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 mt-1">Review and manage rental applications</p>
        </div>
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 mt-1">Review and manage rental applications</p>
        </div>
        <ErrorState message="We couldn't load this page." onRetry={fetchApplications} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 mt-1">Review and manage rental applications</p>
        </div>
        <Button onClick={() => setLogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Log applicant
        </Button>
      </div>

      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No applications yet</h3>
            <p className="text-slate-500 text-center">
              Applications will appear here when prospective tenants apply. Use &quot;Log applicant&quot; for people who came in through Zillow or in person.
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
                  <TableHead>Type</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer"
                    onClick={() => openApplication(app)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">
                          {app.businessName || `${app.firstName} ${app.lastName}`}
                        </div>
                        <div className="text-xs text-slate-500">{app.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        app.applicationType === "COMMERCIAL"
                          ? "border-primary/20 text-primary bg-primary/10"
                          : "border-primary/20 text-primary bg-primary/10"
                      }>
                        {app.applicationType === "COMMERCIAL" ? (
                          <Store className="h-3 w-3 mr-1" />
                        ) : (
                          <Home className="h-3 w-3 mr-1" />
                        )}
                        {app.applicationType === "COMMERCIAL" ? "Commercial" : "Residential"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {app.property?.name || "General Inquiry"}{app.unit ? ` · Unit ${app.unit.unitNumber}` : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={statusClass(app.status)}>{STATUS_LABEL[app.status] ?? app.status}</Badge>
                        {app.refundAmount != null && (
                          <span className="text-xs text-on-surface-variant">Refunded {money(app.refundAmount)}</span>
                        )}
                        {app.refundAmount == null && app.holdingDeposit != null && (
                          <span className="text-xs text-on-surface-variant">Holding {money(app.holdingDeposit)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
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
                          {(app.status === "PENDING" || app.status === "APPROVED") && (
                            <DropdownMenuItem onClick={() => updateStatus(app.id, "WITHDRAWN")}>
                              <Undo2 className="h-4 w-4 mr-2 text-on-surface-variant" />
                              Mark withdrawn
                            </DropdownMenuItem>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Application Details
              {selectedApplication?.applicationType === "COMMERCIAL" && (
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/10">
                  <Store className="h-3 w-3 mr-1" />
                  Commercial
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-5 mt-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    selectedApplication.applicationType === "COMMERCIAL"
                      ? "bg-primary/10"
                      : "bg-primary/10"
                  }`}>
                    {selectedApplication.applicationType === "COMMERCIAL" ? (
                      <Store className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    {selectedApplication.businessName && (
                      <h3 className="font-semibold text-lg">{selectedApplication.businessName}</h3>
                    )}
                    <p className={selectedApplication.businessName ? "text-sm text-slate-500" : "font-semibold text-lg"}>
                      {selectedApplication.firstName} {selectedApplication.lastName}
                    </p>
                  </div>
                </div>
                <Badge className={statusClass(selectedApplication.status)}>
                  {STATUS_LABEL[selectedApplication.status] ?? selectedApplication.status}
                </Badge>
              </div>

              {/* Contact & Property Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border shadow-none">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{selectedApplication.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{selectedApplication.email}</span>
                    </div>
                    {selectedApplication.currentAddress && (
                      <p className="text-sm text-slate-600 pt-1">{selectedApplication.currentAddress}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border shadow-none">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {selectedApplication.applicationType === "COMMERCIAL" ? "Business Details" : "Employment"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-3">
                    {selectedApplication.employerName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span>{selectedApplication.employerName}</span>
                      </div>
                    )}
                    {selectedApplication.jobTitle && (
                      <p className="text-sm text-slate-600">{selectedApplication.jobTitle}</p>
                    )}
                    {selectedApplication.monthlyIncome && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span>${selectedApplication.monthlyIncome.toLocaleString()}/month</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Commercial Documents */}
              {selectedApplication.applicationType === "COMMERCIAL" && (
                <Card className="border-primary/20 bg-primary/10 shadow-none">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-medium text-primary uppercase tracking-wide flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Commercial Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-3">
                    {(selectedApplication.unit || selectedApplication.intendedUse || selectedApplication.desiredTerm || selectedApplication.guarantorName) && (
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
                        {selectedApplication.unit && (<><dt className="text-muted-foreground">Unit</dt><dd className="text-on-surface font-medium">Unit {selectedApplication.unit.unitNumber}</dd></>)}
                        {selectedApplication.intendedUse && (<><dt className="text-muted-foreground">Intended use</dt><dd className="text-on-surface font-medium">{selectedApplication.intendedUse}</dd></>)}
                        {selectedApplication.desiredTerm && (<><dt className="text-muted-foreground">Desired term</dt><dd className="text-on-surface font-medium">{selectedApplication.desiredTerm}</dd></>)}
                        {selectedApplication.guarantorName && (<><dt className="text-muted-foreground">Guarantor</dt><dd className="text-on-surface font-medium">{selectedApplication.guarantorName}</dd></>)}
                      </dl>
                    )}
                    {!selectedApplication.taxReturnsUrl && !selectedApplication.bankStatementsUrl && (
                      <p className="text-xs text-muted-foreground">No financial documents linked yet. Request 2 years of tax returns and 3 months of bank statements before an LOI.</p>
                    )}
                    {selectedApplication.taxReturnsUrl && (
                      <a
                        href={selectedApplication.taxReturnsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                        2 Years Corporate Tax Returns
                      </a>
                    )}
                    {selectedApplication.bankStatementsUrl && (
                      <a
                        href={selectedApplication.bankStatementsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                        3 Months Bank Statements
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Move-in Date & Occupants */}
              <div className="flex flex-wrap gap-4 text-sm">
                {selectedApplication.moveInDate && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Move-in: {format(new Date(selectedApplication.moveInDate), "MMM d, yyyy")}</span>
                  </div>
                )}
                {selectedApplication.numberOfOccupants && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{selectedApplication.numberOfOccupants} occupant(s)</span>
                  </div>
                )}
              </div>

              {selectedApplication.pets && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Pets</p>
                  <p className="text-sm text-slate-700">{selectedApplication.pets}</p>
                </div>
              )}

              {selectedApplication.references && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">References</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedApplication.references}</p>
                </div>
              )}

              {selectedApplication.additionalNotes && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Additional Notes</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedApplication.additionalNotes}</p>
                </div>
              )}

              {/* Internal: money handed over before a lease exists, and admin notes */}
              <Card className="bg-surface-container-low border-0 shadow-none">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-medium text-on-surface-variant uppercase tracking-wide flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5" />
                    Internal (not shown to applicant)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="holdingDeposit" className="text-xs">Holding deposit received</Label>
                      <Input id="holdingDeposit" type="number" step="0.01" min="0" placeholder="0.00" value={internal.holdingDeposit} onChange={(e) => setInternal({ ...internal, holdingDeposit: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="holdingDepositDate" className="text-xs">Received on</Label>
                      <Input id="holdingDepositDate" type="date" value={internal.holdingDepositDate} onChange={(e) => setInternal({ ...internal, holdingDepositDate: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="refundAmount" className="text-xs">Refunded to applicant</Label>
                      <Input id="refundAmount" type="number" step="0.01" min="0" placeholder="0.00" value={internal.refundAmount} onChange={(e) => setInternal({ ...internal, refundAmount: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="refundDate" className="text-xs">Refunded on</Label>
                      <Input id="refundDate" type="date" value={internal.refundDate} onChange={(e) => setInternal({ ...internal, refundDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adminNotes" className="text-xs">Admin notes</Label>
                    <Textarea id="adminNotes" rows={4} placeholder="What happened, how money moved, anything to remember." value={internal.adminNotes} onChange={(e) => setInternal({ ...internal, adminNotes: e.target.value })} />
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={saveInternal} disabled={savingInternal}>
                      {savingInternal ? "Saving..." : "Save notes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {(selectedApplication.status === "PENDING" || selectedApplication.status === "APPROVED") && (
                <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatus(selectedApplication.id, "WITHDRAWN")}
                  >
                    <Undo2 className="h-4 w-4 mr-1" />
                    Mark withdrawn
                  </Button>
                  {selectedApplication.status === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => updateStatus(selectedApplication.id, "REJECTED")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatus(selectedApplication.id, "APPROVED")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log applicant</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-on-surface-variant -mt-2">
            For someone who applied through Zillow, by email or in person, so the paper trail lives here.
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="na-first">First name</Label>
                <Input id="na-first" value={newApplicant.firstName} onChange={(e) => setNewApplicant({ ...newApplicant, firstName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="na-last">Last name</Label>
                <Input id="na-last" value={newApplicant.lastName} onChange={(e) => setNewApplicant({ ...newApplicant, lastName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="na-email">Email</Label>
                <Input id="na-email" type="email" value={newApplicant.email} onChange={(e) => setNewApplicant({ ...newApplicant, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="na-phone">Phone</Label>
                <Input id="na-phone" value={newApplicant.phone} onChange={(e) => setNewApplicant({ ...newApplicant, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Property</Label>
                <Select value={newApplicant.propertyId} onValueChange={(v) => setNewApplicant({ ...newApplicant, propertyId: v, unitId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select value={newApplicant.unitId} onValueChange={(v) => setNewApplicant({ ...newApplicant, unitId: v })} disabled={!selectedProperty}>
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    {(selectedProperty?.units ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>Unit {u.unitNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={newApplicant.applicationType} onValueChange={(v) => setNewApplicant({ ...newApplicant, applicationType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={newApplicant.status} onValueChange={(v) => setNewApplicant({ ...newApplicant, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="na-movein">Requested move-in</Label>
                <Input id="na-movein" type="date" value={newApplicant.moveInDate} onChange={(e) => setNewApplicant({ ...newApplicant, moveInDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="na-notes">Admin notes</Label>
              <Textarea id="na-notes" rows={3} value={newApplicant.adminNotes} onChange={(e) => setNewApplicant({ ...newApplicant, adminNotes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
              <Button onClick={createApplicant} disabled={creating}>{creating ? "Saving..." : "Log applicant"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
