import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isConnected, getCompanyInfo } from "@/lib/quickbooks";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connected = await isConnected();

    if (!connected) {
      return NextResponse.json({ connected: false });
    }

    try {
      const companyInfo = await getCompanyInfo();
      return NextResponse.json({
        connected: true,
        companyName: companyInfo?.CompanyName || "Connected",
      });
    } catch {
      return NextResponse.json({ connected: true, companyName: "Connected" });
    }
  } catch (error) {
    console.error("Error checking QuickBooks status:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
