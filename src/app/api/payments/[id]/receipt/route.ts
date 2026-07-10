import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { RentReceipt } from "@/lib/pdf/RentReceipt";
import { loadCompany } from "@/lib/pdf/company";
import { pdfResponse } from "@/lib/pdf/render";
import { dateFmt } from "@/lib/pdf/theme";
import { unauthorized, notFound } from "@/lib/pdf/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/payments/[id]/receipt -> rent receipt PDF (admin, or the tenant on the lease)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      charge: true,
      lease: {
        include: {
          tenant: { include: { user: true } },
          coTenants: true,
          unit: { include: { property: true } },
        },
      },
    },
  });
  if (!payment) return notFound();

  const isAdmin = session.user.role === "ADMIN";
  const tenantId = session.user.tenantId;
  const onLease =
    !!tenantId &&
    (payment.lease.tenantId === tenantId || payment.lease.coTenants.some((t) => t.id === tenantId));
  if (!isAdmin && !onLease) return notFound();

  const company = await loadCompany();
  const p = payment.lease.unit.property;
  const premises = `${p.address}, Unit ${payment.lease.unit.unitNumber}, ${p.city}, ${p.state} ${p.zip}`;

  const doc = RentReceipt({
    company,
    receiptNo: `RCPT-${payment.id.slice(-6).toUpperCase()}`,
    paidOn: dateFmt(payment.date),
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
    tenantName: payment.lease.tenant.user.name,
    tenantEmail: payment.lease.tenant.user.email,
    premises,
    appliedTo: payment.charge?.label ?? null,
    generatedOn: dateFmt(new Date()),
  });

  return pdfResponse(doc, `receipt-${payment.id.slice(-6)}.pdf`);
}
