## 1. Code Generation Rules

### Rule 1: Clean Architecture Compliance
- NEVER import infrastructure code (Supabase, Next.js specific) into domain layer
- ALWAYS use dependency injection for repositories
- NEVER use `any` type - use strict TypeScript
- ALWAYS use Result<T> pattern for operations that can fail

### Rule 2: SOLID Enforcement
- Single class = Single responsibility (max 200 lines per class)
- Open/Closed: New payment gateway = new adapter, NOT modifying existing code
- Liskov: Repository implementations must be swappable without breaking tests
- Interface Segregation: Small, focused interfaces (max 5 methods)
- Dependency Inversion: Domain depends on abstractions only

### Rule 3: Database Rules
- ALWAYS use migrations (never modify production DB manually)
- NEVER store passwords or sensitive keys in database
- ALWAYS enable RLS on all tables
- Use UUID v4 for all primary keys
- Index foreign keys and frequently queried columns
- Use JSONB only for truly schemaless data (metadata, settings)

### Rule 4: API Design Rules
- Server Actions for mutations, API Routes for webhooks/external
- Validate ALL inputs with Zod schemas
- Return consistent error format: `{ success: false, error: { code, message } }`
- Rate limit: 100 req/min for auth, 1000 req/min for API
- NEVER expose internal error details to client

### Rule 5: Security Rules
- ALL server actions must verify authentication
- ALL database queries must respect RLS
- Sanitize ALL user-generated content (XSS prevention)
- Use CSRF tokens for state-changing operations
- Encrypt file uploads at rest
- Payment webhooks MUST verify signatures

## 2. Domain-Specific Rules

### Payment Domain
- Invoice numbers must be sequential and unique (HD-YYYY-NNNNN)
- Payment amounts must match invoice amounts exactly (no partial without explicit config)
- All payment transactions must be idempotent
- Tax calculations must use decimal arithmetic (never float)
- Webhook processing must be atomic (database transaction)

### Schedule Domain
- Schedule slots must not overlap within same class
- Recurring rules must handle timezone correctly (Asia/Ho_Chi_Minh)
- Attendance can only be marked for past/current slots (not future)
- A student can only be marked once per slot

### Chat Domain
- Messages can only be edited within 15 minutes
- Users can only participate in conversations they belong to
- System messages cannot be deleted
- File uploads limited to 50MB per file
- Chat history retained for 2 years

### Subscription Domain
- Trial periods are exactly 30 calendar days
- Grace period after expiry: 7 days (read-only access)
- Plan changes take effect at next billing cycle
- Refunds only within 7 days of payment

## 3. Testing Rules

- Unit tests: Domain logic (Jest, 80% coverage minimum)
- Integration tests: API + DB (Vitest, testcontainers)
- E2E tests: Critical user flows (Playwright)
- NEVER mock the database in integration tests
- ALWAYS test error paths, not just happy paths

## 4. Performance Rules

- Database queries must use indexes (EXPLAIN ANALYZE before deploy)
- N+1 queries are FORBIDDEN - use JOINs or batch loading
- Server Components by default, Client Components only for interactivity
- Images: Next.js Image component, WebP format, lazy loading
- Realtime subscriptions: unsubscribe on component unmount
- Cache static data with React Cache + Next.js unstable_cache

## 5. i18n & Localization Rules

- ALL user-facing strings must be in Vietnamese (default)
- Use next-intl for translation management
- Date formatting: dd/MM/yyyy (Vietnamese standard)
- Currency: VND with dot separator (1.000.000d)
- Time: 24-hour format (18:30)

## 6. Git & Deployment Rules

- Branch naming: feature/xxx, bugfix/xxx, hotfix/xxx
- Commit messages: conventional commits (feat:, fix:, refactor:)
- PR must pass: lint, type-check, tests, build
- NEVER commit .env files
- Database migrations run automatically on deploy
- Feature flags for risky changes

## 7. Anti-Patterns (FORBIDDEN)

- God objects (classes with >10 methods)
- Direct SQL in components
- Business logic in controllers/API routes
- Synchronous file I/O in request handlers
- Storing large files in database (use Storage)
- Client-side payment processing (always server-side)
- Hardcoded IDs or magic strings
- Circular dependencies between domains
""")