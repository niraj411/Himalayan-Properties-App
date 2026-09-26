import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"];

// undefined = leave untouched; "" / null = clear; otherwise parse.
function optionalNumber(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  if (!isFinite(n)) throw new Error("Invalid number");
  return n;
}
function optionalDate(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const d = new Date(String(v));
  if (isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const application = await db.application.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { status, adminNotes, holdingDeposit, holdingDepositDate, refundAmount, refundDate } = data;

    if (status !== undefined && !APPLICATION_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const application = await db.application.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        adminNotes: adminNotes !== undefined ? (adminNotes ? String(adminNotes) : null) : undefined,
        holdingDeposit: optionalNumber(holdingDeposit),
        holdingDepositDate: optionalDate(holdingDepositDate),
        refundAmount: optionalNumber(refundAmount),
        refundDate: optionalDate(refundDate),
      },
      include: { property: true, unit: { select: { unitNumber: true } } },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.application.delete({ where: { id } });

    return NextResponse.json({ message: "Application deleted" });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
