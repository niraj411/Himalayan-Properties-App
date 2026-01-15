import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { disconnect } from "@/lib/quickbooks";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await disconnect();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting QuickBooks:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
