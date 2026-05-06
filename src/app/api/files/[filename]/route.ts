import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile, stat } from "fs/promises";
import path from "path";

const PRIVATE_DIR = path.join(process.cwd(), "private-uploads");

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentUrl = `/api/files/${filename}`;
  const isAdmin = session.user.role === "ADMIN";
  const tenantId = session.user.tenantId;

  let authorized = false;

  if (isAdmin) {
    authorized = true;
  } else if (tenantId) {
    const lease = await db.lease.findFirst({
      where: {
        documentUrl,
        OR: [
          { tenantId },
          { coTenants: { some: { id: tenantId } } },
        ],
      },
      select: { id: true },
    });
    if (lease) {
      authorized = true;
    } else {
      const insurance = await db.insuranceRecord.findFirst({
        where: {
          documentUrl,
          lease: {
            OR: [
              { tenantId },
              { coTenants: { some: { id: tenantId } } },
            ],
          },
        },
        select: { id: true },
      });
      if (insurance) authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filepath = path.join(PRIVATE_DIR, filename);
  try {
    await stat(filepath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buf = await readFile(filepath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
