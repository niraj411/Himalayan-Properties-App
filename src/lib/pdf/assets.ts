// Server helpers for embedding images into generated PDFs. Local upload paths
// (e.g. "/uploads/properties/x.jpg") are read from the public dir and returned
// as data URIs so react-pdf never depends on the HTTP layer; remote URLs are
// passed through for react-pdf to fetch. Returns undefined when unresolvable so
// callers can render a graceful placeholder.
import { readFile } from "fs/promises";
import path from "path";
import QRCode from "qrcode";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function imageSrc(url: string | null | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  try {
    const clean = url.split("?")[0];
    const rel = clean.replace(/^\/+/, "");
    const filepath = path.join(process.cwd(), "public", rel);
    const ext = path.extname(filepath).toLowerCase();
    const mime = MIME[ext];
    if (!mime) return undefined; // react-pdf only handles jpg/png reliably
    const buf = await readFile(filepath);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

// react-pdf renders PNG/JPG reliably but not WEBP; prefer the first that resolves
// to a supported raster format.
export async function firstImageSrc(urls: (string | null | undefined)[]): Promise<string | undefined> {
  for (const u of urls) {
    const src = await imageSrc(u);
    if (src) return src;
  }
  return undefined;
}

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "H",
    margin: 1,
    scale: 8,
    color: { dark: "#5b21b6", light: "#ffffff" },
  });
}
