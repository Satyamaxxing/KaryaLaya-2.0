# KaryaLaya 2.0 — System Architecture

KaryaLaya 2.0 is a Work Operating System engineered for digital agencies (web development, video editing, social media management, branding, and design) to orchestrate high-stakes client delivery without chaos.

---

## 1. Directory Structure & Layering

```
karyalaya-2.0/
├── prisma/
│   ├── schema.prisma        # Canonical data models, indexes, and relations
│   └── seed.ts              # Idempotent realistic agency demo seed
├── src/
│   ├── app/                 # Next.js App Router (Routes, Pages, Handlers)
│   │   ├── (marketing)/     # Cinematic 3D landing page (WebGL Vortex, GSAP)
│   │   ├── (app)/app/       # Internal Agency Work OS (Dashboard, My Work, Projects, etc.)
│   │   ├── (client)/client/ # Scoped External Client Portal
│   │   └── api/             # HTTP endpoints (auth, health, webhooks, signed file downloads)
│   ├── components/          # Reusable UI primitives & domain widgets
│   │   ├── app-shell/       # Navigation, command palette, live notifications
│   │   ├── landing/         # Marketing 3D gravity bridge and workflow scenes
│   │   ├── ui/              # Buttons, dialogs, progress rings, status badges
│   │   └── work-os/         # DeliverableCard, TaskRow, WhyPanel, Comments
│   ├── server/              # Pure server-side business logic & security contracts
│   │   ├── auth/            # Session token verification, hashing, multi-tenant context
│   │   ├── permissions/     # Pure RBAC matrix and assertion utilities (assertCan)
│   │   ├── validation/      # Centralized Zod input validation schemas
│   │   ├── storage/         # Pluggable file storage engine (local filesystem provider)
│   │   ├── ai/              # Provider-agnostic AI engine (client draft, risk explanation)
│   │   ├── services/        # Domain services (AgencyWork, ClientPortal, Analytics, Automations)
│   │   └── logger.ts        # Structured logger & user-facing error handler
│   ├── styles/              # Pure Vanilla CSS design system (tokens.css, work-os.css)
│   └── lib/                 # Shared utilities, client hooks, and observability wrappers
└── test/                    # Integration and unit tests (Node.js test runner + tsx)
```

---

## 2. Request & Data Flow Architecture

Every mutation and query flows through 5 strict architectural boundaries:

```
┌────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ Browser Client │ ───► │ Next.js Route / Action  │ ───► │ Zod Validation Layer    │
└────────────────┘      │ (App Router)            │      │ (Schema Enforcement)    │
                        └─────────────────────────┘      └─────────────────────────┘
                                                                      │
                                                                      ▼
┌────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ SQLite DB      │ ◄─── │ Service Layer           │ ◄─── │ Security / RBAC Layer   │
│ (Prisma ORM)   │      │ (Domain Logic & Events) │      │ (assertCan / Scoping)   │
└────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

1. **Client / UI**: Renders accessible HTML with visible focus rings (`:focus-visible`), handles optimistic interactions, and respects `prefers-reduced-motion`.
2. **Route Handlers / Actions**: Authenticate session via secure HTTP cookies or magic link tokens.
3. **Zod Validation**: Validates inputs before any service logic executes, rejecting malformed payloads immediately.
4. **Security & Permissions**: Pure policy evaluation (`assertCan(user, action, context)`) enforces tenant isolation (`organizationId`) and role capabilities.
5. **Service Layer & Database**: Executes ACID transactions via Prisma ORM, checks optimistic concurrency locks, recalculates weighted progress, and dispatches immutable audit events.

---

## 3. Permission Model & Security Scoping

KaryaLaya enforces strict Multi-Tenant and Client-Isolation security guarantees:

### The 4 Canonical Roles
- **OWNER**: Full organizational governance, team management, project creation, financial/analytics access, and system settings.
- **MANAGER**: Full delivery execution, deliverable oversight, assigning tasks, sending work for client sign-off, and client communication.
- **MEMBER**: Focused operational access. Sees only work assigned to them via **My Work**, updates task status, logs hours, and uploads draft assets.
- **CLIENT**: External client contacts. Zero access to internal team workloads, estimates, internal comments, or risk metrics. Can only view client-facing deliverables, preview signed files, approve work, or request revisions.

### Critical Scoping Rules
- **Multi-Tenant Scoping**: Every database query includes `where: { organizationId: user.organizationId }`. Cross-tenant queries are blocked at both permission and database query layers.
- **Client Portal Scoping**: Queries are filtered by `clientId === user.clientId` and `visibility === 'CLIENT_VISIBLE'`. Internal tasks, checklist items, and employee notes are never selected in SQL queries for client requests.
- **Signed URL File Access**: Files are served through `/api/files/[id]/download` requiring either an active session or a time-limited HMAC-SHA256 signature with tenant and client boundary verification.

---

## 4. The ActivityEvent Pattern (Audit & Event Spine)

Rather than scattering history tracking across disparate tables, KaryaLaya uses a centralized, immutable **ActivityEvent** pattern:

```prisma
model ActivityEvent {
  id             String       @id @default(cuid())
  organizationId String
  actorId        String
  actorType      String       // USER | CLIENT_CONTACT | SYSTEM | AUTOMATION
  action         String       // e.g., DELIVERABLE_SENT_TO_CLIENT, CLIENT_APPROVED
  entityType     String       // PROJECT | DELIVERABLE | TASK | COMMENT
  entityId       String
  metadata       String?      // JSON payload capturing snapshot details
  createdAt      DateTime     @default(now())
}
```

### Benefits of the Pattern
- **Auditability**: Complete forensic history of who touched what deliverable or task and when.
- **Automation Pipeline**: Rules trigger directly on standardized event actions (e.g. `CLIENT_APPROVED`, `TASK_MOVED_TO_REVIEW`).
- **Real-Time Dashboards**: Powers the team activity feed, client portal timeline, and turnaround metrics.
- **AI Context Grounding**: The scoped AI service reads real ActivityEvents to explain risk chains and generate weekly summaries without fabricating data.

---

## 5. Concurrency & Optimistic Locking

To prevent race conditions and unintentional overwrites in collaborative agency environments:
- `Deliverable` and `Task` entities contain a numeric `version Int @default(1)` column.
- Update endpoints accept an optional `expectedVersion`.
- If the database `version !== expectedVersion`, the transaction aborts with a 409 Conflict:
  > *"Someone else updated this. Refresh to see the latest."*
- Every successful mutation atomically increments the `version` field.
- Client approval and revision actions are completely **idempotent**: duplicate clicks or rapid double-submissions safely return the existing approved state without creating duplicate events or tasks.

---

## 6. Observability & Health

- **Health Endpoint**: `GET /api/health` performs a database ping (`SELECT 1`) and returns uptime, database connection state, and version.
- **Structured Logging**: `src/server/logger.ts` produces standardized JSON logs with context and log levels (`info`, `warn`, `error`, `debug`).
- **Telemetry Hook**: `src/lib/observability/error-tracker.ts` is fully disabled by default for local development, enabling third-party tracking only when `NEXT_PUBLIC_ERROR_TRACKING_DSN` is configured.
