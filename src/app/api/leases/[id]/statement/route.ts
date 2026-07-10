import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadStatementDoc } from "@/lib/pdf/statement";
import { pdfResponse } from "@/lib/pdf/render";
import { unauthorized, notFound } from "@/lib/pdf/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/leases/[id]/statement -> tenant account statement PDF (admin, or a tenant on the lease)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  const built = await loadStatementDoc(id);
  if (!built) return notFound();

  const isAdmin = session.user.role === "ADMIN";
  const tenantId = session.user.tenantId;
  const onLease =
    !!tenantId && (built.lease.tenantId === tenantId || built.lease.coTenantIds.includes(tenantId));
  if (!isAdmin && !onLease) return notFound();

  return pdfResponse(built.doc, built.filename);
}
