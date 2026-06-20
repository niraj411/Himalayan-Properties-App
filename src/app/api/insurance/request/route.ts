import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTenantEmail } from "@/lib/email";
import { insuranceCopy } from "@/lib/insurance";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leaseId } = await req.json();
    if (!leaseId) {
      return NextResponse.json({ error: "leaseId required" }, { status: 400 });
    }

    const lease = await db.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
      },
    });

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const copy = insuranceCopy(lease.leaseType);
    const body = copy.requestBody(lease.unit.property.name, lease.unit.unitNumber);
    await sendTenantEmail({
      tenantName: lease.tenant.user.name,
      tenantEmail: lease.tenant.user.email,
      subject: copy.requestSubject,
      body,
    });
    // Log the sent request so it's viewable in Admin -> Messages.
    await db.message.create({
      data: { fromId: session.user.id, toId: lease.tenant.userId, subject: copy.requestSubject, body },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending insurance request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
