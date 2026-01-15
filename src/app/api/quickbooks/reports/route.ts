import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfitAndLoss, getRecentTransactions, isConnected } from "@/lib/quickbooks";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connected = await isConnected();
    if (!connected) {
      return NextResponse.json({ error: "QuickBooks not connected" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "summary";

    if (reportType === "pnl") {
      const startDate = searchParams.get("startDate") || getFirstDayOfYear();
      const endDate = searchParams.get("endDate") || getToday();
      const pnl = await getProfitAndLoss(startDate, endDate);
      return NextResponse.json(pnl);
    }

    if (reportType === "transactions") {
      const limit = parseInt(searchParams.get("limit") || "20");
      const transactions = await getRecentTransactions(limit);
      return NextResponse.json(transactions);
    }

    // Default: return summary
    const [pnl, transactions] = await Promise.all([
      getProfitAndLoss(getFirstDayOfMonth(), getToday()),
      getRecentTransactions(5),
    ]);

    return NextResponse.json({
      profitAndLoss: pnl,
      recentTransactions: transactions,
    });
  } catch (error) {
    console.error("Error fetching QuickBooks reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getFirstDayOfMonth(): string {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
}

function getFirstDayOfYear(): string {
  const date = new Date();
  return new Date(date.getFullYear(), 0, 1).toISOString().split("T")[0];
}
