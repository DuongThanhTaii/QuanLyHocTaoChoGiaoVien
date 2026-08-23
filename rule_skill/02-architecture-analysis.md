## 1. Nguyên tắc thiết kế

### SOLID áp dụng
- **S - Single Responsibility:** Mỗi domain module chỉ làm 1 nhiệm vụ (ScheduleModule không xử lý Payment)
- **O - Open/Closed:** Mở rộng cổng thanh toán mới không sửa code cũ (Strategy Pattern)
- **L - Liskov Substitution:** Repository implementations có thể thay thế nhau (Postgres <-> Memory cho test)
- **I - Interface Segregation:** TeacherService không phụ thuộc ParentRepository
- **D - Dependency Inversion:** Domain layer không phụ thuộc framework (Next.js/Supabase)

### Clean Architecture Layers

```
+---------------------------------------------+
|  4. Presentation Layer (Next.js App Router) |
|     - Pages, Components, Server Actions      |
|     - API Routes (thin adapters)           |
+---------------------------------------------+
|  3. Application Layer                       |
|     - Use Cases (Interactors)               |
|     - DTOs, Mappers, Validation             |
|     - Application Services                  |
+---------------------------------------------+
|  2. Domain Layer (Core - Framework Agnostic)|
|     - Entities, Value Objects               |
|     - Domain Services, Domain Events        |
|     - Repository Interfaces (Ports)         |
+---------------------------------------------+
|  1. Infrastructure Layer                    |
|     - Repository Implementations (Adapters)|
|     - External Services (Payment, Storage)  |
|     - Database, Auth, Realtime              |
+---------------------------------------------+
```

## 2. Cấu trúc thư mục đề xuất

```
antigravity/
├── src/
│   ├── app/                          # Next.js App Router (Presentation)
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   ├── parent/
│   │   │   └── admin/
│   │   ├── api/                      # API Routes (thin)
│   │   └── layout.tsx
│   │
│   ├── domains/                      # Domain Layer (CORE)
│   │   ├── shared/                   # Kernel: BaseEntity, Result<T>, DomainEvent
│   │   ├── identity/                 # User, Role, Permission
│   │   ├── classroom/                # Class, Enrollment
│   │   ├── schedule/                 # Timetable, Slot, RecurringRule
│   │   ├── attendance/               # AttendanceRecord, Status
│   │   ├── content/                  # Lesson, Exercise, Material
│   │   ├── payment/                  # Invoice, Transaction, PaymentMethod
│   │   ├── subscription/             # Plan, Subscription, Trial
│   │   ├── chat/                     # Conversation, Message, ReadReceipt
│   │   └── analytics/                # TaxReport, Statistics
│   │
│   ├── application/                  # Application Layer
│   │   ├── ports/                    # Repository interfaces (driven)
│   │   ├── services/                 # Use cases / Interactors
│   │   ├── dto/                      # Request/Response DTOs
│   │   ├── mappers/                  # Entity <-> DTO
│   │   └── validators/               # Input validation schemas (Zod)
│   │
│   ├── infrastructure/               # Infrastructure Layer
│   │   ├── persistence/              # Supabase/Neon implementations
│   │   │   ├── repositories/         # Concrete repositories
│   │   │   └── migrations/           # SQL migrations
│   │   ├── auth/                     # Supabase Auth adapter
│   │   ├── storage/                  # Supabase Storage adapter
│   │   ├── realtime/                 # Supabase Realtime adapter
│   │   ├── payment/                  # VNPay, Momo, ZaloPay adapters
│   │   ├── notification/             # Push, Email, SMS
│   │   └── document/                 # Word/Excel processing (OnlyOffice/SheetJS)
│   │
│   └── shared/                       # Cross-cutting concerns
│       ├── config/                   # Env config, feature flags
│       ├── utils/                    # Pure functions, date helpers
│       ├── types/                    # Global TypeScript types
│       └── constants/                # Enums, magic numbers
│
├── tests/
│   ├── unit/                         # Domain logic tests (Jest)
│   ├── integration/                  # API + DB tests (Vitest)
│   └── e2e/                          # Playwright
│
├── supabase/                         # Supabase local config, functions, policies
├── docker-compose.yml                # Local dev stack
└── vercel.json
```

## 3. Dependency Rule

```typescript
// DUNG: Domain khong biet gi ve Next.js/Supabase
// src/domains/payment/entities/invoice.ts
export class Invoice {
  constructor(
    private readonly id: string,
    private readonly teacherId: string,
    private readonly amount: Money,      // Value Object
    private readonly status: InvoiceStatus
  ) {}
  
  markAsPaid(): Result<Invoice> { /* ... */ }
}

// src/application/ports/invoice.repository.ts
export interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  save(invoice: Invoice): Promise<void>;
}

// src/infrastructure/persistence/supabase/invoice.repository.ts
export class SupabaseInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly client: SupabaseClient) {}
  // Implementation
}
```

## 4. Communication giua layers

- **Presentation -> Application:** Server Actions goi Use Cases
- **Application -> Domain:** Domain Services xu ly logic phuc tap
- **Application -> Infrastructure:** Qua interfaces (Dependency Injection)
- **Domain Events:** Khi Invoice paid -> phat event -> NotificationService gui email
""")
