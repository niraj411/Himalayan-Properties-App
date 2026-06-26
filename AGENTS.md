# AGENTS.md — Himalayan Properties App

> Portable project context for any AI coding agent (Antigravity, Gemini, Cursor,
> Claude Code, Codex, etc.). This is the single source of truth that lives **in the
> repo** so context travels with the code. Keep it current when architecture,
> conventions, or the deploy process change.
>
> Last synced: 2026-06-26.

---

## 1. What this is

A **property-management platform** for **Himalayan Holding Property LLC** (a Colorado
landlord entity; owner: Niraj "Raj" Gautam, niraj411@gmail.com). It runs the
landlord's residential + commercial portfolio: properties/units, tenants, leases,
rent + outstanding charges, payments, maintenance, applications, insurance tracking,
and tenant/admin notices.

- **GitHub:** `https://github.com/niraj411/Himalayan-Properties-App` (private)
- **Live site:** `https://himalayanprop.cloud`
- **Local path:** `/Users/himalaya/Himalayan Properties App`

---

## 2. Stack

- **Next.js 16** (App Router, route groups) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4** (CSS-first `@theme`, see `src/app/globals.css`) · **Shadcn/ui** on Radix
- **Prisma 6 ORM + SQLite** (single file DB; no external database)
- **NextAuth 4** (Credentials provider, bcrypt password hashes, JWT sessions)
- **nodemailer** SMTP for transactional email (prod = Resend SMTP)
- Supporting: `zod` + `react-hook-form` + `@hookform/resolvers`, `date-fns`,
  `lucide-react` (icons), `sonner` (toasts), `next-themes` (dark mode),
  `intuit-oauth` / `node-quickbooks` (QuickBooks accounting)

## 3. Run / build / db

```bash
npm run dev        # next dev on http://localhost:3000
npm run build      # production build (standalone output)
npm run start      # serve the production build
npm run lint       # eslint

npm run db:push    # prisma db push — apply schema.prisma to SQLite (preferred)
npm run db:studio  # prisma studio (DB browser)
npm run db:seed    # tsx prisma/seed.ts (creates the base admin user)
```

`postinstall` runs `prisma generate`. We use **`prisma db push`**, NOT
`migrate deploy` — SQLite, no migration history needed. `npx prisma generate`
after schema edits.

`DATABASE_URL` and all secrets come from `.env` (gitignored). See `.env.example`.

---

## 4. Architecture & directory map

Route groups under `src/app/` (parentheses = layout grouping, not URL segments):

- **`(admin)/admin/*`** — admin portal: `properties`, `properties/[id]`, `tenants`,
  `leases`, `leases/[id]`, `charges`, `payments`, `rent-roll`, `accounting`,
  `applications`, `maintenance`, `insurance`, `notices`, `messages`, `settings`
- **`(tenant)/dashboard/*`** — tenant portal: `lease`, `balance`, `payments`,
  `maintenance`, `utilities`, `notices`, `profile`
- **`(auth)/login`, `(auth)/register`**
- **Public:** `/` (marketing home), `/listings`, `/listings/[id]`, `/apply`

**API routes** (`src/app/api/*`): `agent`, `applications`, `apply-context`, `auth`,
`charges`, `cron`, `email`, `escalations`, `files`, `insurance`, `leases`,
`listings`, `maintenance`, `notices`, `payments`, `properties`, `quickbooks`,
`rent-roll`, `register`, `settings`, `tenant-payments`, `tenants`, `units`,
`upload`, `utilities`.

**`src/lib/`** (domain logic — reuse these, don't re-implement):
| File | Purpose |
|---|---|
| `auth.ts` | NextAuth config (credentials, role in JWT) |
| `db.ts` | Prisma client singleton |
| `email.ts` | `sendEmail({ to, subject, text, cc?, replyTo? })` via nodemailer SMTP |
| `notices.ts` | Notice templates (LATE / DEMAND / CO_DEMAND / CUSTOM) |
| `insurance.ts` | Insurance expiry / reminder logic |
| `ledger.ts` / `ledger-db.ts` | Payment ↔ charge allocation (explicit, not auto-FIFO) |
| `quickbooks.ts` | QuickBooks OAuth + report fetch (accounting only) |
| `utilities.ts` | Per-property utility provider helpers |
| `nav.ts` | Shared nav config (sidebar categories) |
| `agent-auth.ts` / `agent-actions.ts` | Token-gated agent action API (see §8) |
| `utils.ts` | `cn()` class merge |

**`src/middleware.ts`** gates routes via NextAuth; exempts `/api/cron` and
`/api/agent/*` (they use their own token auth).

---

## 5. Data model (Prisma — `prisma/schema.prisma`)

Core graph: **User** (`ADMIN`/`TENANT`) → **Tenant** → **Unit** → **Property**.
A **Lease** ties a primary `Tenant` + `Unit`; co-signers attach via the
`coTenants` relation (jointly/severally liable). Money flows through **Charge**
(what's owed) and **Payment** (what came in, optionally allocated to a Charge).

Important model semantics — read before touching billing or files:

- **Charge** — one-off/outstanding amounts billed to a lease (`RENT`, `LATE_FEE`,
  `UTILITY`, `FINAL`, `CLEANING`, `DEPOSIT`, `OTHER`; status `OPEN|PAID|WAIVED`).
  Baselane is the real billing system (no API), so charges are **maintained by hand**
  in the admin UI. `amountPaid` tracks the portion settled; remaining = `amount - amountPaid`.
- **Payment** — optional `chargeId` allocates a payment to a charge. Allocation is
  **explicit, not auto-FIFO** (rent itself isn't always a Charge). See `lib/ledger.ts`.
- **Lease.nnnMonthly** — triple-net (NNN/CAM) additional rent for commercial leases;
  total monthly = `monthlyRent` (base) + `nnnMonthly`.
- **Lease** deposit fields (`depositStatus` HELD/RETURNED/PARTIAL_RETURN, return
  date/amount/deduction notes) + `documentUrl` (e.g. `/api/files/Lease-X.pdf`).
- **Notice** — every outbound late/demand notice is logged here (subject, body,
  to/cc/replyTo, amountDue snapshot, SMTP messageId, status) so it's viewable,
  auditable, and re-sendable. CO_DEMAND = commercial 3-day demand (C.R.S. § 13-40-104).
- **InsuranceRecord** — renters (residential, `ADDITIONAL_INTEREST`) vs liability
  (commercial, `ADDITIONAL_INSURED`); tracks carrier/policy/coverage/expiry +
  `documentUrl` (COI). `Lease.insuranceRequired` can exempt a lease.
- **Utility** — per-property/unit providers. Fields `accountNumber`, `monthlyCost`,
  `dueDay`, `internalNotes` are **ADMIN-ONLY — never send to tenants**;
  `tenantNotes` + `tenantVisible` are the tenant-facing parts.
- **MaintenanceRequest** — completing one can spawn a `Charge` (`chargeId` prevents
  duplicate billing); `contractor`/`repairCost`/`paymentMethod` are internal.
- **Settings** — singleton: company info, Baselane link, Zillow URL, email toggle,
  insurance reminder toggle + lead days.

---

## 6. Conventions & hard rules

These are non-negotiable, learned from real incidents. Follow them.

### 6.1 Never put sensitive files under `public/`
Anything in Next.js `public/` is served to the open internet with **no auth**.
- Listing **photos** → `public/uploads/properties/` (meant to be public).
- **Leases, insurance certs, IDs, bank statements, any tenant-private doc** →
  `private-uploads/` (root-level, not web-served), served only through the
  auth-gated `GET /api/files/[filename]` route (admin, or the tenant on the related
  Lease/InsuranceRecord; otherwise 404, no existence leak).
- `POST /api/upload` routes by `type` form field: `type=property` → public, else private.
- When in doubt, treat an upload as private.

### 6.2 Build features, not one-off scripts
**Every capability = UI action + API route + persisted/viewable record.** Do not do
real work via throwaway VPS scripts — anything done by script is invisible to the
owner and unmaintainable (e.g. an email sent by script leaves no Message/Notice log).
- `prisma/add-*.ts` seeds are acceptable **only** for one-time bulk data imports.
- Ongoing create/edit goes through the admin forms + `/api/*` routes.
- Outbound email/notices route through the app (`lib/email.ts` + `Notice` model),
  never direct SMTP scripts.

### 6.3 Writing style for any user-facing prose
When drafting emails, tenant notices, or messages: **no em-dashes or en-dashes**
(use commas/periods or restructure), and avoid AI-polished tells (parallel triads,
"I appreciate…", "I look forward to…", over-balanced clauses). It should read like
Raj typed it himself. Outward emails always need owner confirmation before sending.

### 6.4 Design system — tokenized (see `DESIGN.md` for the full philosophy)
The whole app is standardized on Material-3-style tokens defined in
`src/app/globals.css`. The aesthetic is "Elevated Sanctuary": tonal layering,
generous whitespace, **no 1px borders for sectioning**.
- **Accents → the `primary` token only**: `text-primary`, `bg-primary/10`,
  `border-primary/20`. No `blue-*`, `purple-*`, `teal-*`, `emerald-*` accents.
- **Buttons**: the Shadcn `Button` **default** variant is already the brand violet
  gradient (`from-primary to-primary-container`). Don't override its bg. Inverse CTA
  on a violet background = `bg-white text-primary`.
- **Surfaces** (tonal layers, no borders): `bg-surface` → `bg-surface-container-low`
  → `bg-surface-container-lowest` (cards/white) → `bg-surface-container-high`.
  Text = `text-on-surface` (never `text-black`/`#000`).
- **Status hues are canonical**: success `green-*`, warning `amber-*`,
  danger `red-*`/`destructive`. No orange/yellow/emerald.
- **No hardcoded hex in `className`** — use tokens. Guard:
  `grep -rE "(blue|purple|teal|emerald|orange|yellow)-[0-9]{2,3}|\[#" src --include="*.tsx"`
  should stay empty.
- Corners ≥ `rounded-xl` (`rounded-2xl` for hero cards). Ambient shadow only
  (`shadow-ambient`). Ghost border `border-outline-variant/15` only if truly needed.
  Glassmorphism (`bg-surface/80 backdrop-blur`) for nav/overlays.

### 6.5 Git hygiene
Gitignored, never commit: `.env*`, `*.db` (incl. `dev.db`, `prisma/dev.db`),
`/private-uploads`, `/public/uploads`, `tenant-records/` (PII), `.next/`,
`.playwright-mcp/`. Branch off `main`; only commit/push when asked.

---

## 7. Integrations

- **Baselane** — rent collection via a payment **link** (no API). Global link in
  `Settings.baselanePaymentLink`, per-tenant override on `Tenant.baselaneLink`.
  Tenant portal renders it as a button.
- **QuickBooks** — OAuth, **accounting reports only** (P&L, balance sheet); the
  payments piece was removed. Tokens in `QuickBooksToken`.
- **Zillow** — residential applications. Global `Settings.zillowUrl`, per-property
  `Property.zillowUrl`; `/apply` prefers the property URL, falls back to global.
- **Email** — nodemailer SMTP (prod = Resend, `from noreply@himalayanprop.cloud`).
  Auto-fires on: payment recorded, maintenance status change, lease created,
  application submitted, insurance reminder. Toggled by `Settings.emailNotificationsEnabled`.

---

## 8. Agent action API (trusted automations)

External trusted agents (the owner's "Jarvis" assistant + a Telegram command) can
take **safe writes**, not just reads:
- `GET /api/agent/context` (name-resolvable snapshot) and `POST /api/agent/action`.
  Code in `src/lib/agent-auth.ts` + `src/lib/agent-actions.ts`, routes under
  `src/app/api/agent/`.
- Bearer **`AGENT_API_TOKEN`** (in `.env`). Exempt from NextAuth middleware.
- Allowed actions (each writes a viewable record, reusing app logic):
  `create_charge`, `mark_charge_paid`, `waive_charge`, `record_payment`,
  `send_notice`, `request_insurance`, `log_message`, `add_utility`.
  **No deletes, no settings edits, no lease edits.** Outward emails need confirmation.

---

## 9. Deploy

Production runs on a **Hostinger VPS** (Ubuntu 24.04 + CloudPanel), under **PM2**
(process `himalayan-prop`, port **3002** behind the CloudPanel proxy). It is **not**
Docker, despite the repo's `Dockerfile`/`docker-compose.yml`. App lives at
`/home/himalayanprop/htdocs/himalayanprop.cloud/`; DB at `data/himalayan.db`.

> Connection details (VPS host/IP, SSH key path) are kept in the local
> `~/.claude/commands/himalayan.md` and the owner's environment, not duplicated here.

**Standalone gotcha (critical):** Next's standalone build does **not** copy `public/`
or `private-uploads/`. After every `npm run build` you must mirror both into
`.next/standalone/`, or photos/PDFs 404. The deploy one-liner does this:

```bash
git pull && npm install && npx prisma db push && npm run build \
  && mkdir -p .next/standalone/public/uploads/properties .next/standalone/private-uploads \
  && cp -ru public/uploads/. .next/standalone/public/uploads/ \
  && cp -ru private-uploads/. .next/standalone/private-uploads/ \
  && pm2 restart himalayan-prop
```

Seed scripts (`prisma/add-*.ts`) are **not** auto-run by deploy; run them manually on
the VPS for one-time data imports, then re-mirror `private-uploads/` and `pm2 restart`.

**Backups:** SQLite `.backup` to `/root/db-backups/` on the VPS, pulled offsite via
`scp`. No automated nightly yet (known gap).

---

## 10. People / places directory & tenant records (kept OUT of git)

Tenant/lease specifics and the landlord directory contain PII and are **deliberately
not in this repo**:
- **`tenant-records/*.md`** — per-tenant Markdown (gitignored); regenerate on the VPS
  via `prisma/generate-tenant-records.ts`.
- The **landlord/tenant/vendor directory** (entity legal names, addresses, contacts,
  guarantors, attorneys, integration accounts) lives in the owner's local
  `himalayan-property` skill, not in source control.

When you need a "who/where" detail (an address, a contact, an account), pull it from
those sources or the database — do not hardcode tenant PII into committed files.
