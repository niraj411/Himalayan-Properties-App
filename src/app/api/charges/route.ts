import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/charges?leaseId=...  -> charges for a lease (admin)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const leaseId = searchParams.get("leaseId") ?? undefined;
  const charges = await db.charge.findMany({
    where: leaseId ? { leaseId } : undefined,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
  return NextResponse.json(charges);
}

// POST /api/charges  -> create a charge (admin)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();
  const { leaseId, label, amount, kind, dueDate, source, notes } = data;

  if (!leaseId || !label || amount === undefined || amount === null || amount === "") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const charge = await db.charge.create({
    data: {
      leaseId,
      label,
      amount: parseFloat(amount),
      kind: kind || "OTHER",
      dueDate: dueDate ? new Date(dueDate) : null,
      source: source || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(charge, { status: 201 });
}
