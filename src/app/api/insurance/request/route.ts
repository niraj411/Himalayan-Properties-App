import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTenantEmail } from "@/lib/email";

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

    await sendTenantEmail({
      tenantName: lease.tenant.user.name,
      tenantEmail: lease.tenant.user.email,
      subject: "Action Required: Upload Your Liability Insurance Certificate",
      body: `As part of your commercial lease at ${lease.unit.property.name} - Unit #${lease.unit.unitNumber}, you are required to maintain valid liability insurance with Himalayan Holdings Property LLC listed as an additional insured.\n\nPlease log in to your tenant portal and upload your current certificate of insurance at your earliest convenience.\n\nIf you have any questions, please don't hesitate to reach out.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending insurance request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
