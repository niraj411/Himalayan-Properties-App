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
import { toast } from "sonner";
import { format } from "date-fns";
import { Wrench, Loader2, MoreVertical, CheckCircle, Trash2, Clock, AlertTriangle } from "lucide-react";
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

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [updateFormData, setUpdateFormData] = useState({
    status: "",
    priority: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    });
  };

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
        <p className="text-slate-500 mt-1">Manage tenant maintenance requests</p>
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No maintenance requests</h3>
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
                {requests.map((request) => (
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
    </div>
  );
}
