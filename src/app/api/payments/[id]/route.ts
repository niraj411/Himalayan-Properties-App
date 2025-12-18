import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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
    await db.payment.delete({ where: { id } });

    return NextResponse.json({ message: "Payment deleted" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
