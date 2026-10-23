# clinicOS — Clinic Management System (Project Map)

## [TECH_STACK]

- **Framework:** Next.js 16.4.0 (Turbopack, App Router, React Server Components + Server Actions)
- **Language:** TypeScript 7.0.2 (strict, `noUncheckedIndexedAccess` on)
- **Styling:** Tailwind CSS 4.3.3 (CSS-first config in `globals.css`), hand-written shadcn-compatible UI kit
- **Database:** PostgreSQL 16.3 (local, `clinicos` db) via Prisma 7.9.1
  - Driver adapter `PrismaPg` (`@prisma/adapter-pg`), pg 8.16.3; config in `prisma.config.ts`; client generated to `src/lib/generated/prisma`
  - ⚠️ Keep `@prisma/*` at 7.9.1 — 7.10.0 has a broken publish (missing `@prisma/driver-adapter-utils`)
- **Auth:** Better Auth 1.7.7 (email/password) + Next-Auth cookie; `toNextJsHandler` at `/api/auth/[...all]`
- **i18n:** next-intl 4.14.9 — locales `ar` (default, RTL) & `en`, `localePrefix: "as-needed"`, Proxy (Next 16 renamed middleware→`proxy.ts`)
- **Forms/validation:** react-hook-form + zod 4.6.5
- **Other:** lucide-react icons, sonner toasts, next-themes, recharts 3.10.1 (reports later), @tanstack/react-query (installed, provider not yet wired), motion, vitest 5, Playwright
- **Scripts:** `dev` (port 3000), `build`, `db:migrate` (`prisma migrate dev`), `db:seed` (`tsx prisma/seed.ts`), `db:studio`, `lint`, `test`

## [SYSTEM_FLOW]

```
Browser (Next.js, RTL ar/en)
  → Proxy (src/proxy.ts)  → Next.js App Router (src/app/[locale]/…)
       ├── (app)  : protected shell — layout does getSessionUser + filterNav by role
       │            ├── dashboard, patients, appointments, reception, encounters,
       │            │   lab, pharmacy, inventory, billing, reports, audit, settings
       │            └── every page calls requirePermission("<module>:<action>")
       ├── (auth) : login
       └── /api/auth/[...all] : Better Auth handlers (sign-in/email, get-session)
Server components / Server Actions
  → core/ (logging, audit.recordAudit, rbac.can via React cache, settings, auth.session)
  → prisma client (src/lib/db.ts singleton, PrismaPg adapter)
  → PostgreSQL 16 (clinicos)
```

- Every write-action: **permission check → mutate → `recordAudit({ action, entity, entityId, metadata })` → redirect/toast**
- MRN/invoice/etc. numbering via atomic `NumberSequence` per clinic (`nextMrn` upsert+increment in a transaction)
- RBAC: Role ↔ Permission (grant table). `super_admin` matches wildcard `*`.
- Icons in nav are referenced by `iconKey` only — nav data crosses server→client boundary safely (`nav-icons.ts` resolves them).
- i18n dictionary lives in `src/messages/{en,ar}.json`; components may render shared UI with `getTranslations("common")`.

## [ARCHITECTURE]

```
src/
├─ proxy.ts                       # next-intl routing middleware (Next 16: proxy)
├─ middleware/                    # (reserved)
├─ app/
│  ├─ globals.css                 # design tokens, dark theme, accents, density, RTL
│  ├─ api/auth/[...all]/route.ts  # toNextJsHandler(auth)
│  └─ [locale]/
│     ├─ layout.tsx               # fonts, ThemeProvider, AppPreferences, Toaster, RTL
│     ├─ (auth)/login/            # Better Auth sign-in UI (+form comp)
│     ├─ (app)/                   # protected shell: layout guards session + nav perms
│     │   ├─ layout.tsx
│     │   ├─ page.tsx             # dashboard (live counts)
│     │   ├─ patients/            # M1 ✓ list+search+filter, new, [id] detail, [id]/edit (actions + PatientForm)
│     │   ├─ appointments/        # M2 ✓ week grid (30-min slots), new, [id] detail + status transitions, [id]/edit (actions + conflict detection)
│     │   ├─ reception/           # M3 ✓ today's queue board (waiting/in-service/completed/unattended), check-in + call + complete actions, walk-in shortcut
│     │   ├─ encounters/          # M4 ✓ SOAP+vitals, diagnoses, orders (med/lab/imaging), complete visit, status engine
│     │   ├─ billing/             # M5 ✓ invoice builder (discount/tax), payments, void, status recompute
│     │   ├─ lab/                 # M6 ✓ queue, tests catalog, results entry + verify (auto-completes order)
│     │   ├─ pharmacy/            # M6 ✓ dispense with optional inventory deduction → Dispensation
│     │   ├─ imaging/             # M6 ✓ perform/report flow (modality per request)
│     │   ├─ inventory/           # M6 ✓ items CRUD + movements (purchase/dispense/adjust/return/damage)
│     │   ├─ reports/  audit/  settings/  # M7 charts via recharts (M0 baselines ✓)
│     │   └─ 403/page.tsx
│     └─ api/patients/search/route.ts  # JSON patient search for picker (RBAC-gated)
├─ components/
│  ├─ ui/                         # hand-written primitives (button→sonner; button/badge now include success/info/warning)
│  ├─ layout/                     # app-shell, sidebar-content, header, command-menu, page-header, brand, nav.ts
│  ├─ providers/                  # theme-provider, app-preferences
│  ├─ settings/ preferences/      # clinic settings form, preferences panel
│  ├─ patients/                   # M1 components
│  ├─ appointments/               # M2 components
│  │                             #   patient-picker, appointment-form, appointment-week-grid, appointment-status-actions
│  ├─ reception/                  # M3 components: reception-board (grouped sections), reception-status-actions
│  │                             #   (primary next action + overflow dropdown; cancel/no-show via window.confirm)
│  ├─ encounters/                 # M4: encounter-chart (tabs), serialize.ts, new-encounter-form, start-visit-button
│  ├─ billing/                    # M5: new-invoice-form, invoice-actions, delete-item-button
│  ├─ lab/                        # M6: add-test-form, lab-result-form, lab-verify-button
│  ├─ pharmacy/ imaging/ inventory/  # M6: dispense-form, imaging-actions, new-item-form, movement-form
│  ├─ reports/                    # M7: reports-charts (recharts Line/Bar/Pie, empty hints)
│  ├─ users/                      # M7: create-user-form, toggle-user-button
│  └─
├─ core/                          # framework-agnostic business/service layer
│  ├─ auth/{server,client,session}.ts
│  ├─ rbac/catalog.ts             # PERMISSION_CATALOG (incl. imaging module), ROLE_PERMISSIONS, RoleCode
│  ├─ rbac/index.ts               # can(permission, roleIds)
│  ├─ audit.ts                    # recordAudit (reads user from session)
│  ├─ logging.ts                  # log.info/warn/error
│  ├─ settings.ts                 # getSettings/upsertSetting
│  └─ nav-permissions.ts          # filterNav(nav, user)
├─ i18n/{routing,navigation,request}.ts
├─ lib/{db.ts, utils.ts(cn), dates.ts(week helpers), patient.ts, sequence.ts(nextNumber/peekNumber), format.ts}
└─ messages/{en,ar}.json
prisma/
├─ schema.prisma                  # User/Session/Account/Verification, RBAC, AuditLog,
│                                 # SystemSetting, Clinic/Branch/Department/Room,
│                                 # NumberSequence, Patient (M1), Appointment + enums (M2),
│                                 # Encounter/Diagnosis/Order/Lab/Imaging/Dispensation/
│                                 # InventoryItem+Movement/Invoice/Item/Payment (M4–M6)
├─ seed.ts                        # idempotent: permissions→roles→grants→clinic→sequences→admin
├─ demo-patients.ts               # dev-only: 7 demo patients (used for screenshots/testing)
├─ demo-appointments.ts           # dev-only: physician user + 7 appointments in current week
├─ demo-ops.ts                    # dev-only: encounters, lab tests+results, imaging, dispensations, inventory, invoices
└─ migrations/                    # _init, _add_patients, _add_appointments, (M4–M6 tables auth-migrated)
```

## Milestones

- **M0 Foundation ✓** shell, i18n ar/en, RBAC (39 perms / 14 roles / 133 grants), Better Auth, settings/audit/reports baselines.
- **M1 Patients ✓** MRN auto-numbering via NumberSequence, CRUD + search/filter/pagination, detail + edit, 7 demo patients (`P00001`–`P00007`).
- **M2 Appointments ✓** week calendar grid, book/edit with doctor-overlap conflict detection, status workflow (SCHEDULED→CONFIRMED→ARRIVED→IN_SERVICE→COMPLETED incl. CANCELLED/NO_SHOW), patient JSON search API, demo physician + 7 weekly appointments.
- **M3 Reception ✓** today queue board (waiting / with doctor / completed / unattended), one-click check-in → call → complete via existing status engine, walk-in shortcut to new appointment.
- **M4 Encounters/EMR ✓** patient chart (SOAP, vitals, diagnoses, orders), start-visit button on appointments, encounter detail + new form, complete-visit transitions appointment→COMPLETED.
- **M5 Billing ✓** invoice builder (multi-line items, discount/tax), sequential `INV-xxxxx` via NumberSequence, payments by method, voiding, auto status recompute, list w/ filters + balances.
- **M6 Lab / Pharmacy / Imaging / Inventory ✓** lab tests catalog + results entry/verify; imaging perform/report; pharmacy dispense (optional stock deduction); inventory items + 5 movement types ($permission: `imaging` module added to RBAC catalog).
- **M7 Reports + Users ✓** reports aggregates + recharts (revenue 14d, appointments 7d, status/gender splits, top billed kinds, visits by doctor); users admin (create via auth.api.signUpEmail, toggle active, **assign role via inline select**) gated `users:manage`.
- **M8 Polishing ✓** dashboard upgrade (6 live stat cards, pendingOrders badge, 14d revenue + 7d appointment recharts, quick actions), invoice toast fixes (`billing.actionFailed` + per-call success keys), encounter→invoice shortcut (`/billing/new?patient=<id>` prefills the patient), users role editing via server action `assignRole`.
- **Tests ✓** vitest 5 + `vitest.config.ts` — 3 suites (dates, format, RBAC catalog), 14 passing; `npm test`.
- **Demo data ✓** `prisma/demo-ops.ts` idempotent (self-cleaning) — 5 encounters w/ vitals+doses+orders (lab results verified, imaging reported, 1 dispensation), inventory opening stock, 2 paid invoices.

## [ORPHANS & PENDING]

- **@tanstack/react-query** installed but provider not added yet (hold until tables/grids need client state).
- **Files/storage** (STORAGE_DIR, local private disk) designed but no file upload yet.
- **Branch/Department/Room** tables exist but no UI; Room needed by schedule/encounters later.
- **OTP/magic-link, 2FA** — not yet.
- **app-preferences accent/density** stored in localStorage only (not server-side).
- **Lint blocked upstream**: `eslint.config.mjs` (flat, nextVitals+nextTs) committed, but TS-aware lint cannot run — bundled `typescript-eslint` (8.71.1, latest on npm) declares peer `typescript <6.1.0`; project pins TS 7.0.2 (no-bump policy). Re-check when typescript-eslint supports TS 7; rely on `next build` type-check meanwhile.
- **Imaging detail route for every demo patient** — only some demo encounters have an imaging request.
- **Data cleanup tools** (patient merge, date-range record purge) — not built.

## Ident / Conventions

- Do NOT add code comments unless asked. Components: SRP, `cn()` util, kebab-case files, PascalCase exports.
- Protected pages must call `requirePermission(...)`; write paths must `recordAudit(...)`.
- Enums are stored upper-case (MALE/FEMALE, ACTIVE…). Dates UTC; display via clinic timezone.
- Verify with `npm run build` and keep Prisma pinned 7.9.1.
- Prisma 7: `npx prisma db seed` is ignored (no `migrations.seed` in `prisma.config.ts`) — run seeds via `npx tsx prisma/seed.ts` / `prisma/demo-*.ts`.
- `LabRequest`/`ImagingRequest`/`MedicalOrder` expose `patientId` **only** (no `patient` relation) — pages fetch patients separately.
- Better Auth origin check: requests (incl. smoke/API) must send `Origin: http://localhost:3000`.
- Smoke: `npx next start -p 3100` detached via `cmd /c`; login via `/api/auth/sign-in/email` (origin header set), then GET routes expecting 200.