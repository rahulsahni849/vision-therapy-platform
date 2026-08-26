# Vision Therapy SaaS Platform — Technical Build Plan
 
> Use this document as a prompt/spec when generating code (with Claude, Claude Code, or any AI coding tool). It is self-contained: architecture, schema, module boundaries, and business rules are all defined so code can be generated section by section without re-explaining context each time.
 
---
 
## 1. Project Overview
 
A multi-tenant SaaS platform for vision therapy clinics. Practitioners prescribe therapy "activities" (interactive exercises) to patients; patients complete them and results feed back into progress tracking. Activities are organized by medical category and can be enabled/disabled per organization. The system must support adding new activities in the future as isolated, plug-in modules — never modifying core platform code to add an activity.
 
**Initial scope:** 3–4 activities, single-region deployment, one clinic (organization) to start but built multi-tenant from day one.
 
---
 
## 2. Tech Stack
 
| Layer | Technology |
|---|---|
| Monorepo tooling | pnpm workspaces + Turborepo |
| Frontend | React 18 + TypeScript + Vite |
| Frontend state/data | TanStack Query (server state), Zustand (UI state) |
| Backend framework | Node.js + NestJS + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod (shared between frontend and backend via a `packages/shared` workspace) |
| Auth | Custom-built (see Section 6) — JWT access + refresh tokens, bcrypt/argon2 password hashing |
| File/asset storage | Cloudflare R2 (S3-compatible SDK) |
| Background jobs (later) | BullMQ + Upstash Redis |
| Deployment targets | Frontend → Cloudflare Pages · Backend → Fly.io · DB → Neon (Postgres) |
 
---
 
## 3. Monorepo Structure
 
```
vision-therapy-platform/
├── apps/
│   ├── web/                       # React frontend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── admin/
│   │       │   ├── practitioner/
│   │       │   └── patient/
│   │       └── activities/        # one folder per activity (plug-in)
│   │           ├── activity-registry.ts
│   │           ├── saccades-training/
│   │           ├── convergence-exercise/
│   │           └── pursuit-tracking/
│   └── api/                       # NestJS backend
│       └── src/
│           ├── modules/
│           │   ├── auth/          # built from scratch — see Section 6
│           │   ├── users/
│           │   ├── organizations/
│           │   ├── activities/    # activity registry + generic CRUD
│           │   ├── assignments/
│           │   ├── sessions/
│           │   └── reporting/
│           └── activities/        # one NestJS module per activity (plug-in)
│               ├── saccades-training/
│               ├── convergence-exercise/
│               └── pursuit-tracking/
├── packages/
│   └── shared/                    # Zod schemas + TS types shared by web & api
└── turbo.json
```
 
---
 
## 4. User Roles & Business Logic
 
### Roles
- **Admin** — manages their organization: invites/removes practitioners, enables/disables activities for the org, views org-wide reporting, manages billing (future).
- **Practitioner** — manages assigned patients, prescribes activities (with per-patient config, e.g. difficulty), reviews session results and progress trends.
- **Patient** — sees only activities prescribed to them, plays them, results save automatically.
### Core rules
1. Every user belongs to exactly one `organization` (tenant). All queries are scoped by `organizationId` — enforce this in a NestJS guard/interceptor, never trust client-supplied org IDs.
2. A practitioner can be linked to many patients and vice versa, via an `assignment`-level relationship (not a direct FK on the user), so history is preserved if a patient changes practitioner.
3. Activities are global definitions (seeded by the platform) but their **enabled/disabled state is per-organization** — an Admin toggles visibility for their org only.
4. Only Admins can enable/disable activities. Only Practitioners can prescribe an activity to a specific patient (creates an `assignment` row with config). Patients can only start/play assignments addressed to them.
5. Every completed activity session writes a `session` row (raw JSON result) plus normalized `session_metrics` rows for anything chartable, so reporting never needs activity-specific queries.
---
 
## 5. Database Schema (Prisma)
 
```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  users     User[]
  orgActivities OrgActivity[]
}
 
model User {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  email          String   @unique
  passwordHash   String
  role           Role
  firstName      String
  lastName       String
  createdAt      DateTime @default(now())
 
  // auth
  refreshTokens  RefreshToken[]
 
  // relationships
  assignmentsAsPatient      Assignment[] @relation("PatientAssignments")
  assignmentsAsPractitioner Assignment[] @relation("PractitionerAssignments")
}
 
enum Role {
  ADMIN
  PRACTITIONER
  PATIENT
}
 
model Activity {
  id           String   @id @default(uuid())
  key          String   @unique   // matches the plug-in module folder name
  name         String
  category     String
  configSchema Json     // JSON-schema for per-assignment config validation
  version      String
  orgActivities OrgActivity[]
  assignments   Assignment[]
}
 
model OrgActivity {
  organizationId String
  activityId     String
  isEnabled      Boolean @default(true)
  organization   Organization @relation(fields: [organizationId], references: [id])
  activity       Activity     @relation(fields: [activityId], references: [id])
  @@id([organizationId, activityId])
}
 
model Assignment {
  id              String   @id @default(uuid())
  patientId       String
  practitionerId  String
  activityId      String
  config          Json     // per-patient difficulty/settings, validated against Activity.configSchema
  createdAt       DateTime @default(now())
  patient         User     @relation("PatientAssignments", fields: [patientId], references: [id])
  practitioner    User     @relation("PractitionerAssignments", fields: [practitionerId], references: [id])
  activity        Activity @relation(fields: [activityId], references: [id])
  sessions        Session[]
}
 
model Session {
  id           String   @id @default(uuid())
  assignmentId String
  startedAt    DateTime
  endedAt      DateTime?
  rawResult    Json
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  metrics      SessionMetric[]
}
 
model SessionMetric {
  id        String  @id @default(uuid())
  sessionId String
  key       String
  value     Float
  session   Session @relation(fields: [sessionId], references: [id])
}
 
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String
  expiresAt DateTime
  revoked   Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id])
}
```
 
---
 
## 6. Auth Module — Built From Scratch (spec)
 
No third-party auth provider. Implement as a self-contained NestJS module (`apps/api/src/modules/auth`).
 
**Flow:**
1. **Signup/invite** — Admin invites a Practitioner/Patient by email → creates a `User` row with a temp status → invitee sets password via a tokenized link (short-lived signed token, not a guessable UUID).
2. **Login** — email + password → verify with **argon2** (preferred over bcrypt for new builds) → issue:
   - **Access token**: JWT, short-lived (15 min), contains `userId`, `orgId`, `role`.
   - **Refresh token**: opaque random string, stored **hashed** in `RefreshToken` table, long-lived (7–30 days), delivered as an httpOnly secure cookie (not localStorage — avoids XSS token theft).
3. **Refresh** — client calls `/auth/refresh` with the httpOnly cookie → validate hash against DB, check not expired/revoked → rotate: issue a new refresh token, revoke the old one (refresh token rotation prevents replay).
4. **Logout** — revoke the specific refresh token server-side.
5. **Guards** — `JwtAuthGuard` (validates access token) + `RolesGuard` (checks `role` against `@Roles()` decorator on each route) + an `OrgScopeInterceptor` that injects `organizationId` from the token into every query, so a user can never read another org's data even if they tamper with a request body.
**Password requirements:** enforce min length + complexity server-side with Zod, never trust client-side validation alone.
 
**Rate limiting:** apply `@nestjs/throttler` on `/auth/login` and `/auth/refresh` to slow brute-force attempts.
 
**Do NOT implement:** OAuth/social login, MFA in v1 — flag as a fast-follow, not a blocker.
 
---
 
## 7. Activity Plug-in Contract
 
Every activity — backend and frontend — implements the same interface so the core platform never special-cases an activity by name.
 
**Backend (`apps/api/src/activities/<activity-key>/`):**
```ts
export interface ActivityModule {
  manifest: {
    key: string;            // e.g. "saccades-training"
    name: string;
    category: string;
    configSchema: ZodSchema; // validates Assignment.config
  };
  scoreSession(rawResult: unknown): SessionMetric[]; // turns raw play data into normalized metrics
}
```
Each activity registers itself into a central `ActivityRegistry` (a NestJS provider) at module init. The generic `/activities`, `/assignments`, `/sessions` controllers never import a specific activity — they resolve behavior via the registry by `activity.key`.
 
**Frontend (`apps/web/src/activities/<activity-key>/`):**
```ts
export interface ActivityComponent {
  key: string;
  Player: React.ComponentType<{ config: unknown; onComplete: (result: unknown) => void }>;
}
```
The patient dashboard dynamically imports the right `Player` by key (`React.lazy`) — adding activity #5 later means adding a folder and one registry entry, touching nothing else.
 
---
 
## 8. API Surface (v1)
 
```
POST   /auth/signup-invite      (Admin only)
POST   /auth/set-password       (invitee, via token)
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
 
GET    /organizations/me
GET    /activities                    (global catalog)
PATCH  /org-activities/:activityId    (Admin — enable/disable for org)
 
GET    /users                         (Admin — list org users)
POST   /assignments                   (Practitioner — prescribe activity to patient)
GET    /assignments/mine              (Patient — my prescribed activities)
GET    /assignments/:id/sessions      (Practitioner — review a patient's sessions)
 
POST   /sessions                      (Patient — submit completed session result)
GET    /reporting/patient/:id         (Practitioner — progress over time)
```
 
---
 
## 9. Build Order (recommended sequence for code generation)
 
1. Monorepo scaffold (pnpm + Turborepo) + `packages/shared` with Zod schemas from Section 5
2. Prisma schema + migration (Section 5)
3. Auth module end-to-end (Section 6) — this must work and be tested before anything else
4. Organizations + Users modules (invite flow, role guards)
5. Activity Registry (backend) + generic `/activities`, `/assignments`, `/sessions` controllers
6. First plug-in activity (simplest of your 3–4) built against the registry to prove the contract
7. Frontend: auth pages → Admin dashboard (enable/disable activities) → Practitioner dashboard (prescribe + review) → Patient dashboard (dynamic activity loader)
8. Remaining 2–3 activities as additional plug-in modules
9. Reporting views
10. Deploy: Cloudflare Pages (web) + Fly.io (api) + Neon (Postgres)
---
 
## 10. How to Use This Document
 
Paste sections 2–8 as-is when prompting for code generation, one module at a time following the build order in Section 9 — e.g. "Using the tech stack and auth spec below, generate the NestJS auth module." Keep the schema (Section 5) and activity contract (Section 7) pinned in every prompt so generated modules stay consistent with each other.




efault Login: admin@visiontherapy.com / Admin123!