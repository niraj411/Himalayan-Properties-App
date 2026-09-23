"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/confirm";
import { Send } from "lucide-react";

// Emails a portal-only (POSTED) notice to its tenant; the row flips to Sent.
export function EmailNowButton({ noticeId, toEmail }: { noticeId: string; toEmail: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const ok = await confirmDialog({
      title: `Email this notice to ${toEmail}?`,
      description: "The tenant already sees it in the portal. This sends it by email as well.",
      confirmText: "Email now",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/notices/${noticeId}/resend`, { method: "POST" });
      const notice = await res.json();
      if (res.ok && notice?.status === "SENT") toast.success(`Emailed to ${toEmail}`);
      else toast.error(`Email failed: ${notice?.errorText ?? notice?.error ?? "unknown error"}`);
      router.refresh();
    } catch {
      toast.error("Email failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" size="sm" variant="outline" onClick={send} disabled={busy}>
      <Send className="h-3.5 w-3.5 mr-1.5" />
      Email now
    </Button>
  );
}
