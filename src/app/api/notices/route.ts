import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { openBalance } from "@/lib/ledger";

// GET /api/notices?leaseId=... -> notices for a lease, newest first (admin)
// GET /api/notices?scope=tenant -> notices sent to the caller (tenant), safe fields
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  // Tenant-facing: only the caller's own SENT notices; no internal fields.
  if (scope === "tenant") {
    const tenant = await db.tenant.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!tenant) return NextResponse.json([]);
    const leases = await db.lease.findMany({
      where: { OR: [{ tenantId: tenant.id }, { coTenants: { some: { id: tenant.id } } }] },
      select: { id: true },
    });
    const notices = await db.notice.findMany({
      where: { leaseId: { in: leases.map((l) => l.id) }, status: "SENT" },
      select: { id: true, type: true, subject: true, body: true, amountDue: true, sentAt: true },
      orderBy: { sentAt: "desc" },
    });
    return NextResponse.json(notices);
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const leaseId = searchParams.get("leaseId") ?? undefined;
  const notices = await db.notice.findMany({
    where: leaseId ? { leaseId } : undefined,
    orderBy: { sentAt: "desc" },
  });
  return NextResponse.json(notices);
}

// POST /api/notices -> send a notice email through the app and log it (admin)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leaseId, type, subject, body, toEmail, ccEmails, replyTo } = await request.json();
  if (!leaseId || !type || !subject || !body || !toEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Snapshot the current open-charge balance at send time (remaining, net of
  // any partial payments already allocated).
  const openCharges = await db.charge.findMany({ where: { leaseId, status: "OPEN" } });
  const amountDue = openBalance(openCharges);

  const ccList = ccEmails
    ? String(ccEmails).split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  try {
    const info = await sendEmail({ to: toEmail, cc: ccList, replyTo: replyTo || undefined, subject, body });
    const notice = await db.notice.create({
      data: {
        leaseId, type, subject, body, toEmail,
        ccEmails: ccList && ccList.length ? ccList.join(", ") : null,
        replyTo: replyTo || null,
        amountDue,
        status: "SENT",
        messageId: info?.messageId ?? null,
        sentById: session.user.id,
      },
    });
    return NextResponse.json(notice, { status: 201 });
  } catch (err) {
    const notice = await db.notice.create({
      data: {
        leaseId, type, subject, body, toEmail,
        ccEmails: ccList && ccList.length ? ccList.join(", ") : null,
        replyTo: replyTo || null,
        amountDue,
        status: "FAILED",
        errorText: err instanceof Error ? err.message : String(err),
        sentById: session.user.id,
      },
    });
    return NextResponse.json(notice, { status: 200 });
  }
}
