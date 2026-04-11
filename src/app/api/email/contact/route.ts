import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// POST — tenant sends message to admin
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, message } = await req.json();

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const settings = await db.settings.findFirst();
  const adminEmail = settings?.companyEmail || process.env.SMTP_USER;

  if (!adminEmail) {
    return NextResponse.json({ error: "Admin email not configured" }, { status: 500 });
  }

  const sender = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  await sendEmail({
    to: adminEmail,
    subject: `[Tenant Message] ${subject}`,
    body: `Message from ${sender?.name} (${sender?.email}):\n\n${message}`,
  });

  // Log it
  await db.message.create({
    data: {
      fromId: session.user.id,
      toId: null,
      subject,
      body: message,
    },
  });

  return NextResponse.json({ success: true });
}
