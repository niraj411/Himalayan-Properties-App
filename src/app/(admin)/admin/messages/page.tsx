"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Mail, Send, Users, Loader2, Plus } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  email: string;
}

interface Message {
  id: string;
  subject: string;
  body: string;
  sentAt: string;
  to: { name: string; email: string } | null;
  from: { name: string } | null;
}

export default function MessagesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [form, setForm] = useState({
    toId: "all",
    subject: "",
    body: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tenantsRes, messagesRes] = await Promise.all([
        fetch("/api/tenants"),
        fetch("/api/email"),
      ]);
      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenants(data.map((t: { user: Tenant }) => t.user).filter(Boolean));
      }
      if (messagesRes.ok) {
        setMessages(await messagesRes.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error("Subject and message are required");
      return;
    }

    setIsSending(true);
    try {
      const payload =
        form.toId === "all"
          ? { toAll: true, subject: form.subject, body: form.body }
          : { toId: form.toId, subject: form.subject, body: form.body };

      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Message sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}`);
        setForm({ toId: "all", subject: "", body: "" });
        setIsComposeOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 mt-1">Send emails to tenants</p>
        </div>
        <Button
          onClick={() => setIsComposeOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Compose
        </Button>
      </div>

      {/* Sent Messages Log */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Sent Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No messages sent yet</p>
              <Button
                onClick={() => setIsComposeOpen(true)}
                variant="outline"
                className="mt-4"
              >
                Send your first message
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {messages.map((msg) => (
                <div key={msg.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {msg.to ? (
                          <span className="text-sm font-medium text-slate-700">
                            To: {msg.to.name} ({msg.to.email})
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
                            <Users className="h-3.5 w-3.5" />
                            All Tenants
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900 truncate">{msg.subject}</p>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{msg.body}</p>
                    </div>
                    <p className="text-xs text-slate-400 whitespace-nowrap">
                      {format(new Date(msg.sentAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Select value={form.toId} onValueChange={(v) => setForm({ ...form, toId: v })}>
                <SelectTrigger id="to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Tenants
                    </div>
                  </SelectItem>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Important update..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Write your message here..."
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
