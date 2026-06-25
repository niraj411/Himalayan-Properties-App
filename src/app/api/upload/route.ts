import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
// Map each accepted MIME type to a fixed, server-controlled extension. The
// extension is NEVER taken from the user-supplied file name (path-traversal),
// only from this whitelist keyed off the validated content type.
const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only PDF and image files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
  }

  // Only admins may write to the public web root, and only for property photos.
  // Everything else (leases, insurance, tenant docs) goes to private storage
  // behind /api/files auth — never trust the client to classify a file public.
  const type = (formData.get("type") as string) || "insurance";
  const isPublic = type === "property" && session.user.role === "ADMIN";

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  let uploadDir: string;
  let url: string;
  if (isPublic) {
    uploadDir = path.join(process.cwd(), "public", "uploads", "properties");
    url = `/uploads/properties/${filename}`;
  } else {
    uploadDir = path.join(process.cwd(), "private-uploads");
    url = `/api/files/${filename}`;
  }

  await mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return NextResponse.json({ url });
}
