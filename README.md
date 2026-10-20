# KaryaLaya 2.0 — The Work Operating System for Modern Digital Agencies

> **The Center of Gravity for Modern Work.**  
> KaryaLaya 2.0 is a specialized Work Operating System engineered exclusively for digital agencies (web development, video editing, social media management, branding, and creative design) to manage high-stakes client delivery without chaos.

---

## 🔄 The Agency Core Loop (The Spine of KaryaLaya)

```
[Agency Owner] Creates Client & Project
       │
       ▼
[Manager / Lead] Adds Deliverables (Web, Reel, Brand Kit, Campaign)
       │
       ▼
[Lead] Assigns Atomic Tasks to Team Members (Dev, Designer, Video Editor)
       │
       ▼
[Team Members] See work in "My Work", update progress, upload files
       │
       ▼
[Executive Dashboard] Automatically updates progress & health metrics
       │
       ▼
[Agency Owner] Shares scoped Client Portal link with external Client
       │
       ▼
[External Client] Reviews deliverables, approves or requests revisions
       │
       ▼
[Feedback Loop] Client change requests route back as actionable tasks/notifications
```

---

## 👥 Canonical Roles & Permissions

KaryaLaya strictly enforces 4 roles with server-level boundary security:

| Role        | Classification | Permissions Scope                                                                                                                                               |
| :---------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OWNER**   | Internal       | Full administrative authority over agency settings, financials, team allocation, and client workspaces.                                                         |
| **MANAGER** | Internal       | Full delivery oversight: creates deliverables, manages tasks, reviews work, and manages client communications.                                                  |
| **MEMBER**  | Internal       | Creative & technical specialists (web dev, video editor, designer, social strategist). Focused access on assigned work via **My Work**.                         |
| **CLIENT**  | External       | Scoped external partner. Zero access to internal team workloads or draft notes. Has read-only progress views, file preview, and sign-off / revision capability. |

---

## 📁 Repository Structure

```
karyalaya-2.0/
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Cinematic 3D landing page (Three.js WebGL vortex, GSAP ScrollTrigger)
│   │   │   └── page.tsx
│   │   ├── (app)/app/            # Internal Agency Work Operating System
│   │   │   ├── layout.tsx        # AppShell with persistent state provider
│   │   │   ├── dashboard/        # Operational command center ("Needs You", progress rings, health drivers)
│   │   │   ├── my-work/          # Member-focused assigned task workflow
│   │   │   ├── clients/          # Client directory & delivery status
│   │   │   ├── projects/         # Project portfolio & deliverable pipelines
│   │   │   │   └── [id]/         # Deep project inspection & deliverable breakdown
│   │   │   ├── calendar/         # Production schedule & milestones
│   │   │   ├── social/           # Social media reels & campaigns
│   │   │   ├── documents/        # Asset & deliverable files
│   │   │   ├── team/             # Team roster & capacity management
│   │   │   └── settings/         # Agency configuration & client portal preferences
│   │   ├── (client)/client/      # Scoped External Client Portal
│   │   │   └── projects/[id]/    # Clean, distraction-free approval interface
│   │   ├── api/                  # Server API routes
│   │   │   └── health/           # System status endpoint
│   │   └── layout.tsx            # Global HTML document layout & smooth scroll
│   ├── components/
│   │   ├── app-shell/            # Sidebar, Topbar, CommandPalette, NotificationsPanel
│   │   ├── background/           # Three.js WebGL Vortex canvas
│   │   ├── landing/              # 3D gravity bridge and narrative GSAP scenes
│   │   ├── smooth-scroll/        # Lenis smooth scrolling (bypassed on internal app routes)
│   │   ├── ui/                   # Shared UI primitives (StatusMarks, Badges, Modals)
│   │   └── work-os/              # Domain components (DeliverableCard, TaskRow, WhyPanel)
│   ├── server/                   # Server-side business logic & security contracts
│   │   ├── auth/                 # Role types & session validation
│   │   ├── permissions/          # Fine-grained authorization checks
│   │   ├── db/                   # Database client interfaces
│   │   └── services/             # Agency domain operations
│   ├── lib/
│   │   ├── data/                 # Canonical seed dataset (BrightWave Dental, Apex Global)
│   │   └── state/                # WorkStateProvider React context with state mutators
│   ├── styles/
│   │   ├── tokens.css            # Canonical design tokens (surfaces, accents, hairpins)
│   │   ├── work-os.css           # Pure Vanilla CSS grid layout and UI utility classes
│   │   └── globals.css           # Global reset & typography
│   └── types/
│       └── work-os.ts            # Authoritative TypeScript domain models
├── .env.example                  # Environment variable template
├── .prettierrc                   # Code formatting rules
├── eslint.config.mjs             # Next.js ESLint configuration
└── tsconfig.json                 # Strict TypeScript configuration
```

---

## 🎨 Design System & App Shell Architecture

- **Opaque Surfaces:** Sidebar (`--kl-surface-0` / `#060913`) and Topbar (`--kl-surface-0`) are 100% opaque, preventing content bleeding.
- **CSS Grid Shell:** Desktop layout utilizes a strict CSS Grid (`260px 1fr`). Main content is automatically offset and never overlaps the sidebar.
- **Independent Scroll:** The sidebar has dedicated scroll (`height: 100vh; overflow-y: auto;`).
- **Mobile Responsive Drawer:** Collapses into an off-canvas drawer on screens `< 1024px` with a darkened backdrop and `Escape` key dismissal.
- **Bounded Health Drivers Popover:** Displays project risk factors on click/hover with automatic viewport-edge detection to prevent clipping.

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 20.9.0`
- npm `>= 10.0.0`

### 1. Installation

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the cinematic marketing experience, or navigate directly to:

- **Agency Executive Dashboard:** [http://localhost:3000/app/dashboard](http://localhost:3000/app/dashboard)
- **External Client Portal:** [http://localhost:3000/client/projects/proj-bgc](http://localhost:3000/client/projects/proj-bgc)

### 4. Database Setup & Seeding

```bash
# Push schema to database (SQLite)
npx prisma db push

# Seed demo agency with team members, deliverables, and clients
npm run db:seed
```

### 5. Local Database Backup & Restore

Because KaryaLaya uses a local SQLite database in development, backing up and restoring is straightforward and zero-overhead:

#### Creating a Backup
Using the SQLite CLI safe online backup:
```bash
# Windows PowerShell
sqlite3 prisma/dev.db ".backup 'prisma/backup.db'"

# Or simple file copy when server is idle:
Copy-Item prisma/dev.db prisma/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db
```

#### Restoring from Backup
```bash
# Stop dev server, then restore database:
Copy-Item prisma/backup.db prisma/dev.db -Force

# Regenerate Prisma Client if schema changed:
npx prisma generate
```

### 6. Running Automated Tests

All 13 test suites (119 automated tests) run locally with zero external dependencies via Node.js native test runner:

```bash
# Run all test suites
npm test

# Run a specific test suite (e.g. Phase 12 Production Readiness)
npx tsx --test test/phase12-production-readiness.test.ts
```

### 7. Quality & Code Audits

```bash
# Verify TypeScript strict type-checking
npm run typecheck

# Verify ESLint rules
npm run lint

# Check dependencies
npm audit
```

---

## 🔒 Security & Production Readiness Checklist (Phase 12)

- [x] **Multi-Tenant Scoping**: Every query scoped by `organizationId`. Cross-tenant leaks prevented at database and assertion layers.
- [x] **Client Portal Isolation**: Scoped by `clientId` and `CLIENT_VISIBLE`. Internal task lists, employee rates, hours, and internal notes are never sent to external clients.
- [x] **Optimistic Locking**: `Deliverable` and `Task` entities use a `version` field. Stale edits return `"Someone else updated this. Refresh to see the latest."`.
- [x] **Idempotent Client Actions**: Client approval and revision actions handle double-clicks and repeated requests idempotently without duplicating tasks or corrupting progress.
- [x] **Signed File Downloads**: HMAC-SHA256 tokens protect files from unauthorized access and enforce tenant/client boundaries.
- [x] **Input Validation**: Zod schemas validate auth, client creation, project mutation, task updates, and automation rules.
- [x] **Secure Headers**: Strict CSP, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, and Permissions-Policy in `next.config.ts`.
- [x] **Soft Delete / Archiving**: Projects and clients support archiving (`isArchived: true`), preserving historical audit records with no destructive hard deletes in the UI.
- [x] **User Removal Safety**: Reassigns or unassigns & flags open tasks (`[FLAG: Assignee removed from team]`), revokes active sessions in the organization, and logs `MEMBER_REMOVED` audit events.
- [x] **Accessibility & Motion**: Focus rings (`:focus-visible`), ARIA attributes, semantic HTML, and full support for `prefers-reduced-motion` across app and landing page.
- [x] **Observability**: Centralized structured logger (`src/server/logger.ts`), `/api/health` database connectivity check, and opt-in error tracking hook (`useErrorTracker`).

