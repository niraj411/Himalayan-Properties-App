"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
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
import { confirmDialog } from "@/components/ui/confirm";
import { Plus, Receipt, Pencil, Trash2, FileText, CheckCircle2, Upload, Loader2 } from "lucide-react";
import {
  utilityTypeLabel,
  billStatus,
  BILL_STATUS_LABELS,
  BILL_PAYMENT_METHODS,
  formatBillPeriod,
  formatBillDate,
  toDateInput,
  usageSummary,
  type UtilityBillDTO,
  type BillStatus,
} from "@/lib/utilities";

interface UtilityOption {
  id: string;
  type: string;
  providerName: string;
  unitId: string | null;
  accountNumber: string | null;
}

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const STATUS_CLASS: Record<BillStatus, string> = {
  PAID: "bg-green-50 text-green-700 border-green-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  DUE_SOON: "bg-amber-50 text-amber-700 border-amber-200",
  DUE: "bg-surface-container-high text-on-surface border-transparent",
};

const emptyForm = {
  utilityId: "",
  periodStart: "",
  periodEnd: "",
  dueDate: "",
  amount: "",
  kwh: "",
  therms: "",
  gallons: "",
  paid: false,
  paidAt: "",
  paymentMethod: "AUTOPAY",
  documentUrl: "",
  externalId: "",
  notes: "",
};

export default function UtilityBillsSection({
  propertyId,
  units,
}: {
  propertyId: string;
  units: { id: string; unitNumber: string }[];
}) {
  const [bills, setBills] = useState<UtilityBillDTO[]>([]);
  const [utilities, setUtilities] = useState<UtilityOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [b, u] = await Promise.all([
        fetch(`/api/utility-bills?propertyId=${propertyId}`),
        fetch(`/api/utilities?propertyId=${propertyId}`),
      ]);
      if (!b.ok || !u.ok) throw new Error();
      setBills(await b.json());
      setUtilities(await u.json());
    } catch {
      toast.error("Failed to load utility bills");
    } finally {
      setLoaded(true);
    }
  }, [propertyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const utilityLabel = (u: { type: string; providerName: string; unitId: string | null } | undefined) => {
    if (!u) return "";
    const unit = u.unitId ? units.find((x) => x.id === u.unitId)?.unitNumber : null;
    return `${utilityTypeLabel(u.type)} (${u.providerName}${unit ? `, Unit ${unit}` : ""})`;
  };

  // Summary chips: trailing 12 months, this calendar year, open bills.
  const summary = useMemo(() => {
    const now = new Date();
    const yearStart = Date.UTC(now.getUTCFullYear(), 0, 1);
    const twelveAgo = Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate());
    let ytd = 0;
    let trailing = 0;
    let openCount = 0;
    let openAmount = 0;
    for (const b of bills) {
      const end = new Date(b.periodEnd).getTime();
      if (end >= yearStart) ytd += b.amount;
      if (end >= twelveAgo) trailing += b.amount;
      if (!b.paidAt) {
        openCount += 1;
        openAmount += b.amount;
      }
    }
    return { ytd, trailing, openCount, openAmount };
  }, [bills]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, utilityId: utilities[0]?.id ?? "" });
    setOpen(true);
  };

  const openEdit = (b: UtilityBillDTO) => {
    setEditingId(b.id);
    setForm({
      utilityId: b.utilityId,
      periodStart: toDateInput(b.periodStart),
      periodEnd: toDateInput(b.periodEnd),
      dueDate: toDateInput(b.dueDate),
      amount: b.amount.toString(),
      kwh: b.kwh?.toString() ?? "",
      therms: b.therms?.toString() ?? "",
      gallons: b.gallons?.toString() ?? "",
      paid: !!b.paidAt,
      paidAt: toDateInput(b.paidAt),
      paymentMethod: b.paymentMethod ?? "AUTOPAY",
      documentUrl: b.documentUrl ?? "",
      externalId: b.externalId ?? "",
      notes: b.notes ?? "",
    });
    setOpen(true);
  };

  const uploadStatement = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "utility-bill"); // anything but "property" lands in private-uploads
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setForm((f) => ({ ...f, documentUrl: url }));
      toast.success("Statement attached");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.utilityId) {
      toast.error("Pick which utility this bill is for");
      return;
    }
    setSubmitting(true);
    const payload = {
      utilityId: form.utilityId,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      dueDate: form.dueDate,
      amount: form.amount,
      kwh: form.kwh,
      therms: form.therms,
      gallons: form.gallons,
      paidAt: form.paid ? form.paidAt || toDateInput(new Date()) : "",
      paymentMethod: form.paid ? form.paymentMethod : "",
      documentUrl: form.documentUrl,
      externalId: form.externalId,
      notes: form.notes,
    };
    try {
      const res = await fetch(
        editingId ? `/api/utility-bills/${editingId}` : "/api/utility-bills",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save bill");
      }
      toast.success(editingId ? "Bill updated" : "Bill logged");
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save bill");
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async (b: UtilityBillDTO) => {
    try {
      const res = await fetch(`/api/utility-bills/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAt: toDateInput(new Date()), paymentMethod: b.paymentMethod ?? "AUTOPAY" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marked paid");
      refresh();
    } catch {
      toast.error("Could not mark paid");
    }
  };

  const remove = async (id: string) => {
    if (
      !(await confirmDialog({
        title: "Delete bill?",
        description: "This removes the logged bill. The attached statement file is not deleted.",
        confirmText: "Delete",
        destructive: true,
      }))
    )
      return;
    try {
      const res = await fetch(`/api/utility-bills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Bill deleted");
      refresh();
    } catch {
      toast.error("Delete failed");
    }
  };

  const selectedUtility = utilities.find((u) => u.id === form.utilityId);
  const showKwh = !selectedUtility || selectedUtility.type === "ELECTRIC" || selectedUtility.type === "OTHER";
  const showTherms = !selectedUtility || selectedUtility.type === "GAS" || selectedUtility.type === "OTHER";
  const showGallons = !selectedUtility || selectedUtility.type === "WATER" || selectedUtility.type === "SEWER";

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-5 w-5" />
          Utility bills
          <span className="text-xs font-normal text-slate-400">admin only</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" asChild>
            <Link href="/admin/utilities">All properties</Link>
          </Button>
          <Button size="sm" onClick={openAdd} className="text-white" disabled={utilities.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> Log bill
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loaded && utilities.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Add a utility above (for example Xcel Energy as Electricity) before logging bills against it.
          </p>
        ) : null}

        {bills.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Last 12 months" value={money(summary.trailing)} />
            <Stat label="This year" value={money(summary.ytd)} />
            <Stat
              label="Open bills"
              value={summary.openCount === 0 ? "None" : `${summary.openCount} / ${money(summary.openAmount)}`}
              tone={summary.openCount > 0 ? "warn" : "ok"}
            />
            <Stat label="Bills logged" value={bills.length.toString()} />
          </div>
        )}

        {loaded && bills.length === 0 && utilities.length > 0 ? (
          <p className="text-slate-500 text-sm">No bills logged yet.</p>
        ) : bills.length > 0 ? (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Utility</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((b) => {
                const status = billStatus(b);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatBillPeriod(b.periodStart, b.periodEnd)}
                    </TableCell>
                    <TableCell className="text-slate-600">{utilityLabel(b.utility)}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums">{usageSummary(b) || "n/a"}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(b.amount)}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      {b.dueDate ? formatBillDate(b.dueDate) : "n/a"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_CLASS[status]}>
                        {status === "PAID" && b.paidAt
                          ? `Paid ${formatBillDate(b.paidAt, { year: false })}`
                          : BILL_STATUS_LABELS[status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {b.documentUrl && (
                          <Button size="sm" variant="ghost" title="View statement" asChild>
                            <a href={b.documentUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 text-primary" />
                            </a>
                          </Button>
                        )}
                        {!b.paidAt && (
                          <Button size="sm" variant="ghost" title="Mark paid" onClick={() => markPaid(b)}>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(b)}>
                          <Pencil className="h-4 w-4 text-slate-600" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Delete" onClick={() => remove(b.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        ) : null}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit bill" : "Log utility bill"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Utility</Label>
              <Select value={form.utilityId} onValueChange={(v) => setForm({ ...form, utilityId: v })}>
                <SelectTrigger><SelectValue placeholder="Pick a utility" /></SelectTrigger>
                <SelectContent>
                  {utilities.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {utilityLabel(u)}{u.accountNumber ? ` #${u.accountNumber}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Period start</Label>
                <Input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} required />
              </div>
              <div>
                <Label>Period end</Label>
                <Input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} required />
              </div>
              <div>
                <Label>Due date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label>Amount</Label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              {showKwh && (
                <div>
                  <Label>kWh</Label>
                  <Input type="number" step="0.01" min="0" value={form.kwh} onChange={(e) => setForm({ ...form, kwh: e.target.value })} />
                </div>
              )}
              {showTherms && (
                <div>
                  <Label>Therms</Label>
                  <Input type="number" step="0.01" min="0" value={form.therms} onChange={(e) => setForm({ ...form, therms: e.target.value })} />
                </div>
              )}
              {showGallons && (
                <div>
                  <Label>Gallons</Label>
                  <Input type="number" step="1" min="0" value={form.gallons} onChange={(e) => setForm({ ...form, gallons: e.target.value })} />
                </div>
              )}
            </div>
            <div className="rounded-xl bg-surface-container-low p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.paid}
                  onChange={(e) => setForm({ ...form, paid: e.target.checked })}
                  className="h-4 w-4"
                />
                Paid
              </label>
              {form.paid && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Paid on</Label>
                    <Input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
                  </div>
                  <div>
                    <Label>Method</Label>
                    <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BILL_PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Statement #</Label>
                <Input value={form.externalId} onChange={(e) => setForm({ ...form, externalId: e.target.value })} placeholder="Provider invoice or statement number" />
              </div>
              <div>
                <Label>Statement PDF</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadStatement(e.target.files[0])}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="ml-1">{form.documentUrl ? "Replace" : "Upload"}</span>
                  </Button>
                  {form.documentUrl && (
                    <a href={form.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">
                      attached
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label>Notes <span className="text-xs text-slate-400">(admin only)</span></Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Saving..." : editingId ? "Save changes" : "Log bill"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl bg-surface-container-low px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums ${
          tone === "warn" ? "text-amber-700" : tone === "ok" ? "text-green-700" : "text-on-surface"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
