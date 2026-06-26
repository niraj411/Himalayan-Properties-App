"use client";

import { useState } from "react";
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
import { format } from "date-fns";
import { Plus, DollarSign, Check, Trash2, RotateCcw, Ban } from "lucide-react";
import { chargeRemaining, openBalance } from "@/lib/ledger";

export interface Charge {
  id: string;
  kind: string;
  label: string;
  amount: number;
  amountPaid: number;
  dueDate: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  paidDate: string | null;
}

const KINDS = ["RENT", "LATE_FEE", "UTILITY", "FINAL", "CLEANING", "DEPOSIT", "OTHER"];

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function statusBadge(status: string) {
  if (status === "PAID") return <Badge className="bg-green-600">Paid</Badge>;
  if (status === "WAIVED") return <Badge variant="secondary">Waived</Badge>;
  return <Badge className="bg-amber-600">Open</Badge>;
}

export default function ChargesSection({
  leaseId,
  charges,
  onChanged,
}: {
  leaseId: string;
  charges: Charge[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    kind: "RENT",
    label: "",
    amount: "",
    dueDate: "",
    source: "",
    notes: "",
  });

  const outstanding = openBalance(charges);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId, ...form }),
      });
      if (!res.ok) throw new Error();
      toast.success("Charge added");
      setOpen(false);
      setForm({ kind: "RENT", label: "", amount: "", dueDate: "", source: "", notes: "" });
      onChanged();
    } catch {
      toast.error("Failed to add charge");
    } finally {
      setSubmitting(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, msg: string) => {
    try {
      const res = await fetch(`/api/charges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(msg);
      onChanged();
    } catch {
      toast.error("Update failed");
    }
  };

  const remove = async (id: string) => {
    if (!(await confirmDialog({ title: "Delete charge?", description: "This permanently deletes the charge.", confirmText: "Delete", destructive: true }))) return;
    try {
      const res = await fetch(`/api/charges/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Charge deleted");
      onChanged();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Charges &amp; Outstanding
          {outstanding > 0 && (
            <Badge className="ml-2 bg-amber-600">{money(outstanding)} due</Badge>
          )}
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add charge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add charge</DialogTitle>
            </DialogHeader>
            <form onSubmit={add} className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k} value={k}>{k.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Rent (Invoice #1341810)"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Source (optional)</Label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="e.g. Baselane #1341810"
                />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Adding..." : "Add charge"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {charges.length === 0 ? (
          <p className="text-slate-500 text-sm">No charges on this lease.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.label}</div>
                    {c.source && <div className="text-xs text-slate-500">{c.source}</div>}
                  </TableCell>
                  <TableCell className="text-slate-600">{c.kind.replace("_", " ")}</TableCell>
                  <TableCell className="text-slate-600">
                    {c.dueDate ? format(new Date(c.dueDate), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(c.status === "OPEN" ? chargeRemaining(c) : c.amount)}
                    {c.amountPaid > 0 && c.amountPaid < c.amount && c.status === "OPEN" ? (
                      <div className="text-xs text-slate-500">{money(c.amountPaid)} paid of {money(c.amount)}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {c.status === "OPEN" ? (
                        <>
                          <Button size="sm" variant="ghost" title="Mark paid"
                            onClick={() => patch(c.id, { status: "PAID" }, "Marked paid")}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Waive"
                            onClick={() => patch(c.id, { status: "WAIVED" }, "Waived")}>
                            <Ban className="h-4 w-4 text-slate-500" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" title="Reopen"
                          onClick={() => patch(c.id, { status: "OPEN" }, "Reopened")}>
                          <RotateCcw className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" title="Delete" onClick={() => remove(c.id)}>
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
    </Card>
  );
}
