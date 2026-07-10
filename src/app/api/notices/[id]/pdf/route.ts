import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NoticeDoc } from "@/lib/pdf/NoticeDoc";
import { loadCompany } from "@/lib/pdf/company";
import { pdfResponse } from "@/lib/pdf/render";
import { dateFmt } from "@/lib/pdf/theme";
import { unauthorized, notFound } from "@/lib/pdf/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KICKER: Record<string, string> = {
  LATE: "Notice of Past-Due Rent",
  DEMAND: "Demand for Payment",
  CO_DEMAND: "Demand for Compliance or Possession",
  CUSTOM: "Notice",
};

// GET /api/notices/[id]/pdf -> the notice letter as a PDF (admin, or the tenant recipient)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const notice = await db.notice.findUnique({
    where: { id },
    include: { lease: { include: { coTenants: true } } },
  });
  if (!notice) return notFound();

  const isAdmin = session.user.role === "ADMIN";
  const tenantId = session.user.tenantId;
  const onLease =
    !!tenantId &&
    (notice.lease.tenantId === tenantId || notice.lease.coTenants.some((t) => t.id === tenantId));
  if (!isAdmin && !onLease) return notFound();

  const company = await loadCompany();

  const doc = NoticeDoc({
    company,
    kicker: KICKER[notice.type] ?? "Notice",
    subject: notice.subject,
    body: notice.body,
    toEmail: notice.toEmail,
    sentOn: dateFmt(notice.sentAt),
    status: notice.status,
    generatedOn: dateFmt(new Date()),
  });

  return pdfResponse(doc, `notice-${notice.type.toLowerCase()}-${id.slice(-6)}.pdf`);
}
