"use client";

import { useCallback, useEffect, useState } from "react";
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
import { FileWarning, Send, Eye, RotateCw } from "lucide-react";

interface Notice {
  id: string;
  type: string;
  subject: string;
  body: string;
  toEmail: string;
  ccEmails: string | null;
  replyTo: string | null;
  amountDue: number | null;
  status: string;
  errorText: string | null;
  sentAt: string;
}

const DEFAULT_REPLY_TO = "niraj411@gmail.com";

const TYPES: { value: string; label: string }[] = [
  { value: "LATE", label: "Late Notice" },
  { value: "DEMAND", label: "Demand for Payment" },
  { value: "CO_DEMAND", label: "CO Demand for Compliance or Possession" },
  { value: "CUSTOM", label: "Custom" },
];

const typeLabel = (v: string) => TYPES.find((t) => t.value === v)?.label ?? v;

export default function NoticesSection({ leaseId }: { leaseId: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [viewing, setViewing] = useState<Notice | null>(null);
  const [form, setForm] = useState({
    type: "LATE",
    subject: "",
    body: "",
    toEmail: "",
    ccEmails: "",
    replyTo: DEFAULT_REPLY_TO,
    cureDays: 5,
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/notices?leaseId=${leaseId}`);
      if (res.ok) setNotices(await res.json());
    } catch {
      /* ignore */
    }
  }, [leaseId]);

  useEffect(() => {
    load();
  }, [load]);

  const renderTemplate = useCallback(
    async (type: string, cureDays: number) => {
      if (type === "CUSTOM") {
        setForm((f) => ({ ...f, type, subject: "", body: "" }));
        return;
      }
      try {
        const res = await fetch("/api/notices/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId, type, cureDays }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setForm((f) => ({
          ...f,
          type,
          cureDays,
          subject: data.subject,
          body: data.body,
          toEmail: f.toEmail || data.toEmail,
        }));
      } catch {
        toast.error("Failed to render template");
      }
    },
    [leaseId]
  );

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      setForm({ type: "LATE", subject: "", body: "", toEmail: "", ccEmails: "", replyTo: DEFAULT_REPLY_TO, cureDays: 5 });
      renderTemplate("LATE", 5);
    }
  };

  const onTypeChange = (type: string) => {
    const cureDays = type === "CO_DEMAND" ? 3 : 5;
    setForm((f) => ({ ...f, type, cureDays }));
    renderTemplate(type, cureDays);
  };

  const onCureDaysChange = (v: string) => {
    const cureDays = Number(v) || 0;
    setForm((f) => ({ ...f, cureDays }));
    if (form.type !== "CUSTOM" && cureDays > 0) renderTemplate(form.type, cureDays);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId,
          type: form.type,
          subject: form.subject,
          body: form.body,
          toEmail: form.toEmail,
          ccEmails: form.ccEmails,
          replyTo: form.replyTo,
        }),
      });
      const notice = await res.json();
      if (notice?.status === "SENT") {
        toast.success(`Notice sent to ${form.toEmail}`);
        setOpen(false);
      } else {
        toast.error(`Send failed: ${notice?.errorText ?? "unknown error"}`);
      }
      load();
    } catch {
      toast.error("Failed to send notice");
    } finally {
      setSending(false);
    }
  };

  const resend = async (id: string) => {
    if (!(await confirmDialog({ title: "Re-send notice?", description: "This re-sends the notice email to the same recipients.", confirmText: "Re-send", destructive: false }))) return;
    try {
      const res = await fetch(`/api/notices/${id}/resend`, { method: "POST" });
      const notice = await res.json();
      if (notice?.status === "SENT") toast.success("Notice re-sent");
      else toast.error(`Re-send failed: ${notice?.errorText ?? "unknown error"}`);
      load();
    } catch {
      toast.error("Re-send failed");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileWarning className="h-5 w-5" />
          Notices
          {notices.length > 0 && (
            <Badge variant="secondary" className="ml-2">{notices.length}</Badge>
          )}
        </CardTitle>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-br from-[#4f17ce] to-[#673de6] text-white">
              <Send className="h-4 w-4 mr-1" /> Send notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send notice</DialogTitle>
            </DialogHeader>
            <form onSubmit={send} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={onTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cure period (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.cureDays}
                    onChange={(e) => onCureDaysChange(e.target.value)}
                    disabled={form.type === "CUSTOM"}
                  />
                </div>
              </div>
              <div>
                <Label>To</Label>
                <Input
                  type="email"
                  value={form.toEmail}
                  onChange={(e) => setForm({ ...form, toEmail: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CC (comma-separated)</Label>
                  <Input
                    value={form.ccEmails}
                    onChange={(e) => setForm({ ...form, ccEmails: e.target.value })}
                    placeholder="lawyer@…, guarantor@…"
                  />
                </div>
                <div>
                  <Label>Reply-To</Label>
                  <Input
                    type="email"
                    value={form.replyTo}
                    onChange={(e) => setForm({ ...form, replyTo: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={14}
                  className="font-mono text-xs"
                  required
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full bg-gradient-to-br from-[#4f17ce] to-[#673de6] text-white">
                {sending ? "Sending…" : "Send notice"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <p className="text-slate-500 text-sm">No notices sent on this lease.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>To / CC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="text-slate-600 whitespace-nowrap">
                    {format(new Date(n.sentAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>{typeLabel(n.type)}</TableCell>
                  <TableCell className="text-slate-600">
                    <div>{n.toEmail}</div>
                    {n.ccEmails && <div className="text-xs text-slate-400">cc: {n.ccEmails}</div>}
                  </TableCell>
                  <TableCell>
                    {n.status === "SENT" ? (
                      <Badge className="bg-emerald-600">Sent</Badge>
                    ) : (
                      <Badge className="bg-red-600" title={n.errorText ?? undefined}>Failed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" title="View" onClick={() => setViewing(n)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Re-send" onClick={() => resend(n.id)}>
                        <RotateCw className="h-4 w-4 text-[#4f17ce]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewing?.subject}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-2 text-sm">
              <div className="text-slate-500">
                To: {viewing.toEmail}
                {viewing.ccEmails && <> · CC: {viewing.ccEmails}</>}
                {viewing.replyTo && <> · Reply-To: {viewing.replyTo}</>}
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs bg-[#f5f3f5] p-4 rounded-xl max-h-[60vh] overflow-auto">
                {viewing.body}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
