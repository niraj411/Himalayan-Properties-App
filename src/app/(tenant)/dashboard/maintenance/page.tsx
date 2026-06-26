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
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Wrench, Loader2, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { TableSkeleton } from "@/components/ui/skeletons";

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
}

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/maintenance");
      if (!response.ok) throw new Error();
      setRequests(await response.json());
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Request submitted");
        setIsDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "",
          priority: "MEDIUM",
        });
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit request");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-primary" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-primary" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
          <p className="text-slate-500 mt-1">Submit and track maintenance requests</p>
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
          <p className="text-slate-500 mt-1">Submit and track maintenance requests</p>
        </div>
        <ErrorState message="We couldn't load this page." onRetry={fetchRequests} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
          <p className="text-slate-500 mt-1">Submit and track maintenance requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Maintenance Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Leaky faucet in bathroom"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No requests yet</h3>
            <p className="text-slate-500 text-center mb-4">
              Submit a request when you need maintenance help
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(request.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{request.title}</h3>
                        <p className="text-sm text-slate-500 mt-1">{request.description}</p>
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
                            request.status === "COMPLETED"
                              ? "bg-green-50 text-green-700"
                              : request.status === "IN_PROGRESS"
                              ? "bg-primary/10 text-primary"
                              : "bg-primary/10 text-primary"
                          }
                        >
                          {request.status === "IN_PROGRESS" ? "In Progress" : request.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                      {request.category && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{request.category}</span>
                      )}
                      <span>Submitted {format(new Date(request.createdAt), "MMM d, yyyy")}</span>
                      {request.completedAt && (
                        <span>
                          Completed {format(new Date(request.completedAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    {request.notes && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700">Admin Notes:</p>
                        <p className="text-sm text-slate-600 mt-1">{request.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
