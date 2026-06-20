import { NextResponse } from "next/server";
import { agentAuthorized } from "@/lib/agent-auth";
import { getAgentContext } from "@/lib/agent-actions";

// GET /api/agent/context — compact, name-resolvable snapshot of properties,
// units, active leases/tenants and their open balances. Lets a trusted agent map
// a free-text command ("add a late fee to Evelyn") to the right lease before
// calling /api/agent/action. Bearer AGENT_API_TOKEN. Read-only.
export async function GET(request: Request) {
  if (!agentAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getAgentContext();
  return NextResponse.json(context);
}
