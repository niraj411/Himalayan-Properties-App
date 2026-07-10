// Tiny JSON error responses shared by the PDF routes, matching the app's
// existing { error } shape.
import { NextResponse } from "next/server";

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
export const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });
