import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// GET — fetch sent messages log
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await db.message.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
    include: {
      to: { select: { name: true, email: true } },
      from: { select: { name: true } },
    },
  });

  return NextResponse.json(messages);
}

// POST — send email to one tenant or all tenants
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toId, subject, body, toAll } = await req.json();

  if (!subject || !body) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
  }

  let recipients: { id: string; email: string; name: string }[] = [];

  if (toAll) {
    const tenants = await db.user.findMany({
      where: { role: "TENANT" },
      select: { id: true, email: true, name: true },
    });
    recipients = tenants;
  } else if (toId) {
    const user = await db.user.findUnique({
      where: { id: toId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    recipients = [user];
  } else {
    return NextResponse.json({ error: "Specify toId or toAll" }, { status: 400 });
  }

  // Send emails
  for (const r of recipients) {
    await sendEmail({
      to: r.email,
      subject,
      body: `Hi ${r.name},\n\n${body}\n\n— Himalayan Properties`,
    });

    // Log in DB
    await db.message.create({
      data: {
        fromId: session.user.id,
        toId: toAll ? null : r.id,
        subject,
        body,
      },
    });
  }

  return NextResponse.json({ sent: recipients.length });
}
