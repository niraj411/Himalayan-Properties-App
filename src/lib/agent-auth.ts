// Bearer-token auth for the agent action surface (/api/agent/*).
// Lets trusted external agents (Jarvis dashboard, freeroam Telegram bot) take a
// controlled set of SAFE write actions without a browser session. The token is
// AGENT_API_TOKEN in .env (never in source). Distinct from CRON_SECRET (insurance
// cron) and the NextAuth session used by the admin UI.

export function agentAuthorized(request: Request): boolean {
  const token = process.env.AGENT_API_TOKEN;
  if (!token) return false; // fail-closed: no token configured => no agent access
  const header = request.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  return !!m && m[1].trim() === token;
}
