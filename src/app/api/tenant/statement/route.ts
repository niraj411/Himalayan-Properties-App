import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadStatementDoc } from "@/lib/pdf/statement";
import { pdfResponse } from "@/lib/pdf/render";
import { unauthorized, notFound } from "@/lib/pdf/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/tenant/statement -> statement PDF for the signed-in tenant's lease.
// Resolves the lease server-side so the balance page needs no leaseId. Picks the
// most recent ACTIVE lease (falling back to the newest lease) when a tenant has
// more than one.
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  const tenantId = session.user.tenantId;
  if (!tenantId) return notFound();

  const lease =
    (await db.lease.findFirst({
      where: {
        status: "ACTIVE",
        OR: [{ tenantId }, { coTenants: { some: { id: tenantId } } }],
      },
      orderBy: { startDate: "desc" },
      select: { id: true },
    })) ??
    (await db.lease.findFirst({
      where: { OR: [{ tenantId }, { coTenants: { some: { id: tenantId } } }] },
      orderBy: { startDate: "desc" },
      select: { id: true },
    }));
  if (!lease) return notFound();

  const built = await loadStatementDoc(lease.id);
  if (!built) return notFound();

  return pdfResponse(built.doc, built.filename);
}
