"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Promise-based confirm dialog. Replaces native window.confirm() with a styled,
// on-brand modal. Usage from any client component:
//
//   if (!(await confirmDialog({ title: "Delete charge?", description: "...",
//                               confirmText: "Delete", destructive: true }))) return;
//
// A single <ConfirmProvider /> is mounted once in the root layout.

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

type Resolver = (ok: boolean) => void;

let register: ((opts: ConfirmOptions, resolve: Resolver) => void) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  if (!register) {
    // Provider not mounted (SSR / edge case) — fall back to native confirm.
    if (typeof window !== "undefined") {
      return Promise.resolve(window.confirm(opts.description || opts.title));
    }
    return Promise.resolve(false);
  }
  return new Promise((resolve) => register!(opts, resolve));
}

export function ConfirmProvider() {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: Resolver } | null>(null);

  useEffect(() => {
    register = (opts, resolve) => setState({ opts, resolve });
    return () => {
      register = null;
    };
  }, []);

  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };

  const opts = state?.opts;

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && close(false)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{opts?.title}</DialogTitle>
          {opts?.description ? (
            <DialogDescription>{opts.description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            {opts?.cancelText || "Cancel"}
          </Button>
          <Button
            variant={opts?.destructive ? "destructive" : "default"}
            onClick={() => close(true)}
          >
            {opts?.confirmText || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
