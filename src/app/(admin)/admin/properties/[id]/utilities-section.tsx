"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Plug, Pencil, Trash2 } from "lucide-react";
import { UTILITY_TYPES, utilityTypeLabel } from "@/lib/utilities";

interface Utility {
  id: string;
  propertyId: string;
  unitId: string | null;
  type: string;
  providerName: string;
  phone: string | null;
  website: string | null;
  accountNumber: string | null;
  monthlyCost: number | null;
  dueDay: number | null;
  tenantNotes: string | null;
  internalNotes: string | null;
  tenantVisible: boolean;
  sortOrder: number;
}

const WHOLE_PROPERTY = "__property__";

const emptyForm = {
  type: "TRASH",
  providerName: "",
  scope: WHOLE_PROPERTY,
  phone: "",
  website: "",
  accountNumber: "",
  monthlyCost: "",
  dueDay: "",
  tenantNotes: "",
  internalNotes: "",
  tenantVisible: true,
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function UtilitiesSection({
  propertyId,
  units,
}: {
  propertyId: string;
  units: { id: string; unitNumber: string }[];
}) {
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/utilities?propertyId=${propertyId}`);
      if (!res.ok) throw new Error();
      setUtilities(await res.json());
    } catch {
      toast.error("Failed to load utilities");
    }
  }, [propertyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (u: Utility) => {
    setEditingId(u.id);
    setForm({
      type: u.type,
      providerName: u.providerName,
      scope: u.unitId ?? WHOLE_PROPERTY,
      phone: u.phone ?? "",
      website: u.website ?? "",
      accountNumber: u.accountNumber ?? "",
      monthlyCost: u.monthlyCost?.toString() ?? "",
      dueDay: u.dueDay?.toString() ?? "",
      tenantNotes: u.tenantNotes ?? "",
      internalNotes: u.internalNotes ?? "",
      tenantVisible: u.tenantVisible,
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      propertyId,
      unitId: form.scope === WHOLE_PROPERTY ? null : form.scope,
      type: form.type,
      providerName: form.providerName,
      phone: form.phone,
      website: form.website,
      accountNumber: form.accountNumber,
      monthlyCost: form.monthlyCost,
      dueDay: form.dueDay,
      tenantNotes: form.tenantNotes,
      internalNotes: form.internalNotes,
      tenantVisible: form.tenantVisible,
    };
    try {
      const res = await fetch(
        editingId ? `/api/utilities/${editingId}` : "/api/utilities",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Utility updated" : "Utility added");
      setOpen(false);
      refresh();
    } catch {
      toast.error("Failed to save utility");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this utility?")) return;
    try {
      const res = await fetch(`/api/utilities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Utility deleted");
      refresh();
    } catch {
      toast.error("Delete failed");
    }
  };

  const scopeLabel = (u: Utility) =>
    u.unitId
      ? `Unit ${units.find((x) => x.id === u.unitId)?.unitNumber ?? "?"}`
      : "Whole property";

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plug className="h-5 w-5" />
          Utilities
        </CardTitle>
        <Button
          size="sm"
          onClick={openAdd}
          className="bg-gradient-to-br from-[#4f17ce] to-[#673de6] text-white"
        >
          <Plus className="h-4 w-4 mr-1" /> Add utility
        </Button>
      </CardHeader>
      <CardContent>
        {utilities.length === 0 ? (
          <p className="text-slate-500 text-sm">No utilities added yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilities.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{utilityTypeLabel(u.type)}</TableCell>
                  <TableCell>{u.providerName}</TableCell>
                  <TableCell className="text-slate-600">{scopeLabel(u)}</TableCell>
                  <TableCell className="text-slate-600">{u.phone || "—"}</TableCell>
                  <TableCell className="text-slate-600 max-w-[140px] truncate">
                    {u.website ? (
                      <a href={u.website} target="_blank" rel="noopener noreferrer" className="text-[#4f17ce] hover:underline">
                        {u.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {u.monthlyCost != null ? money(u.monthlyCost) : "—"}
                  </TableCell>
                  <TableCell className="text-slate-600">{u.dueDay ?? "—"}</TableCell>
                  <TableCell>
                    {u.tenantVisible ? (
                      <Badge className="bg-emerald-600">Visible</Badge>
                    ) : (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Delete" onClick={() => remove(u.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit utility" : "Add utility"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UTILITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{utilityTypeLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Applies to</Label>
                <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WHOLE_PROPERTY}>Whole property</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>Unit {u.unitNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Provider name</Label>
              <Input
                value={form.providerName}
                onChange={(e) => setForm({ ...form, providerName: e.target.value })}
                placeholder="e.g. Waste Management"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Account # <span className="text-xs text-slate-400">(admin)</span></Label>
                <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
              </div>
              <div>
                <Label>Monthly <span className="text-xs text-slate-400">(admin)</span></Label>
                <Input type="number" step="0.01" value={form.monthlyCost} onChange={(e) => setForm({ ...form, monthlyCost: e.target.value })} />
              </div>
              <div>
                <Label>Due day <span className="text-xs text-slate-400">(admin)</span></Label>
                <Input type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Tenant notes</Label>
              <Textarea
                value={form.tenantNotes}
                onChange={(e) => setForm({ ...form, tenantNotes: e.target.value })}
                placeholder="Shown to tenant — trash schedule, can codes, setup steps"
              />
            </div>
            <div>
              <Label>Internal notes <span className="text-xs text-slate-400">(admin only)</span></Label>
              <Textarea
                value={form.internalNotes}
                onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.tenantVisible}
                onChange={(e) => setForm({ ...form, tenantVisible: e.target.checked })}
                className="h-4 w-4"
              />
              Visible to tenants
            </label>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Saving..." : editingId ? "Save changes" : "Add utility"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
