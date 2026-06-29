"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Building2, Loader2, CheckCircle, Home, Store, ExternalLink, FileText, AlertCircle, Languages } from "lucide-react";

interface Property {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  zillowUrl: string | null;
}

function ApplyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEs = searchParams.get("lang") === "es";

  const toggleLanguage = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (isEs) {
      newParams.delete("lang");
    } else {
      newParams.set("lang", "es");
    }
    router.push(`/apply?${newParams.toString()}`);
  };

  const initialPropertyId = searchParams.get("propertyId") || "";

  const [properties, setProperties] = useState<Property[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationType, setApplicationType] = useState<"RESIDENTIAL" | "COMMERCIAL" | null>(null);
  const [zillowUrl, setZillowUrl] = useState<string>("https://www.zillow.com/rental-manager/");
  const [formData, setFormData] = useState({
    propertyId: initialPropertyId,
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
    businessName: "",
    taxReturnsUrl: "",
    bankStatementsUrl: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/apply-context");
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties ?? []);
          if (data.zillowUrl) setZillowUrl(data.zillowUrl);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (formData.propertyId && formData.propertyId !== "general") {
      const selectedProperty = properties.find(p => p.id === formData.propertyId);
      if (selectedProperty) {
        setApplicationType(selectedProperty.type as "RESIDENTIAL" | "COMMERCIAL");
        if (selectedProperty.zillowUrl) setZillowUrl(selectedProperty.zillowUrl);
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

      if (response.ok && !response.redirected && response.status === 201) {
        setIsSubmitted(true);
      } else {
        toast.error(isEs ? "Error al enviar la solicitud" : "Failed to submit application");
      }
    } catch {
      toast.error(isEs ? "Algo salió mal" : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Translations
  const t = {
    title: isEs ? "Himalayan" : "Himalayan",
    subtitle: isEs ? "Propiedades" : "Properties",
    applyForProp: isEs ? "Aplicar para una Propiedad" : "Apply for a Property",
    selectProp: isEs ? "Seleccione una propiedad para comenzar" : "Select a property to get started",
    formTitle: isEs ? "Formulario de Solicitud" : "Application Form",
    formDesc: isEs ? "Los campos marcados con * son obligatorios" : "Fields marked with * are required",
    propOfInterest: isEs ? "Propiedad de Interés *" : "Property of Interest *",
    selectPlaceholder: isEs ? "Seleccione una propiedad" : "Select a property",
    generalInquiry: isEs ? "Consulta General" : "General Inquiry",
    commercial: isEs ? "Comercial" : "Commercial",
    residential: isEs ? "Residencial" : "Residential",
    resApp: isEs ? "Solicitudes Residenciales" : "Residential Applications",
    resAppDesc: isEs 
      ? "Para propiedades residenciales, usamos Zillow para las solicitudes. Aplique a través de Zillow y mencione esta propiedad en su solicitud."
      : "For residential properties, we use Zillow for applications. Please apply through Zillow and reference this property in your application.",
    applyZillow: isEs ? "Aplicar en Zillow" : "Apply on Zillow",
    comApp: isEs ? "Solicitud Comercial" : "Commercial Application",
    comAppDesc: isEs 
      ? "Las solicitudes comerciales requieren 2 años de declaraciones de impuestos corporativas y 3 meses de estados de cuenta bancarios."
      : "Commercial applications require 2 years of corporate tax returns and 3 months of bank statements.",
    businessName: isEs ? "Nombre del Negocio *" : "Business Name *",
    firstName: isEs ? "Nombre *" : "First Name *",
    contactFirstName: isEs ? "Nombre del Contacto *" : "Contact First Name *",
    lastName: isEs ? "Apellido *" : "Last Name *",
    contactLastName: isEs ? "Apellido del Contacto *" : "Contact Last Name *",
    email: isEs ? "Correo Electrónico *" : "Email *",
    phone: isEs ? "Teléfono *" : "Phone *",
    businessAddress: isEs ? "Dirección del Negocio" : "Business Address",
    addressPlaceholder: isEs ? "Calle, Ciudad, Estado, Código Postal" : "Street, City, State, ZIP",
    reqDocs: isEs ? "Documentos Requeridos" : "Required Documents",
    reqDocsDesc: isEs 
      ? "Suba sus documentos a un servicio seguro (Google Drive, Dropbox, etc.) y pegue los enlaces aquí."
      : "Upload your documents to a secure file sharing service (Google Drive, Dropbox, etc.) and paste the share links below.",
    taxReturns: isEs ? "Declaraciones de Impuestos (2 años) *" : "2 Years Corporate Tax Returns *",
    bankStatements: isEs ? "Estados de Cuenta (3 meses) *" : "3 Months Bank Statements *",
    moveInDate: isEs ? "Fecha Deseada de Mudanza" : "Desired Move-in Date",
    additionalNotes: isEs ? "Notas Adicionales" : "Additional Notes",
    notesComPlaceholder: isEs ? "Cuéntenos sobre su negocio..." : "Tell us about your business and space requirements...",
    whatLookingFor: isEs ? "¿Qué está buscando?" : "What are you looking for?",
    notesGenPlaceholder: isEs ? "Cuéntenos sobre sus necesidades..." : "Tell us about your needs...",
    submitApp: isEs ? "Enviar Solicitud" : "Submit Application",
    submitInquiry: isEs ? "Enviar Consulta" : "Submit Inquiry",
    submitting: isEs ? "Enviando..." : "Submitting...",
    submittedTitle: isEs ? "Solicitud Enviada" : "Application Submitted",
    submittedDesc: isEs 
      ? "Gracias por su interés. Revisaremos su solicitud y nos comunicaremos con usted pronto."
      : "Thank you for your interest. We'll review your application and contact you soon.",
    returnHome: isEs ? "Volver al Inicio" : "Return Home",
    alreadyTenant: isEs ? "¿Ya es inquilino?" : "Already a tenant?",
    signInHere: isEs ? "Inicie sesión aquí" : "Sign in here"
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
        {/* Language Toggle */}
        <div className="absolute top-6 right-6">
          <Button variant="outline" size="sm" onClick={toggleLanguage} className="rounded-xl">
            <Languages className="w-4 h-4 mr-2" />
            {isEs ? "English" : "Español"}
          </Button>
        </div>

        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t.submittedTitle}</h2>
            <p className="text-slate-500 text-center text-sm mb-6">
              {t.submittedDesc}
            </p>
            <Link href={isEs ? "/?lang=es" : "/"}>
              <Button variant="outline" size="sm">{t.returnHome}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 relative">
      {/* Language Toggle */}
      <div className="absolute top-6 right-6">
        <Button variant="outline" size="sm" onClick={toggleLanguage} className="rounded-xl bg-white shadow-sm border-slate-200 text-slate-700 hover:text-slate-900">
          <Languages className="w-4 h-4 mr-2" />
          {isEs ? "English" : "Español"}
        </Button>
      </div>

      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href={isEs ? "/?lang=es" : "/"} className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-slate-900 text-sm">{t.title}</h1>
              <p className="text-xs text-slate-500">{t.subtitle}</p>
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">{t.applyForProp}</h2>
          <p className="text-slate-500 text-sm mt-1">
            {t.selectProp}
          </p>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t.formTitle}</CardTitle>
            <CardDescription className="text-sm">{t.formDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label htmlFor="propertyId" className="text-sm">{t.propOfInterest}</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {t.generalInquiry}
                      </span>
                    </SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <span className="flex items-center gap-2">
                          {property.type === "COMMERCIAL" ? (
                            <Store className="h-4 w-4 text-primary" />
                          ) : (
                            <Home className="h-4 w-4 text-primary" />
                          )}
                          {property.name} - {property.city}
                          <span className="text-xs text-slate-400">
                            ({property.type === "COMMERCIAL" ? t.commercial : t.residential})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Residential Notice */}
              {applicationType === "RESIDENTIAL" && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-primary text-sm">{t.resApp}</p>
                      <p className="text-primary text-sm mt-1">
                        {t.resAppDesc}
                      </p>
                      <a
                        href={zillowUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary font-medium text-sm mt-2"
                      >
                        {t.applyZillow}
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
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Store className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-primary text-sm">{t.comApp}</p>
                        <p className="text-primary text-sm mt-1">
                          {t.comAppDesc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm">{t.businessName}</Label>
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
                      <Label htmlFor="firstName" className="text-sm">{t.contactFirstName}</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm">{t.contactLastName}</Label>
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
                      <Label htmlFor="email" className="text-sm">{t.email}</Label>
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
                      <Label htmlFor="phone" className="text-sm">{t.phone}</Label>
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
                    <Label htmlFor="currentAddress" className="text-sm">{t.businessAddress}</Label>
                    <Input
                      id="currentAddress"
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                      placeholder={t.addressPlaceholder}
                      className="h-10"
                    />
                  </div>

                  {/* Required Documents */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <h3 className="font-medium text-slate-900 text-sm">{t.reqDocs}</h3>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-amber-800 text-xs">
                          {t.reqDocsDesc}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="taxReturnsUrl" className="text-sm">
                          {t.taxReturns}
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
                          {t.bankStatements}
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
                    <Label htmlFor="moveInDate" className="text-sm">{t.moveInDate}</Label>
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
                    <Label htmlFor="additionalNotes" className="text-sm">{t.additionalNotes}</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder={t.notesComPlaceholder}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      t.submitApp
                    )}
                  </Button>
                </>
              )}

              {/* General Inquiry Form */}
              {(applicationType === null && formData.propertyId === "general") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm">{t.firstName}</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm">{t.lastName}</Label>
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
                      <Label htmlFor="email" className="text-sm">{t.email}</Label>
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
                      <Label htmlFor="phone" className="text-sm">{t.phone}</Label>
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
                    <Label htmlFor="additionalNotes" className="text-sm">{t.whatLookingFor}</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder={t.notesGenPlaceholder}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      t.submitInquiry
                    )}
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-4">
          {t.alreadyTenant}{" "}
          <Link href="/login" className="text-primary hover:text-primary font-medium">
            {t.signInHere}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ApplyPageContent />
    </Suspense>
  );
}
