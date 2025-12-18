"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lease {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number | null;
  documentUrl: string | null;
  status: string;
  notes: string | null;
  tenant: {
    id: string;
    user: { name: string; email: string };
  };
  unit: {
    id: string;
    unitNumber: string;
    property: { name: string };
  };
}

interface Tenant {
  id: string;
  user: { name: string };
  unit: { id: string; unitNumber: string; property: { name: string } } | null;
}

interface Unit {
  id: string;
  unitNumber: string;
  rent: number;
  property: { name: string };
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [formData, setFormData] = useState({
    tenantId: "",
    unitId: "",
    startDate: "",
    endDate: "",
    monthlyRent: "",
    depositAmount: "",
    documentUrl: "",
    notes: "",
    status: "ACTIVE",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [leasesRes, tenantsRes, unitsRes] = await Promise.all([
        fetch("/api/leases"),
        fetch("/api/tenants"),
        fetch("/api/units"),
      ]);

      if (leasesRes.ok) setLeases(await leasesRes.json());
      if (tenantsRes.ok) setTenants(await tenantsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingLease ? `/api/leases/${editingLease.id}` : "/api/leases";
      const method = editingLease ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingLease ? "Lease updated" : "Lease created");
        setIsDialogOpen(false);
        setEditingLease(null);
        resetForm();
        fetchData();
      } else {
        toast.error("Failed to save lease");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tenantId: "",
      unitId: "",
      startDate: "",
      endDate: "",
      monthlyRent: "",
      depositAmount: "",
      documentUrl: "",
      notes: "",
      status: "ACTIVE",
    });
  };

  const handleEdit = (lease: Lease) => {
    setEditingLease(lease);
    setFormData({
      tenantId: lease.tenant.id,
      unitId: lease.unit.id,
      startDate: format(new Date(lease.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(lease.endDate), "yyyy-MM-dd"),
      monthlyRent: lease.monthlyRent.toString(),
      depositAmount: lease.depositAmount?.toString() || "",
      documentUrl: lease.documentUrl || "",
      notes: lease.notes || "",
      status: lease.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lease?")) return;

    try {
      const response = await fetch(`/api/leases/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Lease deleted");
        fetchData();
      } else {
        toast.error("Failed to delete lease");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const openNewDialog = () => {
    setEditingLease(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleUnitChange = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    setFormData({
      ...formData,
      unitId,
      monthlyRent: unit?.rent.toString() || formData.monthlyRent,
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leases</h1>
          <p className="text-slate-500 mt-1">Manage lease agreements</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Lease
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingLease ? "Edit Lease" : "Create New Lease"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tenantId">Tenant</Label>
                  <Select
                    value={formData.tenantId}
                    onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                    disabled={!!editingLease}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitId">Unit</Label>
                  <Select value={formData.unitId} onValueChange={handleUnitChange} disabled={!!editingLease}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.property.name} - #{unit.unitNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    step="0.01"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Security Deposit ($)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                  />
                </div>
              </div>
              {editingLease && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="TERMINATED">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="documentUrl">Document URL (Optional)</Label>
                <Input
                  id="documentUrl"
                  type="url"
                  value={formData.documentUrl}
                  onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingLease ? (
                    "Update Lease"
                  ) : (
                    "Create Lease"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {leases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No leases yet</h3>
            <p className="text-slate-500 text-center mb-4">Create your first lease agreement</p>
            <Button onClick={openNewDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Lease
            </Button>
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
                  <TableHead>Period</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => {
                  const isExpiringSoon =
                    lease.status === "ACTIVE" &&
                    isBefore(new Date(lease.endDate), addDays(new Date(), 60));
                  const isExpired =
                    lease.status === "ACTIVE" && isBefore(new Date(lease.endDate), new Date());

                  return (
                    <TableRow key={lease.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{lease.tenant.user.name}</div>
                        <div className="text-sm text-slate-500">{lease.tenant.user.email}</div>
                      </TableCell>
                      <TableCell>
                        {lease.unit.property.name} #{lease.unit.unitNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>
                            {format(new Date(lease.startDate), "MMM d, yyyy")} -{" "}
                            {format(new Date(lease.endDate), "MMM d, yyyy")}
                          </span>
                        </div>
                        {(isExpiringSoon || isExpired) && (
                          <div className="flex items-center gap-1 text-orange-600 text-sm mt-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {isExpired ? "Expired" : "Expiring soon"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                          {lease.monthlyRent.toLocaleString()}/mo
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={lease.status === "ACTIVE" ? "default" : "secondary"}
                          className={
                            lease.status === "ACTIVE"
                              ? "bg-green-50 text-green-700"
                              : lease.status === "EXPIRED"
                              ? "bg-orange-50 text-orange-700"
                              : "bg-slate-100 text-slate-600"
                          }
                        >
                          {lease.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lease.documentUrl ? (
                          <a
                            href={lease.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(lease)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(lease.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
