# Himalayan Properties App

Property-management platform for Himalayan Holding Property LLC (Denver / Erie, CO):
properties and units, tenants, leases, charges and payments, maintenance, applications,
insurance tracking, notices and announcements, plus a public listings site.

- **Live:** https://himalayanprop.cloud
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 + Shadcn/ui ·
  Prisma 6 + SQLite · NextAuth 4 · nodemailer (Resend SMTP)
- **Context for humans and AI agents:** [`AGENTS.md`](AGENTS.md) (architecture, data model,
  conventions, deploy) and [`DESIGN.md`](DESIGN.md) (design system). Keep both current.

## Run locally

```bash
cp .env.example .env      # fill in DATABASE_URL, NEXTAUTH_SECRET, SMTP_*, AGENT_API_TOKEN, CRON_SECRET
npm install               # postinstall runs prisma generate
npm run db:push           # apply prisma/schema.prisma to the SQLite file
npm run db:seed           # creates the base admin user
npm run dev               # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run db:studio`.

## Deploy

Production is a Hostinger VPS running the app under PM2 (`himalayan-prop`, port 3002)
behind CloudPanel. It is not Docker. The full procedure, gotchas and backup notes are in
`AGENTS.md` §9. Short version, on the server:

```bash
git pull && npm install && npx prisma db push && npm run build && pm2 restart himalayan-prop
```

## Repo hygiene

Never commit `.env*`, `*.db`, `private-uploads/`, `public/uploads/`, `tenant-records/` or
`vendor-records/` (all gitignored, some contain tenant PII). One-time data import scripts
live in `prisma/archive/` and are never run by deploy.
