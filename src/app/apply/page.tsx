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
import { Building2, Loader2, CheckCircle } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
            <p className="text-slate-500 text-center mb-6">
              Thank you for your interest. We&apos;ll review your application and get back to you
              soon.
            </p>
            <Link href="/">
              <Button variant="outline">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-slate-900">Himalayan</h1>
              <p className="text-xs text-slate-500">Properties</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-slate-900">Rental Application</h2>
          <p className="text-slate-500 mt-2">
            Complete the form below to apply for one of our properties
          </p>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>All fields marked with * are required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property of Interest</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General Application</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name} - {property.city}, {property.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Personal Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAddress">Current Address</Label>
                <Textarea
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                  placeholder="Street, City, State, ZIP"
                  rows={2}
                />
              </div>

              {/* Employment */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-slate-900 mb-4">Employment Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employerName">Employer Name</Label>
                    <Input
                      id="employerName"
                      value={formData.employerName}
                      onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employerPhone">Employer Phone</Label>
                    <Input
                      id="employerPhone"
                      type="tel"
                      value={formData.employerPhone}
                      onChange={(e) => setFormData({ ...formData, employerPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-slate-900 mb-4">Additional Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="moveInDate">Desired Move-in Date</Label>
                    <Input
                      id="moveInDate"
                      type="date"
                      value={formData.moveInDate}
                      onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfOccupants">Number of Occupants</Label>
                    <Input
                      id="numberOfOccupants"
                      type="number"
                      min="1"
                      value={formData.numberOfOccupants}
                      onChange={(e) =>
                        setFormData({ ...formData, numberOfOccupants: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="pets">Pets</Label>
                  <Input
                    id="pets"
                    value={formData.pets}
                    onChange={(e) => setFormData({ ...formData, pets: e.target.value })}
                    placeholder="None, or describe type/breed"
                  />
                </div>
              </div>

              {/* References */}
              <div className="space-y-2">
                <Label htmlFor="references">References</Label>
                <Textarea
                  id="references"
                  value={formData.references}
                  onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                  placeholder="Previous landlord contact, personal references, etc."
                  rows={3}
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  placeholder="Anything else you'd like us to know..."
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700"
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
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already a tenant?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
