# Dragon City — Mall Management System

Production app for **Dragon World (龙城), Riyadh** — property, finance, leasing, tickets, and merchant portal.

Stack: **Next.js 16 + React 19 + Supabase (Auth / Postgres / Storage / RLS)**.

---

## Quick start

```bash
cd dragon-city
cp .env.local.example .env.local   # fill keys from Supabase project settings
npm install
npm run create-admin               # first admin user (if needed)
npm run dev                        # http://localhost:3000
```

### Environment (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser / SSR anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (accounts, cron, migration) |
| `SMTP_*` | Optional email for due/expiry reminders |
| `CRON_SECRET` | Bearer token for `/api/cron/notify` |

Supabase project is already linked (`dragon city`). Migrations live in `supabase/migrations/`.

```bash
npm run db:push      # apply pending migrations
npm run db:types     # regenerate src/lib/supabase/database.types.ts
```

---

## Roles

| Role | Access |
|------|--------|
| `admin` | Everything + Accounts + Admin system |
| `operations` | Map, merchants, leasing, tickets |
| `finance` | Finance, dashboards, tickets (finance dept) |
| `maintenance` | Map + tickets (maintenance) |
| `merchant` | `/portal` only (own shops, invoices, docs, tickets) |

Accounts are **admin-provisioned only** (no public signup). Create staff via Supabase Auth + profile role, or merchant accounts from **Accounts**.

---

## Staff workflows

### Map
1. Open **Map** — interactive floor plan (Plan) or zone **Grid**.
2. Switch floors from the top tabs.
3. Search / filter by status; click a shop for detail, lease, and status.
4. Linked shops for the same merchant highlight together.

### Merchants & leases
- **Merchants** list → open detail for leases, invoices, documents.
- Assign occupancy from the map shop dialog (creates a lease row; history is append-only).
- CSV export/import from Merchants page.

### Finance
1. **Create invoice** → optionally **Apply confirmation-letter template**.
2. Line amounts can be negative (deductions / already paid). Total = sum of lines.
3. Record payments; lock lease when overdue as needed.
4. Upload documents with a **doc type** (always pick an existing merchant).

### Leasing pipeline
- **Leasing** board: inquiry → negotiation → won / lost.
- Convert a won lead into a merchant record.

### Tickets & notifications
- Department-routed tickets; merchants can submit from the portal.
- Daily cron (`vercel.json`: 06:00 UTC) hits `/api/cron/notify` with `Authorization: Bearer $CRON_SECRET`.
- In-app bell always works; email needs SMTP.

### Admin
- Price standards, notification rule templates, audit log, floor metadata.

### Languages
- Switcher: English / 中文 / العربية (RTL). Preference stored in browser (`dc-locale`).

---

## Prototype data migration

One-time import from `../mall-shop-manager` (shops, merchants, geometries, PDFs, invoices from lease obligations):

```bash
node --env-file=.env.local scripts/migrate-from-prototype.mjs --dry-run
node --env-file=.env.local scripts/migrate-from-prototype.mjs
# PDFs only (after merchants exist with proto_id= in notes):
node --env-file=.env.local scripts/migrate-from-prototype.mjs --only-pdfs
```

Expected ballpark after a full run: ~452 units, ~452 geometries, ~75 merchants, ~100+ documents.

---

## Deploy (Vercel + Supabase)

1. Push this repo; import **dragon-city** on Vercel.
2. Set the same env vars as `.env.local` (including `CRON_SECRET` and SMTP if used).
3. Ensure Supabase Auth redirect URLs include the Vercel domain.
4. Confirm Storage buckets `documents` and `floor-plans` exist (created by migrations).
5. Enable Supabase backups / PITR in the project dashboard.
6. Smoke-test: login as admin → Map shows 1F shops → open a merchant → Finance invoice → Portal as merchant.

### Cron auth

```http
GET /api/cron/notify
Authorization: Bearer <CRON_SECRET>
```

---

## Project layout

```
dragon-city/
├── src/app/(staff)/     # map, merchants, finance, leasing, tickets, admin…
├── src/app/(merchant)/  # portal
├── src/components/      # UI
├── src/lib/supabase/    # clients + generated types
├── supabase/migrations/ # source of truth for schema + RLS
└── scripts/             # create-admin, migrate-from-prototype
```

Do **not** treat `mall-shop-manager/` as production — it is the domain/data reference only.
