import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Return Baselane payment link — tenant-specific first, fall back to global setting
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let tenantLink: string | null = null;

    if (session?.user?.tenantId) {
      const tenant = await db.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { baselaneLink: true },
      });
      tenantLink = tenant?.baselaneLink || null;
    }

    if (!tenantLink) {
      const settings = await db.settings.findFirst();
      tenantLink = settings?.baselanePaymentLink || null;
    }

    return NextResponse.json({ baselaneLink: tenantLink, available: !!tenantLink });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json({ baselaneLink: null, available: false });
  }
}
