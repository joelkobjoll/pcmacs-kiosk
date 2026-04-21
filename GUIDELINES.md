# PC Macs Kiosk — Coding Guidelines

## Architecture

### Clean Architecture + Vertical Slicing

The project uses **Clean Architecture** inside **vertical slices**: each feature owns all its layers (domain → application → infrastructure → presentation) rather than grouping by technical layer.

**API slice layout** (`apps/api/src/features/<feature>/`):
```
domain/
  index.ts           # Entities, value objects, repository interfaces (zero deps)
application/
  index.ts           # Use cases — depend only on domain interfaces (DI via constructor)
  index.test.ts      # Unit tests: use cases with mock interface implementations
infrastructure/
  sqlite-*.ts        # Implements domain interfaces with better-sqlite3
  bcrypt-*.ts        # Implements IPasswordHasher with bcryptjs
  disk-*.ts          # Implements IMediaStorage with multer
  sqlite-*.test.ts   # Integration tests: real in-memory SQLite
presentation/
  routes.ts          # Express route factory; accepts use-case bundle, returns Router
```

**Layer rules:**
- `domain` — zero imports from outside the layer; pure TypeScript interfaces and entities
- `application` — imports only from `domain`; no HTTP, no DB, no file I/O
- `infrastructure` — implements domain interfaces; may import external packages
- `presentation` — imports only from `application`; no DB, no direct business logic
- `main.ts` is the **composition root** — the only file that imports across all layers to wire them together

**Web slice layout** (`apps/web/src/features/<feature>/`):
```
pages/          # Route-level components (orchestrate, never contain logic)
components/     # Presentational components (receive props, emit events)
hooks/          # All business logic, data fetching, state
api/            # Typed HTTP client functions
```

### Shared Code

- Anything used by **2+ features** lives in `shared/`.
- `shared/components/ui/` — primitive UI components (Button, Input, Card…)
- `shared/components/layout/` — structural layout components
- `shared/hooks/` — cross-feature hooks (useApi, useToast…)
- `shared/types/` — shared TypeScript types

---

## No Business Logic in Views

**Rule**: Components only render UI. All state, effects, async calls, and derived data go into **hooks**.

```tsx
// ❌ Business logic in component
function PlaylistPage() {
  const [slides, setSlides] = useState([]);
  useEffect(() => { fetch('/api/slides').then(...) }, []);
  const sorted = slides.sort(...);
  // ...
}

// ✅ Logic extracted to hook
function PlaylistPage() {
  const { slides, isLoading, removeSlide } = usePlaylist();
  // pure rendering only
}
```

---

## File Size Limit: 400 Lines

- No file may exceed **400 lines**.
- When approaching the limit, extract sub-components, utility functions, or split the hook into smaller hooks.
- A large component is usually a sign of missing abstractions.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `SlideCard.tsx` |
| Hooks | camelCase, `use` prefix | `use-playlist.ts` |
| Files | kebab-case | `add-slide-form.tsx` |
| API functions | camelCase object | `slidesApi.list()` |
| Types/Interfaces | PascalCase | `Slide`, `MediaItem` |
| DB columns | snake_case | `source_type`, `is_active` |
| CSS/Tailwind | Utility classes only, no custom class names |

---

## Biome (Linting & Formatting)

We use [Biome](https://biomejs.dev) instead of ESLint + Prettier.

```bash
# Check everything
pnpm lint

# Format all files
pnpm format

# Check a single file
pnpm biome check apps/web/src/features/auth/pages/login-page.tsx
```

Rules enforced:
- No `any` types (error)
- No non-null assertions without good reason (warn)
- Organise imports automatically
- Single quotes, 2-space indent, 100-char line width, trailing commas

---

## Testing

Framework: **Vitest** + `@testing-library/react` for hooks.

### API test strategy

| Layer | What to test | How |
|---|---|---|
| `application/` | Use case logic | Inject **mock interface implementations** — no DB, no filesystem |
| `infrastructure/` | Repository / storage | Inject **real in-memory SQLite** (`new Database(':memory:')`) via constructor |
| `presentation/` | Routes (optional) | Supertest with wired-up use cases |

```ts
// ✅ Use case test — pure interface mocks
const mockRepo: ISlideRepository = { findAll: vi.fn(() => []), ... };
const uc = new GetSlidesUseCase(mockRepo);

// ✅ Infrastructure test — in-memory DB via constructor
const db = new Database(':memory:');
db.exec(schema);
const repo = new SqliteSlideRepository(db);
```

Never mock `getDb()` or use module-level singleton spies. Always inject dependencies via constructor.

### Web test strategy

- Hook tests: mock API modules with `vi.mock` / `vi.spyOn`
- Use `@testing-library/react`'s `renderHook` + `act`
- Do **not** use `vi.useFakeTimers()` with `waitFor` (use microtask flushing instead)

```bash
pnpm test                    # run all tests via Turborepo
pnpm --filter api test
pnpm --filter web test
```

---

## Import Rules

- **No cross-feature imports**: features must not import from each other.
  - ✅ `@/shared/hooks/use-api`
  - ❌ `@/features/auth/auth-context` imported inside `@/features/playlist/`
  - Exception: `auth-context` is a provider — pages/guards at the app level may use it.
- Use `@/` path alias (resolves to `apps/web/src/`).

---

## API Conventions

- Routes: `GET/POST/PATCH/DELETE /api/<resource>`
- Route factories accept a use-case bundle and return an Express `Router`
- Route handlers only: parse & validate input (Zod), call a use case, format the response — no business logic
- Errors always return `{ error: string }` with appropriate HTTP status
- Validation: use **Zod** schemas
- All protected routes use `authMiddleware`

---

## Component Reuse Policy

Before writing a new component, check `shared/components/`. Before creating a hook, check `shared/hooks/`.

If you copy the same JSX into 2 places → extract to a shared component immediately.

---

## How to Add a New Feature

1. **API** — create `apps/api/src/features/<name>/` with all four layers:
   - `domain/index.ts` — entities and repository interfaces (zero deps)
   - `application/index.ts` — use case classes with constructor DI
   - `application/index.test.ts` — unit tests using mock interface implementations
   - `infrastructure/<impl>.ts` — implement domain interfaces (SQLite, storage, etc.)
   - `infrastructure/<impl>.test.ts` — integration tests with in-memory SQLite
   - `presentation/routes.ts` — Express route factory accepting use-case bundle
   - Wire everything in `apps/api/src/main.ts` (composition root)

2. **Web** — create `apps/web/src/features/<name>/`
   - `api/<name>-api.ts` — typed fetch functions
   - `hooks/use-<name>.ts` — data/state hook + test
   - `components/<component-name>.tsx` — presentational
   - `pages/<name>-page.tsx` — orchestrating page
   - Register route in `apps/web/src/app/router.tsx`
