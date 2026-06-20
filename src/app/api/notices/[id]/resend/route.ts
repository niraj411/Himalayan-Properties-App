import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// POST /api/notices/[id]/resend -> re-send a prior notice; logs a NEW Notice row (admin)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const prior = await db.notice.findUnique({ where: { id } });
  if (!prior) return NextResponse.json({ error: "Notice not found" }, { status: 404 });

  const ccList = prior.ccEmails
    ? prior.ccEmails.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  try {
    const info = await sendEmail({
      to: prior.toEmail,
      cc: ccList,
      replyTo: prior.replyTo || undefined,
      subject: prior.subject,
      body: prior.body,
    });
    const notice = await db.notice.create({
      data: {
        leaseId: prior.leaseId, type: prior.type, subject: prior.subject, body: prior.body,
        toEmail: prior.toEmail, ccEmails: prior.ccEmails, replyTo: prior.replyTo,
        amountDue: prior.amountDue, status: "SENT", messageId: info?.messageId ?? null,
        sentById: session.user.id,
      },
    });
    return NextResponse.json(notice, { status: 201 });
  } catch (err) {
    const notice = await db.notice.create({
      data: {
        leaseId: prior.leaseId, type: prior.type, subject: prior.subject, body: prior.body,
        toEmail: prior.toEmail, ccEmails: prior.ccEmails, replyTo: prior.replyTo,
        amountDue: prior.amountDue, status: "FAILED",
        errorText: err instanceof Error ? err.message : String(err),
        sentById: session.user.id,
      },
    });
    return NextResponse.json(notice, { status: 200 });
  }
}
