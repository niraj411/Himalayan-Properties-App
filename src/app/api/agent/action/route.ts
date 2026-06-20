import { NextResponse } from "next/server";
import { agentAuthorized } from "@/lib/agent-auth";
import { runAgentAction, AGENT_ACTIONS } from "@/lib/agent-actions";

// POST /api/agent/action — execute one SAFE action on behalf of a trusted agent
// (Jarvis / freeroam). Bearer AGENT_API_TOKEN. Body: { action, ...params }.
// Returns { ok, summary, record? } — `summary` is a human-readable confirmation
// the calling channel echoes back to the user. Every action writes a viewable DB
// record (Charge, Notice, Payment, Message, Utility). No deletes / settings.
export async function POST(request: Request) {
  if (!agentAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = typeof payload.action === "string" ? payload.action : "";
  if (!action) {
    return NextResponse.json({ error: `Missing "action". Allowed: ${AGENT_ACTIONS.join(", ")}` }, { status: 400 });
  }
  // params = everything except the action key
  const { action: _omit, ...params } = payload;
  void _omit;

  const result = await runAgentAction(action, params as Record<string, unknown>);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
