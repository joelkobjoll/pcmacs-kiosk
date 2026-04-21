# PC Macs Kiosk — Agent Instructions

This file is automatically picked up by GitHub Copilot CLI and other AI coding agents.

## Project Overview

Full-stack digital signage kiosk app. pnpm monorepo:
- `apps/api` — Express + better-sqlite3 (SQLite) backend
- `apps/web` — Vite + React + Tailwind CSS frontend

## Architecture: Clean Architecture + Vertical Slicing

Each feature owns all its layers. Never group by layer (no top-level `controllers/`, `services/`, etc.).

**API feature**: `apps/api/src/features/<name>/`
```
domain/index.ts           # Entities + repository/service interfaces (ZERO external deps)
application/index.ts      # Use cases — classes, DI via constructor, depend only on domain
application/index.test.ts # Unit tests using mock interface implementations (no DB needed)
infrastructure/           # Implements domain interfaces (DB, filesystem, bcrypt, multer)
infrastructure/*.test.ts  # Integration tests with real in-memory SQLite
presentation/routes.ts    # Express route factory: accepts use-case bundle, returns Router
```

**Layer rules (enforce strictly):**
- `domain` — no imports from anywhere outside domain; pure TS only
- `application` — imports from own domain only; NO express, NO sqlite, NO fs
- `infrastructure` — implements domain interfaces; may use external packages
- `presentation` — imports from own application only; NO business logic, NO DB
- `main.ts` is the ONLY place that imports across all layers (composition root)

**Web feature**: `apps/web/src/features/<name>/`
- `api/<name>-api.ts` — typed fetch client
- `hooks/use-<name>.ts` — state + async logic
- `hooks/use-<name>.test.ts` — hook tests
- `components/` — presentational components (props in, events out)
- `pages/<name>-page.tsx` — orchestrates components + hooks, no logic

## Critical Rules

### No business logic in views
Components ONLY render. All state, effects, and derived data go into hooks.
```tsx
// ❌ wrong
function MyPage() {
  const [data, setData] = useState([]);
  useEffect(() => { fetch(...).then(setData) }, []);
}

// ✅ correct
function MyPage() {
  const { data, isLoading } = useMyFeature();
}
```

### 400-line file limit
- No file may exceed 400 lines
- Extract sub-components, helpers, or split hooks when approaching the limit

### Reusable components
- If JSX is used in 2+ places → move to `apps/web/src/shared/components/`
- Check `shared/` before writing a new primitive component or hook

### Import rules
- No cross-feature imports
- Use `@/` alias for `apps/web/src/`
- Shared code only in `shared/`

### TypeScript
- No `any` types
- Use proper types from `shared/types/api.ts`

### Tests required

- Every API **application layer**: `application/index.test.ts` — mock interface implementations, no DB
- Every API **infrastructure layer**: `infrastructure/<impl>.test.ts` — real in-memory SQLite via constructor
- Every web **hook**: co-located `*.test.ts` — mock API modules with `vi.spyOn`
- **Never** mock `getDb()` or use module-level singleton spies; always inject via constructor

## Commands

```bash
pnpm dev          # start both api + web in parallel
pnpm test         # run all tests
pnpm lint         # biome check
pnpm format       # biome format --write
pnpm build        # build both packages
```

## How to Add a New Feature (Checklist)

**API** (`apps/api/src/features/<name>/`):
1. `domain/index.ts` — entities + repository interfaces (zero external deps)
2. `application/index.ts` — use case classes with constructor DI (domain interfaces only)
3. `application/index.test.ts` — unit tests using mock interface implementations
4. `infrastructure/<impl>.ts` — implement domain interfaces (SQLite, storage, etc.)
5. `infrastructure/<impl>.test.ts` — integration tests with real in-memory SQLite
6. `presentation/routes.ts` — route factory: `create<Name>Router(useCases): Router`
7. Wire in `apps/api/src/main.ts` (composition root): instantiate infra → create use cases → pass to router

**Web** (`apps/web/src/features/<name>/`):
8. `api/<name>-api.ts` — typed fetch client
9. `hooks/use-<name>.ts` — data/state hook + co-located test
10. `components/` — presentational components
11. `pages/<name>-page.tsx` — orchestrating page (no logic, uses hooks only)
12. Register route in `apps/web/src/app/router.tsx`

## Key Files

- `apps/api/src/main.ts` — API entry, route mounting
- `apps/api/src/infrastructure/database/db.ts` — SQLite connection
- `apps/api/src/infrastructure/database/migrate.ts` — schema migrations
- `apps/api/src/shared/middleware/auth-middleware.ts` — JWT guard + token creation
- `apps/web/src/app/router.tsx` — frontend routes
- `apps/web/src/app/providers.tsx` — context providers
- `apps/web/src/shared/hooks/use-api.ts` — typed fetch wrapper
- `apps/web/src/shared/types/api.ts` — shared TypeScript types

## Kiosk / Raspberry Pi

- API binds to `0.0.0.0:3000` (accessible from LAN)
- `scripts/start.sh` — starts API + launches Chromium in `--kiosk` mode on `/display`
- `scripts/setup-pi.sh` — one-shot Pi provisioning
- Display page polls `/api/slides` every 10s for live updates

## Auth Flow

- `GET /api/setup/status` → `{ isSetup: boolean, localIp: string }`
- First boot: if `isSetup = false`, frontend redirects to `/setup` page
- `/setup` page calls `POST /api/auth/setup` to create initial password
- Normal login: `POST /api/auth/login` → JWT token stored in localStorage
- Change password: `POST /api/auth/change-password` (protected)
