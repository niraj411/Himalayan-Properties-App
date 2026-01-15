import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const insurance = await db.insuranceRecord.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            tenant: { include: { user: true } },
            unit: { include: { property: true } },
          },
        },
      },
    });

    if (!insurance) {
      return NextResponse.json(
        { error: "Insurance record not found" },
        { status: 404 }
      );
    }

    // Verify access for non-admin users
    if (session.user.role !== "ADMIN") {
      const tenant = await db.tenant.findUnique({
        where: { userId: session.user.id },
      });
      if (!tenant || insurance.lease.tenantId !== tenant.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json(insurance);
  } catch (error) {
    console.error("Error fetching insurance record:", error);
    return NextResponse.json(
      { error: "Failed to fetch insurance record" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get the insurance record first to verify ownership
    const existing = await db.insuranceRecord.findUnique({
      where: { id },
      include: { lease: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Insurance record not found" },
        { status: 404 }
      );
    }

    // Verify access for non-admin users
    if (session.user.role !== "ADMIN") {
      const tenant = await db.tenant.findUnique({
        where: { userId: session.user.id },
      });
      if (!tenant || existing.lease.tenantId !== tenant.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const insurance = await db.insuranceRecord.update({
      where: { id },
      data: {
        ...(body.insuranceType && { insuranceType: body.insuranceType }),
        ...(body.carrier !== undefined && { carrier: body.carrier }),
        ...(body.policyNumber !== undefined && { policyNumber: body.policyNumber }),
        ...(body.coverageAmount !== undefined && {
          coverageAmount: body.coverageAmount ? parseFloat(body.coverageAmount) : null,
        }),
        ...(body.effectiveDate && { effectiveDate: new Date(body.effectiveDate) }),
        ...(body.expirationDate && { expirationDate: new Date(body.expirationDate) }),
        ...(body.documentUrl !== undefined && { documentUrl: body.documentUrl }),
        ...(body.verified !== undefined && {
          verified: body.verified,
          verifiedAt: body.verified ? new Date() : null,
        }),
        ...(body.reminderSent !== undefined && {
          reminderSent: body.reminderSent,
          reminderSentAt: body.reminderSent ? new Date() : null,
        }),
      },
    });

    return NextResponse.json(insurance);
  } catch (error) {
    console.error("Error updating insurance record:", error);
    return NextResponse.json(
      { error: "Failed to update insurance record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.insuranceRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting insurance record:", error);
    return NextResponse.json(
      { error: "Failed to delete insurance record" },
      { status: 500 }
    );
  }
}
