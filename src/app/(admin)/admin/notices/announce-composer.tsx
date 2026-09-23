"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/confirm";
import { Megaphone } from "lucide-react";

interface PropertyOption {
  id: string;
  name: string;
  activeLeases: number;
}

const DEFAULT_REPLY_TO = "niraj411@gmail.com";

// Property-wide announcement: one notice per active lease. "Post to portal"
// makes it visible on each tenant's Notices page without emailing; it can be
// emailed later from the Notices table ("Email now").
export function AnnounceComposer({ properties }: { properties: PropertyOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(DEFAULT_REPLY_TO);

  const selected = properties.find((p) => p.id === propertyId);
  const canSubmit = !!propertyId && subject.trim().length > 0 && body.trim().length > 0 && !busy;

  const submit = async (deliver: "PORTAL" | "EMAIL") => {
    if (!selected) return;
    const n = selected.activeLeases;
    const ok = await confirmDialog({
      title: deliver === "EMAIL" ? `Post and email ${n} tenant${n === 1 ? "" : "s"}?` : `Post to ${n} tenant portal${n === 1 ? "" : "s"}?`,
      description:
        deliver === "EMAIL"
          ? `Every active lease at ${selected.name} gets this on their Notices page and by email right now.`
          : `Every active lease at ${selected.name} sees this on their Notices page. Nothing is emailed until you choose "Email now" on a posted notice.`,
      confirmText: deliver === "EMAIL" ? "Post and email" : "Post to portal",
    });
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch("/api/notices/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, subject, body, deliver, replyTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      const results: { status: string }[] = data.results ?? [];
      const failed = results.filter((r) => r.status === "FAILED").length;
      if (deliver === "EMAIL") {
        if (failed) toast.error(`Posted to ${results.length}; ${failed} email${failed === 1 ? "" : "s"} failed`);
        else toast.success(`Posted and emailed to ${results.length} tenant${results.length === 1 ? "" : "s"}`);
      } else {
        toast.success(`Posted to ${results.length} tenant portal${results.length === 1 ? "" : "s"}`);
      }
      setOpen(false);
      setSubject("");
      setBody("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post announcement");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Megaphone className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Property announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="announce-property">Property</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger id="announce-property">
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.activeLeases} active lease{p.activeLeases === 1 ? "" : "s"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="announce-replyto">Reply-to (for the email)</Label>
              <Input id="announce-replyto" type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="announce-subject">Subject</Label>
            <Input id="announce-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Updated ACH info for rent payments" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announce-body">Message</Label>
            <Textarea
              id="announce-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="font-mono text-sm"
              placeholder="Plain text. Each tenant sees exactly this on their Notices page."
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Goes to every active lease at the selected property. Former tenants and vacant units are skipped.
          </p>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={() => submit("PORTAL")} disabled={!canSubmit}>
              Post to portal only
            </Button>
            <Button type="button" onClick={() => submit("EMAIL")} disabled={!canSubmit}>
              Post and email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
