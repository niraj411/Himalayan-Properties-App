// Turn a react-pdf document element into an HTTP response, reusing the same
// file-serving conventions as /api/files. `download` toggles inline preview vs
// a forced save dialog.
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export async function pdfResponse(
  doc: ReactElement<DocumentProps>,
  filename: string,
  opts: { download?: boolean } = {},
) {
  const buffer = await renderToBuffer(doc);
  const disposition = opts.download ? "attachment" : "inline";
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${safe}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
