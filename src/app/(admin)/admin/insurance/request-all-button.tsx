"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

export function RequestAllButton({ nonCompliantCount }: { nonCompliantCount: number }) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const handleClick = async () => {
    if (nonCompliantCount === 0) {
      toast.info("All tenants have valid insurance on file");
      return;
    }
    if (!confirm(`Email ${nonCompliantCount} tenant(s) missing valid insurance?`)) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/insurance/request-all", { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to send requests");
        return;
      }
      const { requested, skipped } = await res.json();
      toast.success(`Sent ${requested} request(s)${skipped ? `, skipped ${skipped} compliant` : ""}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isSending}
      className="bg-gradient-to-br from-[#4f17ce] to-[#673de6] text-white rounded-xl hover:opacity-90"
    >
      {isSending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Send className="h-4 w-4 mr-2" />
      )}
      Request from all non-compliant
    </Button>
  );
}
