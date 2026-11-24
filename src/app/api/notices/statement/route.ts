import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { activeStatementLeaseIds, buildMonthlyStatement, postMonthlyStatement } from "@/lib/statements";

// POST /api/notices/statement { period: "2026-12", leaseId? | all: true, preview?: true }
// Posts a monthly rent statement (STATEMENT notice, portal only, status POSTED)
// for one lease or every active lease. preview=true returns the text without saving.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { period, leaseId, all, preview } = await request.json().catch(() => ({}));
  if (!period || (!leaseId && !all)) {
    return NextResponse.json({ error: "period and leaseId (or all: true) are required" }, { status: 400 });
  }
  try {
    const ids: string[] = all ? await activeStatementLeaseIds() : [leaseId];
    if (preview) {
      const statements = await Promise.all(ids.map((id) => buildMonthlyStatement(id, period)));
      return NextResponse.json({ preview: true, statements });
    }
    const results = [];
    for (const id of ids) results.push(await postMonthlyStatement(id, period, session.user.id));
    return NextResponse.json({ results }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
