"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Building2, CreditCard, Mail, ExternalLink } from "lucide-react";

interface Settings {
  id: string;
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
  bankName: string | null;
  bankRoutingNumber: string | null;
  bankAccountNumber: string | null;
  checkMailingAddress: string | null;
  paymentInstructions: string | null;
  baselanePaymentLink: string | null;
  zillowUrl: string | null;
  emailNotificationsEnabled: boolean;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    bankName: "",
    bankRoutingNumber: "",
    bankAccountNumber: "",
    checkMailingAddress: "",
    paymentInstructions: "",
    baselanePaymentLink: "",
    zillowUrl: "",
    emailNotificationsEnabled: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data: Settings = await response.json();
          setFormData({
            companyName: data.companyName || "",
            companyEmail: data.companyEmail || "",
            companyPhone: data.companyPhone || "",
            companyAddress: data.companyAddress || "",
            bankName: data.bankName || "",
            bankRoutingNumber: data.bankRoutingNumber || "",
            bankAccountNumber: data.bankAccountNumber || "",
            checkMailingAddress: data.checkMailingAddress || "",
            paymentInstructions: data.paymentInstructions || "",
            baselanePaymentLink: data.baselanePaymentLink || "",
            zillowUrl: data.zillowUrl || "",
            emailNotificationsEnabled: data.emailNotificationsEnabled || false,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your property management settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle>Company Information</CardTitle>
            </div>
            <CardDescription>Your business details shown to tenants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Himalayan Properties"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Admin Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  placeholder="contact@himalayan.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone</Label>
                <Input
                  id="companyPhone"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Textarea
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                placeholder="123 Main St, City, State ZIP"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <CardTitle>Payment Information</CardTitle>
            </div>
            <CardDescription>
              Baselane link for online payments, bank details, and mailing address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baselanePaymentLink">
                Baselane Payment Link
              </Label>
              <div className="flex gap-2">
                <Input
                  id="baselanePaymentLink"
                  value={formData.baselanePaymentLink}
                  onChange={(e) => setFormData({ ...formData, baselanePaymentLink: e.target.value })}
                  placeholder="https://pay.baselane.com/..."
                />
                {formData.baselanePaymentLink && (
                  <a
                    href={formData.baselanePaymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Tenants will see a &quot;Pay via Baselane&quot; button linking here
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Bank of America"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankRoutingNumber">Routing Number</Label>
                <Input
                  id="bankRoutingNumber"
                  value={formData.bankRoutingNumber}
                  onChange={(e) => setFormData({ ...formData, bankRoutingNumber: e.target.value })}
                  placeholder="123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="checkMailingAddress">Check Mailing Address</Label>
              <Textarea
                id="checkMailingAddress"
                value={formData.checkMailingAddress}
                onChange={(e) => setFormData({ ...formData, checkMailingAddress: e.target.value })}
                placeholder="PO Box 123, City, State ZIP"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentInstructions">Additional Payment Instructions</Label>
              <Textarea
                id="paymentInstructions"
                value={formData.paymentInstructions}
                onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                placeholder="Include your unit number in the memo..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Applications */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-purple-600" />
              <CardTitle>Applications</CardTitle>
            </div>
            <CardDescription>Zillow link for residential rental applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zillowUrl">Zillow Listing / Application URL</Label>
              <div className="flex gap-2">
                <Input
                  id="zillowUrl"
                  value={formData.zillowUrl}
                  onChange={(e) => setFormData({ ...formData, zillowUrl: e.target.value })}
                  placeholder="https://www.zillow.com/rental-manager/..."
                />
                {formData.zillowUrl && (
                  <a
                    href={formData.zillowUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Residential applicants will be directed here from the application page
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <CardDescription>
              Automated emails for payments, maintenance updates, and lease events.
              Configure SMTP credentials via environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emailNotificationsEnabled"
                checked={formData.emailNotificationsEnabled}
                onChange={(e) => setFormData({ ...formData, emailNotificationsEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="emailNotificationsEnabled" className="cursor-pointer">
                Enable automatic email notifications to tenants
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
