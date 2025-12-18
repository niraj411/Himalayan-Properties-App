"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
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
import {
  ArrowLeft,
  Plus,
  Building2,
  Home,
  MapPin,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  User,
  DollarSign,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Unit {
  id: string;
  unitNumber: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  rent: number;
  status: string;
  tenant: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  } | null;
  leases: {
    id: string;
    status: string;
    endDate: string;
  }[];
}

interface Property {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string | null;
  units: Unit[];
}

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitFormData, setUnitFormData] = useState({
    unitNumber: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    rent: "",
    status: "VACANT",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProperty(data);
      } else {
        router.push("/admin/properties");
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Failed to load property");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingUnit ? `/api/units/${editingUnit.id}` : "/api/units";
      const method = editingUnit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id,
          ...unitFormData,
          bedrooms: unitFormData.bedrooms ? parseInt(unitFormData.bedrooms) : null,
          bathrooms: unitFormData.bathrooms
            ? parseFloat(unitFormData.bathrooms)
            : null,
          sqft: unitFormData.sqft ? parseInt(unitFormData.sqft) : null,
          rent: parseFloat(unitFormData.rent),
        }),
      });

      if (response.ok) {
        toast.success(editingUnit ? "Unit updated" : "Unit created");
        setIsUnitDialogOpen(false);
        setEditingUnit(null);
        setUnitFormData({
          unitNumber: "",
          bedrooms: "",
          bathrooms: "",
          sqft: "",
          rent: "",
          status: "VACANT",
        });
        fetchProperty();
      } else {
        toast.error("Failed to save unit");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitFormData({
      unitNumber: unit.unitNumber,
      bedrooms: unit.bedrooms?.toString() || "",
      bathrooms: unit.bathrooms?.toString() || "",
      sqft: unit.sqft?.toString() || "",
      rent: unit.rent.toString(),
      status: unit.status,
    });
    setIsUnitDialogOpen(true);
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;

    try {
      const response = await fetch(`/api/units/${unitId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Unit deleted");
        fetchProperty();
      } else {
        toast.error("Failed to delete unit");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const openNewUnitDialog = () => {
    setEditingUnit(null);
    setUnitFormData({
      unitNumber: "",
      bedrooms: "",
      bathrooms: "",
      sqft: "",
      rent: "",
      status: "VACANT",
    });
    setIsUnitDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const vacantUnits = property.units.filter((u) => u.status === "VACANT").length;
  const occupiedUnits = property.units.length - vacantUnits;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/properties"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Properties
      </Link>

      {/* Property Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
              property.type === "COMMERCIAL" ? "bg-purple-50" : "bg-blue-50"
            }`}
          >
            {property.type === "COMMERCIAL" ? (
              <Building2 className="h-7 w-7 text-purple-600" />
            ) : (
              <Home className="h-7 w-7 text-blue-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {property.name}
              </h1>
              <Badge
                variant="secondary"
                className={
                  property.type === "COMMERCIAL"
                    ? "bg-purple-50 text-purple-700"
                    : "bg-blue-50 text-blue-700"
                }
              >
                {property.type}
              </Badge>
            </div>
            <div className="flex items-center text-slate-500 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {property.address}, {property.city}, {property.state} {property.zip}
            </div>
            {property.description && (
              <p className="text-slate-600 mt-2 max-w-2xl">
                {property.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-slate-900">
              {property.units.length}
            </p>
            <p className="text-sm text-slate-500">Total Units</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{occupiedUnits}</p>
            <p className="text-sm text-slate-500">Occupied</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-orange-600">{vacantUnits}</p>
            <p className="text-sm text-slate-500">Vacant</p>
          </CardContent>
        </Card>
      </div>

      {/* Units Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Units</CardTitle>
          <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openNewUnitDialog}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUnit ? "Edit Unit" : "Add New Unit"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUnitSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="unitNumber">Unit Number</Label>
                    <Input
                      id="unitNumber"
                      value={unitFormData.unitNumber}
                      onChange={(e) =>
                        setUnitFormData({
                          ...unitFormData,
                          unitNumber: e.target.value,
                        })
                      }
                      placeholder="e.g., 101"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rent">Monthly Rent ($)</Label>
                    <Input
                      id="rent"
                      type="number"
                      step="0.01"
                      value={unitFormData.rent}
                      onChange={(e) =>
                        setUnitFormData({ ...unitFormData, rent: e.target.value })
                      }
                      placeholder="1500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Beds</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={unitFormData.bedrooms}
                      onChange={(e) =>
                        setUnitFormData({
                          ...unitFormData,
                          bedrooms: e.target.value,
                        })
                      }
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Baths</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      step="0.5"
                      value={unitFormData.bathrooms}
                      onChange={(e) =>
                        setUnitFormData({
                          ...unitFormData,
                          bathrooms: e.target.value,
                        })
                      }
                      placeholder="1.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sqft">Sq Ft</Label>
                    <Input
                      id="sqft"
                      type="number"
                      value={unitFormData.sqft}
                      onChange={(e) =>
                        setUnitFormData({ ...unitFormData, sqft: e.target.value })
                      }
                      placeholder="950"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={unitFormData.status}
                    onValueChange={(value) =>
                      setUnitFormData({ ...unitFormData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VACANT">Vacant</SelectItem>
                      <SelectItem value="OCCUPIED">Occupied</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUnitDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingUnit ? (
                      "Update Unit"
                    ) : (
                      "Create Unit"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {property.units.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No units yet. Add your first unit.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {property.units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">
                      #{unit.unitNumber}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {[
                        unit.bedrooms && `${unit.bedrooms} bed`,
                        unit.bathrooms && `${unit.bathrooms} bath`,
                        unit.sqft && `${unit.sqft} sqft`,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        {unit.rent.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          unit.status === "VACANT"
                            ? "secondary"
                            : unit.status === "OCCUPIED"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          unit.status === "VACANT"
                            ? "bg-orange-50 text-orange-700"
                            : unit.status === "OCCUPIED"
                            ? "bg-green-50 text-green-700"
                            : ""
                        }
                      >
                        {unit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {unit.tenant ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>{unit.tenant.user.name}</span>
                        </div>
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
                          <DropdownMenuItem onClick={() => handleEditUnit(unit)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUnit(unit.id)}
                            className="text-red-600"
                          >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
