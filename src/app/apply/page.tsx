"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Building2, Loader2, CheckCircle, Home, Store, ExternalLink, FileText, AlertCircle } from "lucide-react";

interface Property {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
}

export default function ApplyPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationType, setApplicationType] = useState<"RESIDENTIAL" | "COMMERCIAL" | null>(null);
  const [formData, setFormData] = useState({
    propertyId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentAddress: "",
    employerName: "",
    employerPhone: "",
    jobTitle: "",
    monthlyIncome: "",
    moveInDate: "",
    numberOfOccupants: "",
    pets: "",
    references: "",
    additionalNotes: "",
    // Commercial fields
    businessName: "",
    taxReturnsUrl: "",
    bankStatementsUrl: "",
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/properties");
        if (response.ok) {
          setProperties(await response.json());
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };

    fetchProperties();
  }, []);

  // Update application type when property changes
  useEffect(() => {
    if (formData.propertyId && formData.propertyId !== "general") {
      const selectedProperty = properties.find(p => p.id === formData.propertyId);
      if (selectedProperty) {
        setApplicationType(selectedProperty.type as "RESIDENTIAL" | "COMMERCIAL");
      }
    } else if (formData.propertyId === "general") {
      setApplicationType(null);
    }
  }, [formData.propertyId, properties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          propertyId: formData.propertyId && formData.propertyId !== "general" ? formData.propertyId : null,
          applicationType: applicationType || "RESIDENTIAL",
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        toast.error("Failed to submit application");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Application Submitted</h2>
            <p className="text-slate-500 text-center text-sm mb-6">
              Thank you for your interest. We&apos;ll review your application and contact you soon.
            </p>
            <Link href="/">
              <Button variant="outline" size="sm">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-slate-900 text-sm">Himalayan</h1>
              <p className="text-xs text-slate-500">Holdings</p>
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Apply for a Property</h2>
          <p className="text-slate-500 text-sm mt-1">
            Select a property to get started
          </p>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Application Form</CardTitle>
            <CardDescription className="text-sm">Fields marked with * are required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label htmlFor="propertyId" className="text-sm">Property of Interest *</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        General Inquiry
                      </span>
                    </SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <span className="flex items-center gap-2">
                          {property.type === "COMMERCIAL" ? (
                            <Store className="h-4 w-4 text-purple-500" />
                          ) : (
                            <Home className="h-4 w-4 text-blue-500" />
                          )}
                          {property.name} - {property.city}
                          <span className="text-xs text-slate-400">
                            ({property.type === "COMMERCIAL" ? "Commercial" : "Residential"})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Residential Notice */}
              {applicationType === "RESIDENTIAL" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900 text-sm">Residential Applications</p>
                      <p className="text-blue-700 text-sm mt-1">
                        For residential properties, we use Zillow for applications. Please apply through Zillow and reference this property in your application.
                      </p>
                      <a
                        href="https://www.zillow.com/rental-manager/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm mt-2"
                      >
                        Apply on Zillow
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Commercial Application Form */}
              {applicationType === "COMMERCIAL" && (
                <>
                  {/* Commercial Notice */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Store className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-purple-900 text-sm">Commercial Application</p>
                        <p className="text-purple-700 text-sm mt-1">
                          Commercial applications require 2 years of corporate tax returns and 3 months of bank statements.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="h-10"
                      required
                    />
                  </div>

                  {/* Personal Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm">Contact First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm">Contact Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentAddress" className="text-sm">Business Address</Label>
                    <Input
                      id="currentAddress"
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                      placeholder="Street, City, State, ZIP"
                      className="h-10"
                    />
                  </div>

                  {/* Required Documents */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <h3 className="font-medium text-slate-900 text-sm">Required Documents</h3>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-amber-800 text-xs">
                          Upload your documents to a secure file sharing service (Google Drive, Dropbox, etc.) and paste the share links below.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="taxReturnsUrl" className="text-sm">
                          2 Years Corporate Tax Returns *
                        </Label>
                        <Input
                          id="taxReturnsUrl"
                          type="url"
                          value={formData.taxReturnsUrl}
                          onChange={(e) => setFormData({ ...formData, taxReturnsUrl: e.target.value })}
                          placeholder="https://drive.google.com/..."
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankStatementsUrl" className="text-sm">
                          3 Months Bank Statements *
                        </Label>
                        <Input
                          id="bankStatementsUrl"
                          type="url"
                          value={formData.bankStatementsUrl}
                          onChange={(e) => setFormData({ ...formData, bankStatementsUrl: e.target.value })}
                          placeholder="https://drive.google.com/..."
                          className="h-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desired Move-in */}
                  <div className="space-y-2">
                    <Label htmlFor="moveInDate" className="text-sm">Desired Move-in Date</Label>
                    <Input
                      id="moveInDate"
                      type="date"
                      value={formData.moveInDate}
                      onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes" className="text-sm">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="Tell us about your business and space requirements..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </>
              )}

              {/* General Inquiry Form */}
              {(applicationType === null && formData.propertyId === "general") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes" className="text-sm">What are you looking for?</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="Tell us about your needs..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Inquiry"
                    )}
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-4">
          Already a tenant?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
