# Vision Therapy Platform

A multi-tenant SaaS platform for vision therapy clinics. Practitioners prescribe therapy "activities" to patients; patients complete them and results feed back into progress tracking.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Validation | Zod (shared schemas) |
| Auth | Custom JWT + refresh tokens |
| State | Zustand (client) + TanStack Query (server) |

---

## Quick Start (All Commands)

### 1. Prerequisites

```bash
# Check Node.js version (need 18+)
node --version

# Install pnpm if not installed
npm install -g pnpm

# Check pnpm version
pnpm --version
```

### 2. Clone & Install

```bash
# Navigate to project
cd /Users/rahulsahni/Desktop/Vision-One

# Install all dependencies
pnpm install
```

### 3. Environment Setup

```bash
# Copy environment file
cp apps/api/.env.example apps/api/.env

# Edit with your database URL (Neon or local PostgreSQL)
# For Neon: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/vision_therapy?sslmode=require
# For local: postgresql://postgres:postgres@localhost:5432/vision_therapy?schema=public
```

### 4. Database Setup

```bash
# Generate Prisma client
cd apps/api
pnpm db:generate

# Run migrations (creates tables)
pnpm db:migrate

# Seed database with default data
pnpm db:seed

# Return to root
cd ../..
```

### 5. Start Development

```bash
# Start ALL services (API + Web) concurrently
pnpm dev

# OR start services individually in separate terminals:
# Terminal 1 - API (http://localhost:3000)
pnpm --filter @vision/api dev

# Terminal 2 - Web (http://localhost:5173)
pnpm --filter @vision/web dev
```

### 6. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api |

### 7. Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@visiontherapy.com | Admin123! |
| Practitioner | practitioner@visiontherapy.com | Practitioner123! |
| Patient | patient@visiontherapy.com | Patient123! |

---

## All Available Commands

### Root Level Commands

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start all services in dev mode
pnpm build                # Build all packages
pnpm lint                 # Lint all packages
pnpm format               # Format code with Prettier
pnpm db:migrate           # Run database migrations
pnpm db:seed              # Seed database
pnpm db:generate          # Generate Prisma client
```

### API Commands (`apps/api/`)

```bash
cd apps/api

pnpm dev                  # Start API in watch mode
pnpm build                # Build API for production
pnpm start                # Start built API
pnpm start:prod           # Start production API
pnpm lint                 # Lint API code
pnpm db:generate          # Generate Prisma client
pnpm db:migrate           # Run migrations
pnpm db:push              # Push schema to database (no migration)
pnpm db:seed              # Seed database
```

### Web Commands (`apps/web/`)

```bash
cd apps/web

pnpm dev                  # Start dev server (http://localhost:5173)
pnpm build                # Build for production
pnpm preview              # Preview production build
pnpm lint                 # Lint code
```

### Shared Package Commands (`packages/shared/`)

```bash
cd packages/shared

pnpm build                # Build shared types
```

---

## Project Structure

```
vision-therapy-platform/
├── apps/
│   ├── web/                          # React frontend
│   │   ├── src/
│   │   │   ├── activities/           # Activity plug-ins (frontend)
│   │   │   │   ├── activity-registry.ts
│   │   │   │   ├── saccades-training/
│   │   │   │   ├── convergence-exercise/
│   │   │   │   └── pursuit-tracking/
│   │   │   ├── components/           # Shared components
│   │   │   ├── lib/                  # API client, utilities
│   │   │   ├── modules/              # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── admin/
│   │   │   │   ├── practitioner/
│   │   │   │   └── patient/
│   │   │   └── stores/               # Zustand stores
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   └── api/                          # NestJS backend
│       ├── prisma/
│       │   ├── schema.prisma         # Database schema
│       │   └── seed.ts               # Seed script
│       ├── src/
│       │   ├── activities/           # Activity implementations
│       │   │   ├── saccades-training/
│       │   │   ├── convergence-exercise/
│       │   │   └── pursuit-tracking/
│       │   ├── modules/
│       │   │   ├── auth/             # Authentication
│       │   │   ├── prisma/           # Database service
│       │   │   ├── organizations/    # Org management
│       │   │   ├── activities/       # Activity registry
│       │   │   ├── assignments/      # Activity assignments
│       │   │   ├── sessions/         # Session tracking
│       │   │   └── reporting/        # Reports & analytics
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── Dockerfile
│       └── fly.toml
├── packages/
│   └── shared/                       # Shared Zod schemas & types
│       └── src/
│           ├── schemas/
│           └── types.ts
├── .github/workflows/ci-cd.yml      # GitHub Actions
├── turbo.json                        # Turborepo config
├── pnpm-workspace.yaml
└── README.md
```

---

## Activity Plugin System

Activities are modular plug-ins. Add new activities without modifying core code.

### Adding a New Activity

**Step 1: Backend Activity Module**

```bash
# Create activity directory
mkdir -p apps/api/src/activities/my-new-activity
```

Create `apps/api/src/activities/my-activity-key/my-activity-key.ts`:
```typescript
import { ActivityModuleType } from '@vision/shared';

export const myActivity: ActivityModuleType = {
  manifest: {
    key: 'my-activity-key',
    name: 'My Activity',
    category: 'Category Name',
    configSchema: { /* Zod schema */ },
    version: '1.0.0',
  },
  scoreSession(rawResult: unknown) {
    return [
      { key: 'score', value: 100 },
    ];
  },
};
```

**Step 2: Frontend Activity Component**

```bash
mkdir -p apps/web/src/activities/my-activity-key
```

Create `apps/web/src/activities/my-activity-key/MyActivityPlayer.tsx`:
```tsx
export default function MyActivityPlayer({ config, onComplete }) {
  return <div>My Activity</div>;
}
```

Register in `apps/web/src/activities/activity-registry.ts`:
```typescript
registerActivity({
  key: 'my-activity-key',
  name: 'My Activity',
  category: 'Category',
  Player: lazy(() => import('./my-activity-key/MyActivityPlayer')),
});
```

---

## Deployment

### Frontend → Cloudflare Pages

```bash
# Build for production
pnpm --filter @vision/web build

# Deploy via Wrangler CLI
npx wrangler pages deploy apps/web/dist --project-name=vision-therapy-web
```

Or connect GitHub repo to Cloudflare Pages:
- Build command: `pnpm install && pnpm --filter @vision/web build`
- Build output: `apps/web/dist`

### Backend → Fly.io

```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login

# Initialize app (from apps/api/)
cd apps/api
fly launch

# Set production secrets
fly secrets set JWT_SECRET="your-secure-production-secret"
fly secrets set DATABASE_URL="your-neon-production-url"
fly secrets set FRONTEND_URL="https://vision-therapy-web.pages.dev"
fly secrets set NODE_ENV="production"

# Deploy
fly deploy

# Check status
fly status
fly logs
```

### Database → Neon (Free Tier)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in Fly.io secrets

```bash
fly secrets set DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/vision_therapy?sslmode=require"
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret for JWT signing | `your-secure-random-string` |
| `JWT_EXPIRATION` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRATION_DAYS` | Refresh token lifetime | `30` |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

---

## CI/CD (GitHub Actions)

The workflow runs automatically on push to `main`:

1. **Lint & Build** - Validates code compiles
2. **Deploy API** - Deploys to Fly.io
3. **Deploy Web** - Deploys to Cloudflare Pages

### Required Secrets

Add these to your GitHub repo → Settings → Secrets:

```
FLY_API_TOKEN=xxx          # From: fly auth token
CLOUDFLARE_API_TOKEN=xxx   # From: Cloudflare dashboard
CLOUDFLARE_ACCOUNT_ID=xxx  # From: Cloudflare dashboard
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| POST | `/api/auth/logout` | Logout | JWT |
| POST | `/api/auth/invite` | Invite user | Admin |
| POST | `/api/auth/set-password` | Set password via token | Public |

### Organizations
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/organizations/me` | Get current org | Any |
| GET | `/api/organizations/users` | List org users | Admin |
| GET | `/api/organizations/activities` | List org activities | Admin/Practitioner |
| PATCH | `/api/organizations/activities/:id` | Toggle activity | Admin |

### Activities
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/activities` | List all activities | Any |
| GET | `/api/activities/:key` | Get activity by key | Admin/Practitioner |
| POST | `/api/activities/seed` | Seed activities | Admin |

### Assignments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/assignments` | Create assignment | Practitioner |
| GET | `/api/assignments/mine` | My assignments | Patient |
| GET | `/api/assignments/patient/:id` | Patient assignments | Practitioner |
| GET | `/api/assignments/:id/sessions` | Assignment sessions | Practitioner/Patient |

### Sessions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/sessions` | Create session | Patient |
| GET | `/api/sessions/:id` | Get session | Practitioner/Patient |
| GET | `/api/sessions/assignment/:id` | Sessions by assignment | Practitioner/Patient |

### Reporting
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reporting/patient/:id` | Patient progress | Practitioner |
| GET | `/api/reporting/org` | Org reporting | Admin |

---

## License

MIT
