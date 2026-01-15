"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format, isBefore, addDays } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Home,
  Calendar,
  DollarSign,
  TrendingUp,
  Shield,
  Plus,
  Loader2,
  Check,
  AlertTriangle,
  Trash2,
  ExternalLink,
  FileText,
  Upload,
} from "lucide-react";

interface Escalation {
  id: string;
  effectiveDate: string;
  newMonthlyRent: number;
  increaseType: string;
  increaseValue: number | null;
  notes: string | null;
  applied: boolean;
}

interface Insurance {
  id: string;
  insuranceType: string;
  carrier: string | null;
  policyNumber: string | null;
  coverageAmount: number | null;
  effectiveDate: string;
  expirationDate: string;
  documentUrl: string | null;
  beneficiaryName: string;
  verified: boolean;
}

interface Lease {
  id: string;
  leaseType: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number | null;
  documentUrl: string | null;
  status: string;
  notes: string | null;
  tenant: {
    id: string;
    user: { name: string; email: string; phone: string | null };
  };
  unit: {
    id: string;
    unitNumber: string;
    property: { name: string; type: string };
  };
  escalations: Escalation[];
  insurance: Insurance[];
}

export default function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lease, setLease] = useState<Lease | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Escalation dialog
  const [isEscalationDialogOpen, setIsEscalationDialogOpen] = useState(false);
  const [escalationForm, setEscalationForm] = useState({
    effectiveDate: "",
    newMonthlyRent: "",
    increaseType: "PERCENTAGE",
    increaseValue: "",
    notes: "",
  });

  // Insurance dialog
  const [isInsuranceDialogOpen, setIsInsuranceDialogOpen] = useState(false);
  const [insuranceForm, setInsuranceForm] = useState({
    insuranceType: "LIABILITY",
    carrier: "",
    policyNumber: "",
    coverageAmount: "",
    effectiveDate: "",
    expirationDate: "",
    documentUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLease = async () => {
    try {
      const response = await fetch(`/api/leases/${id}`);
      if (response.ok) {
        setLease(await response.json());
      } else {
        toast.error("Failed to load lease");
      }
    } catch {
      toast.error("Failed to load lease");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLease();
  }, [id]);

  const handleAddEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId: id,
          ...escalationForm,
        }),
      });

      if (response.ok) {
        toast.success("Escalation added");
        setIsEscalationDialogOpen(false);
        setEscalationForm({
          effectiveDate: "",
          newMonthlyRent: "",
          increaseType: "PERCENTAGE",
          increaseValue: "",
          notes: "",
        });
        fetchLease();
      } else {
        toast.error("Failed to add escalation");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyEscalation = async (escalationId: string) => {
    try {
      const response = await fetch(`/api/escalations/${escalationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applied: true }),
      });

      if (response.ok) {
        toast.success("Escalation applied - rent updated");
        fetchLease();
      } else {
        toast.error("Failed to apply escalation");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteEscalation = async (escalationId: string) => {
    if (!confirm("Delete this escalation?")) return;

    try {
      const response = await fetch(`/api/escalations/${escalationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Escalation deleted");
        fetchLease();
      } else {
        toast.error("Failed to delete escalation");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId: id,
          ...insuranceForm,
        }),
      });

      if (response.ok) {
        toast.success("Insurance record added");
        setIsInsuranceDialogOpen(false);
        setInsuranceForm({
          insuranceType: "LIABILITY",
          carrier: "",
          policyNumber: "",
          coverageAmount: "",
          effectiveDate: "",
          expirationDate: "",
          documentUrl: "",
        });
        fetchLease();
      } else {
        toast.error("Failed to add insurance record");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyInsurance = async (insuranceId: string) => {
    try {
      const response = await fetch(`/api/insurance/${insuranceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true }),
      });

      if (response.ok) {
        toast.success("Insurance verified");
        fetchLease();
      } else {
        toast.error("Failed to verify insurance");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteInsurance = async (insuranceId: string) => {
    if (!confirm("Delete this insurance record?")) return;

    try {
      const response = await fetch(`/api/insurance/${insuranceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Insurance record deleted");
        fetchLease();
      } else {
        toast.error("Failed to delete insurance record");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const calculateNewRent = () => {
    if (!lease || !escalationForm.increaseType) return "";
    const currentRent = lease.monthlyRent;

    if (escalationForm.increaseType === "PERCENTAGE" && escalationForm.increaseValue) {
      const increase = currentRent * (parseFloat(escalationForm.increaseValue) / 100);
      return (currentRent + increase).toFixed(2);
    } else if (escalationForm.increaseType === "FIXED_AMOUNT" && escalationForm.increaseValue) {
      return (currentRent + parseFloat(escalationForm.increaseValue)).toFixed(2);
    }
    return escalationForm.newMonthlyRent;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Lease not found</p>
        <Link href="/admin/leases">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leases
          </Button>
        </Link>
      </div>
    );
  }

  const isCommercial = lease.leaseType === "COMMERCIAL";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/leases">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {lease.tenant.user.name}
            </h1>
            <Badge
              variant="outline"
              className={
                isCommercial
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }
            >
              {isCommercial ? <Building2 className="h-3 w-3 mr-1" /> : <Home className="h-3 w-3 mr-1" />}
              {lease.leaseType}
            </Badge>
            <Badge
              className={
                lease.status === "ACTIVE"
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }
            >
              {lease.status}
            </Badge>
          </div>
          <p className="text-slate-500 mt-1">
            {lease.unit.property.name} - Unit #{lease.unit.unitNumber}
          </p>
        </div>
      </div>

      {/* Lease Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Monthly Rent</p>
                <p className="text-xl font-bold text-slate-900">
                  ${lease.monthlyRent.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Start Date</p>
                <p className="text-xl font-bold text-slate-900">
                  {format(new Date(lease.startDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">End Date</p>
                <p className="text-xl font-bold text-slate-900">
                  {format(new Date(lease.endDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Deposit</p>
                <p className="text-xl font-bold text-slate-900">
                  ${lease.depositAmount?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commercial-only sections */}
      {isCommercial && (
        <>
          {/* Rent Escalations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                Rent Escalations
              </CardTitle>
              <Dialog open={isEscalationDialogOpen} onOpenChange={setIsEscalationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Escalation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Rent Escalation</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddEscalation} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Increase Type</Label>
                      <Select
                        value={escalationForm.increaseType}
                        onValueChange={(value) => setEscalationForm({ ...escalationForm, increaseType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage Increase</SelectItem>
                          <SelectItem value="FIXED_AMOUNT">Fixed Amount Increase</SelectItem>
                          <SelectItem value="CPI">CPI Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Effective Date</Label>
                        <Input
                          type="date"
                          value={escalationForm.effectiveDate}
                          onChange={(e) => setEscalationForm({ ...escalationForm, effectiveDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {escalationForm.increaseType === "PERCENTAGE" ? "Increase %" : "Increase Amount ($)"}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={escalationForm.increaseValue}
                          onChange={(e) => {
                            const newRent = calculateNewRent();
                            setEscalationForm({
                              ...escalationForm,
                              increaseValue: e.target.value,
                              newMonthlyRent: newRent,
                            });
                          }}
                          placeholder={escalationForm.increaseType === "PERCENTAGE" ? "e.g., 3" : "e.g., 100"}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>New Monthly Rent ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={escalationForm.newMonthlyRent || calculateNewRent()}
                        onChange={(e) => setEscalationForm({ ...escalationForm, newMonthlyRent: e.target.value })}
                        required
                      />
                      <p className="text-xs text-slate-500">
                        Current rent: ${lease.monthlyRent.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        value={escalationForm.notes}
                        onChange={(e) => setEscalationForm({ ...escalationForm, notes: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsEscalationDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Escalation"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {lease.escalations.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No escalations scheduled</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>New Rent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lease.escalations.map((escalation) => {
                      const isPast = isBefore(new Date(escalation.effectiveDate), new Date());
                      return (
                        <TableRow key={escalation.id}>
                          <TableCell>
                            {format(new Date(escalation.effectiveDate), "MMM d, yyyy")}
                            {isPast && !escalation.applied && (
                              <Badge variant="outline" className="ml-2 text-orange-600 border-orange-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {escalation.increaseType}
                            {escalation.increaseValue && (
                              <span className="text-slate-500 ml-1">
                                ({escalation.increaseType === "PERCENTAGE" ? `${escalation.increaseValue}%` : `$${escalation.increaseValue}`})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${escalation.newMonthlyRent.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {escalation.applied ? (
                              <Badge className="bg-green-50 text-green-700">
                                <Check className="h-3 w-3 mr-1" />
                                Applied
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!escalation.applied && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => handleApplyEscalation(escalation.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleDeleteEscalation(escalation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Insurance Records */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Business Liability Insurance
              </CardTitle>
              <Dialog open={isInsuranceDialogOpen} onOpenChange={setIsInsuranceDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Insurance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Insurance Record</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddInsurance} className="space-y-4 mt-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                      <p className="font-medium">Required Beneficiary:</p>
                      <p>Himalayan Holdings Property LLC</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Insurance Type</Label>
                      <Select
                        value={insuranceForm.insuranceType}
                        onValueChange={(value) => setInsuranceForm({ ...insuranceForm, insuranceType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LIABILITY">General Liability</SelectItem>
                          <SelectItem value="PROPERTY">Property Insurance</SelectItem>
                          <SelectItem value="WORKERS_COMP">Workers Compensation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Insurance Carrier</Label>
                        <Input
                          value={insuranceForm.carrier}
                          onChange={(e) => setInsuranceForm({ ...insuranceForm, carrier: e.target.value })}
                          placeholder="e.g., State Farm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Policy Number</Label>
                        <Input
                          value={insuranceForm.policyNumber}
                          onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Coverage Amount ($)</Label>
                      <Input
                        type="number"
                        value={insuranceForm.coverageAmount}
                        onChange={(e) => setInsuranceForm({ ...insuranceForm, coverageAmount: e.target.value })}
                        placeholder="e.g., 1000000"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Effective Date</Label>
                        <Input
                          type="date"
                          value={insuranceForm.effectiveDate}
                          onChange={(e) => setInsuranceForm({ ...insuranceForm, effectiveDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiration Date</Label>
                        <Input
                          type="date"
                          value={insuranceForm.expirationDate}
                          onChange={(e) => setInsuranceForm({ ...insuranceForm, expirationDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Document URL (Certificate of Insurance)</Label>
                      <Input
                        type="url"
                        value={insuranceForm.documentUrl}
                        onChange={(e) => setInsuranceForm({ ...insuranceForm, documentUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsInsuranceDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Insurance"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {lease.insurance.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">No insurance records on file</p>
                  <p className="text-sm text-red-500 mt-2">
                    Commercial tenants must provide proof of liability insurance
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lease.insurance.map((ins) => {
                      const isExpiringSoon = isBefore(new Date(ins.expirationDate), addDays(new Date(), 30));
                      const isExpired = isBefore(new Date(ins.expirationDate), new Date());
                      return (
                        <TableRow key={ins.id}>
                          <TableCell>{ins.insuranceType}</TableCell>
                          <TableCell>{ins.carrier || "-"}</TableCell>
                          <TableCell>
                            {ins.coverageAmount ? `$${ins.coverageAmount.toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {format(new Date(ins.expirationDate), "MMM d, yyyy")}
                              {isExpired && (
                                <Badge className="bg-red-50 text-red-700">Expired</Badge>
                              )}
                              {!isExpired && isExpiringSoon && (
                                <Badge className="bg-orange-50 text-orange-700">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {ins.verified ? (
                              <Badge className="bg-green-50 text-green-700">
                                <Check className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-200">
                                Pending Review
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {ins.documentUrl && (
                                <a href={ins.documentUrl} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                              )}
                              {!ins.verified && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => handleVerifyInsurance(ins.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleDeleteInsurance(ins.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Lease Document */}
      {lease.documentUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lease Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={lease.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              View Lease Document
            </a>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {lease.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap">{lease.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
