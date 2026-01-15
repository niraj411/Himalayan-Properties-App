"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, isBefore, addDays } from "date-fns";
import {
  Shield,
  Plus,
  Loader2,
  Check,
  AlertTriangle,
  ExternalLink,
  Upload,
} from "lucide-react";

interface Insurance {
  id: string;
  insuranceType: string;
  carrier: string | null;
  policyNumber: string | null;
  coverageAmount: number | null;
  effectiveDate: Date;
  expirationDate: Date;
  documentUrl: string | null;
  beneficiaryName: string;
  verified: boolean;
}

interface InsuranceUploadSectionProps {
  leaseId: string;
  insurance: Insurance[];
}

export function InsuranceUploadSection({ leaseId, insurance }: InsuranceUploadSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    insuranceType: "LIABILITY",
    carrier: "",
    policyNumber: "",
    coverageAmount: "",
    effectiveDate: "",
    expirationDate: "",
    documentUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId,
          ...formData,
        }),
      });

      if (response.ok) {
        toast.success("Insurance submitted for review");
        setIsDialogOpen(false);
        setFormData({
          insuranceType: "LIABILITY",
          carrier: "",
          policyNumber: "",
          coverageAmount: "",
          effectiveDate: "",
          expirationDate: "",
          documentUrl: "",
        });
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        toast.error("Failed to submit insurance");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if any insurance is expiring or expired
  const hasExpiredInsurance = insurance.some((ins) =>
    isBefore(new Date(ins.expirationDate), new Date())
  );
  const hasExpiringInsurance = insurance.some(
    (ins) =>
      !isBefore(new Date(ins.expirationDate), new Date()) &&
      isBefore(new Date(ins.expirationDate), addDays(new Date(), 30))
  );
  const hasValidInsurance = insurance.some(
    (ins) =>
      ins.verified && !isBefore(new Date(ins.expirationDate), new Date())
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Business Liability Insurance
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              Upload Insurance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Insurance Certificate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p className="font-medium">Required Beneficiary:</p>
                <p className="font-bold">Himalayan Holdings Property LLC</p>
                <p className="text-xs mt-1 text-blue-600">
                  Your insurance certificate must list this entity as an additional insured.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Insurance Type</Label>
                <Select
                  value={formData.insuranceType}
                  onValueChange={(value) => setFormData({ ...formData, insuranceType: value })}
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
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    placeholder="e.g., State Farm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Coverage Amount ($)</Label>
                <Input
                  type="number"
                  value={formData.coverageAmount}
                  onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })}
                  placeholder="e.g., 1000000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Policy Effective Date</Label>
                  <Input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Policy Expiration Date</Label>
                  <Input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certificate Document URL</Label>
                <Input
                  type="url"
                  value={formData.documentUrl}
                  onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />
                <p className="text-xs text-slate-500">
                  Upload your certificate to a file sharing service and paste the link here
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Status Alert */}
        {!hasValidInsurance && (
          <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Insurance Required</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Commercial tenants must maintain valid business liability insurance with
              Himalayan Holdings Property LLC listed as an additional insured.
            </p>
          </div>
        )}

        {hasExpiredInsurance && (
          <div className="mb-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">Insurance Expired</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Please upload a new certificate of insurance immediately.
            </p>
          </div>
        )}

        {hasExpiringInsurance && !hasExpiredInsurance && (
          <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">Insurance Expiring Soon</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Your insurance policy is expiring within 30 days. Please upload a renewed certificate.
            </p>
          </div>
        )}

        {/* Insurance Records */}
        {insurance.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">No insurance records on file</p>
            <p className="text-sm text-slate-400 mt-1">
              Click &quot;Upload Insurance&quot; to submit your certificate
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insurance.map((ins) => {
              const isExpired = isBefore(new Date(ins.expirationDate), new Date());
              const isExpiring = !isExpired && isBefore(new Date(ins.expirationDate), addDays(new Date(), 30));

              return (
                <div
                  key={ins.id}
                  className={`p-4 border rounded-lg ${
                    isExpired
                      ? "border-red-200 bg-red-50"
                      : isExpiring
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{ins.insuranceType}</span>
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
                        {isExpired && (
                          <Badge className="bg-red-100 text-red-700">Expired</Badge>
                        )}
                        {isExpiring && !isExpired && (
                          <Badge className="bg-amber-100 text-amber-700">Expiring Soon</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {ins.carrier} - Policy #{ins.policyNumber}
                      </p>
                      <p className="text-sm text-slate-500">
                        Coverage: ${ins.coverageAmount?.toLocaleString() || "N/A"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Valid: {format(new Date(ins.effectiveDate), "MMM d, yyyy")} -{" "}
                        {format(new Date(ins.expirationDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    {ins.documentUrl && (
                      <a
                        href={ins.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
