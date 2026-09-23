import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { postAnnouncement } from "@/lib/announcements";

// POST /api/notices/announce -> one ANNOUNCEMENT notice per ACTIVE lease at a
// property (admin). deliver = "PORTAL" (default) posts to the tenant portal only;
// "EMAIL" also emails right away. See lib/announcements.ts.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { propertyId, subject, body, deliver, replyTo } = await request.json();
  try {
    const out = await postAnnouncement({ propertyId, subject, body, deliver, replyTo, sentById: session.user.id });
    return NextResponse.json(out, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
