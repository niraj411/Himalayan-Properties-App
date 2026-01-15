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
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const escalation = await db.leaseEscalation.findUnique({
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

    if (!escalation) {
      return NextResponse.json(
        { error: "Escalation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(escalation);
  } catch (error) {
    console.error("Error fetching escalation:", error);
    return NextResponse.json(
      { error: "Failed to fetch escalation" },
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
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const escalation = await db.leaseEscalation.update({
      where: { id },
      data: {
        ...(body.effectiveDate && { effectiveDate: new Date(body.effectiveDate) }),
        ...(body.newMonthlyRent && { newMonthlyRent: parseFloat(body.newMonthlyRent) }),
        ...(body.increaseType && { increaseType: body.increaseType }),
        ...(body.increaseValue !== undefined && { increaseValue: body.increaseValue ? parseFloat(body.increaseValue) : null }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.applied !== undefined && { applied: body.applied }),
      },
    });

    // If escalation is being applied, update the lease's monthly rent
    if (body.applied === true) {
      await db.lease.update({
        where: { id: escalation.leaseId },
        data: { monthlyRent: escalation.newMonthlyRent },
      });
    }

    return NextResponse.json(escalation);
  } catch (error) {
    console.error("Error updating escalation:", error);
    return NextResponse.json(
      { error: "Failed to update escalation" },
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

    await db.leaseEscalation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting escalation:", error);
    return NextResponse.json(
      { error: "Failed to delete escalation" },
      { status: 500 }
    );
  }
}
