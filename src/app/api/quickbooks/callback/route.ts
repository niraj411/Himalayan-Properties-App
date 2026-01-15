import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleCallback } from "@/lib/quickbooks";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const url = request.url;
    await handleCallback(url);

    // Redirect back to admin accounting page
    return NextResponse.redirect(new URL("/admin/accounting?connected=true", request.url));
  } catch (error) {
    console.error("QuickBooks callback error:", error);
    return NextResponse.redirect(new URL("/admin/accounting?error=connection_failed", request.url));
  }
}
