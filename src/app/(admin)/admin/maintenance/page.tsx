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
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { Wrench, Loader2, MoreVertical, CheckCircle, Trash2, Clock, AlertTriangle, Plus, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: string;
  status: string;
  notes: string | null;
  contractor: string | null;
  repairCost: number | null;
  paymentMethod: string | null;
  paymentAccount: string | null;
  createdAt: string;
  completedAt: string | null;
  tenant: {
    user: { name: string; email: string };
  };
  unit: {
    unitNumber: string;
    property: { name: string };
  };
}

interface TenantOption {
  id: string;
  unitId: string | null;
  user: { name: string };
  unit: { unitNumber: string; property: { name: string } } | null;
}

const STATUS_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
] as const;

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [updateFormData, setUpdateFormData] = useState({
    status: "",
    priority: "",
    notes: "",
    contractor: "",
    repairCost: "",
    paymentMethod: "",
    paymentAccount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin "New Request" form
  const [createOpen, setCreateOpen] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [createFormData, setCreateFormData] = useState({
    tenantId: "",
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  });

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/maintenance");
      if (response.ok) {
        setRequests(await response.json());
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load maintenance requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openCreateDialog = async () => {
    setCreateFormData({ tenantId: "", title: "", description: "", category: "", priority: "MEDIUM" });
    setCreateOpen(true);
    if (tenants.length === 0) {
      try {
        const res = await fetch("/api/tenants");
        if (res.ok) setTenants(await res.json());
      } catch {
        toast.error("Failed to load tenants");
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = tenants.find((t) => t.id === createFormData.tenantId);
    if (!tenant) {
      toast.error("Select a tenant");
      return;
    }
    if (!tenant.unitId) {
      toast.error("That tenant is not assigned to a unit");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          unitId: tenant.unitId,
          title: createFormData.title,
          description: createFormData.description,
          category: createFormData.category || null,
          priority: createFormData.priority,
        }),
      });
      if (response.ok) {
        toast.success("Request created");
        setCreateOpen(false);
        fetchRequests();
      } else {
        toast.error("Failed to create request");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/maintenance/${selectedRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateFormData),
      });

      if (response.ok) {
        toast.success("Request updated");
        setSelectedRequest(null);
        fetchRequests();
      } else {
        toast.error("Failed to update request");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      const response = await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Request deleted");
        fetchRequests();
      } else {
        toast.error("Failed to delete request");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const openUpdateDialog = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setUpdateFormData({
      status: request.status,
      priority: request.priority,
      notes: request.notes || "",
      contractor: request.contractor || "",
      repairCost: request.repairCost != null ? String(request.repairCost) : "",
      paymentMethod: request.paymentMethod || "",
      paymentAccount: request.paymentAccount || "",
    });
  };

  const filteredRequests =
    statusFilter === "ALL"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  const statusCount = (key: string) =>
    key === "ALL" ? requests.length : requests.filter((r) => r.status === key).length;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "EMERGENCY":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
          <p className="text-slate-500 mt-1">Manage tenant maintenance requests</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-70">{statusCount(f.key)}</span>
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {statusFilter === "ALL" ? "No maintenance requests" : "No requests in this view"}
            </h3>
            <p className="text-slate-500 text-center">All caught up! No pending requests.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{request.title}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">{request.description}</div>
                      {request.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {request.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.unit.property.name} #{request.unit.unitNumber}
                    </TableCell>
                    <TableCell>
                      <div className="text-slate-900">{request.tenant.user.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(request.priority)}
                        <Badge
                          variant={request.priority === "EMERGENCY" ? "destructive" : "secondary"}
                          className={
                            request.priority === "EMERGENCY"
                              ? ""
                              : request.priority === "HIGH"
                              ? "bg-orange-50 text-orange-700"
                              : request.priority === "MEDIUM"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-slate-100 text-slate-600"
                          }
                        >
                          {request.priority}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={request.status === "COMPLETED" ? "default" : "secondary"}
                        className={
                          request.status === "OPEN"
                            ? "bg-blue-50 text-blue-700"
                            : request.status === "IN_PROGRESS"
                            ? "bg-purple-50 text-purple-700"
                            : request.status === "COMPLETED"
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }
                      >
                        {request.status === "IN_PROGRESS" ? "In Progress" : request.status}
                      </Badge>
                      {request.repairCost != null && (
                        <div className="flex items-center gap-0.5 text-xs text-slate-500 mt-1">
                          <DollarSign className="h-3 w-3" />
                          {request.repairCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          {request.contractor ? ` · ${request.contractor}` : ""}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openUpdateDialog(request)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(request.id)} className="text-red-600">
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

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Maintenance Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <form onSubmit={handleUpdate} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium">{selectedRequest.title}</p>
                <p className="text-sm text-slate-500 mt-1">{selectedRequest.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={updateFormData.status}
                    onValueChange={(value) => setUpdateFormData({ ...updateFormData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={updateFormData.priority}
                    onValueChange={(value) => setUpdateFormData({ ...updateFormData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractor">Contractor</Label>
                <Input
                  id="contractor"
                  value={updateFormData.contractor}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, contractor: e.target.value })}
                  placeholder="Who did the work (vendor / handyman)"
                />
              </div>

              {updateFormData.status === "COMPLETED" && (
                <div className="space-y-4 rounded-lg border border-green-100 bg-green-50/50 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="repairCost">Repair Cost ($)</Label>
                      <Input
                        id="repairCost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={updateFormData.repairCost}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, repairCost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Paid Via</Label>
                      <Select
                        value={updateFormData.paymentMethod || undefined}
                        onValueChange={(value) => setUpdateFormData({ ...updateFormData, paymentMethod: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VENMO">Venmo</SelectItem>
                          <SelectItem value="CHECK">Check</SelectItem>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentAccount">Account / Reference</Label>
                    <Input
                      id="paymentAccount"
                      value={updateFormData.paymentAccount}
                      onChange={(e) => setUpdateFormData({ ...updateFormData, paymentAccount: e.target.value })}
                      placeholder="Venmo handle, check #, etc."
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Entering a cost logs a PAID maintenance charge on the tenant&apos;s lease ledger.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={updateFormData.notes}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, notes: e.target.value })}
                  placeholder="Add notes about the work done..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update Request"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Maintenance Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="createTenant">Tenant / Unit</Label>
              <Select
                value={createFormData.tenantId || undefined}
                onValueChange={(value) => setCreateFormData({ ...createFormData, tenantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.user.name}
                      {t.unit ? ` — ${t.unit.property.name} #${t.unit.unitNumber}` : " — (no unit)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="createTitle">Title</Label>
              <Input
                id="createTitle"
                value={createFormData.title}
                onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                placeholder="e.g. Leaking kitchen faucet"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createDescription">Description</Label>
              <Textarea
                id="createDescription"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Describe the issue..."
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="createCategory">Category</Label>
                <Select
                  value={createFormData.category || undefined}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLUMBING">Plumbing</SelectItem>
                    <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="APPLIANCE">Appliance</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="createPriority">Priority</Label>
                <Select
                  value={createFormData.priority}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Request"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
