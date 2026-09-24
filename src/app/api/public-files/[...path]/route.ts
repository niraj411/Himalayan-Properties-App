import { NextRequest, NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves files under public/uploads/ that were added AFTER the last `next build`.
// `next start` indexes the public folder at startup, so a photo uploaded through
// the admin UI 404s until the next restart. next.config rewrites /uploads/* here
// (afterFiles), so files Next already knows about are still served natively and
// only the new ones fall through to this route. Listing photos are public by
// design (AGENTS.md §6.1); private documents live in private-uploads/ and are
// served by the auth-gated /api/files route, never here.
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".glb": "model/gltf-binary",
  ".pdf": "application/pdf",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const rel = path.normalize(parts.join("/"));
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return new NextResponse(null, { status: 404 });
  }
  const abs = path.join(UPLOADS_DIR, rel);
  if (!abs.startsWith(UPLOADS_DIR + path.sep)) {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const s = await stat(abs);
    if (!s.isFile()) return new NextResponse(null, { status: 404 });
    const body = await readFile(abs);
    const type = MIME[path.extname(abs).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Length": String(s.size),
        "Cache-Control": "public, max-age=86400",
        "Last-Modified": s.mtime.toUTCString(),
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
