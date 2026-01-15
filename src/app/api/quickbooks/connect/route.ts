import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthUri } from "@/lib/quickbooks";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUri = getAuthUri();
    return NextResponse.json({ authUri });
  } catch (error) {
    console.error("Error generating QuickBooks auth URI:", error);
    return NextResponse.json({ error: "Failed to connect to QuickBooks" }, { status: 500 });
  }
}
