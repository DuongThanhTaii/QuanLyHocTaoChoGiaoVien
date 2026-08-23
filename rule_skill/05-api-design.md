## 1. API Strategy

- **Next.js Server Actions** cho mutations (form submissions, CRUD)
- **API Routes** (`/api/*`) cho:
  - Webhooks (payment gateways)
  - File upload direct to storage
  - Realtime auth handshake
  - Third-party integrations

## 2. Server Actions Pattern

```typescript
// src/app/(dashboard)/teacher/classes/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClassUseCase } from '@/application/services/class/create-class.usecase';
import { CreateClassDTO } from '@/application/dto/class.dto';

export async function createClass(formData: CreateClassDTO) {
  const user = await requireAuth('teacher');
  const validated = CreateClassSchema.parse(formData);
  const result = await createClassUseCase.execute({
    ...validated,
    teacherId: user.id
  });
  
  if (result.isSuccess()) {
    revalidatePath('/teacher/classes');
    return { success: true, data: result.getValue() };
  }
  
  return { success: false, error: result.getError().message };
}
```

## 3. API Routes (Webhooks & External)

### Payment Webhooks
```typescript
// src/app/api/webhooks/payment/route.ts
import { NextRequest } from 'next/server';
import { PaymentWebhookHandler } from '@/infrastructure/payment/payment-webhook.handler';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-webhook-signature');
  const body = await req.text();
  
  const handler = new PaymentWebhookHandler();
  const result = await handler.process(body, signature);
  
  if (result.isSuccess()) {
    return Response.json({ received: true });
  }
  
  return Response.json({ error: result.getError() }, { status: 400 });
}
```

### File Upload (Signed URL)
```typescript
// src/app/api/upload/signed-url/route.ts
export async function POST(req: NextRequest) {
  const { filename, fileType, classId } = await req.json();
  
  const storage = new SupabaseStorageAdapter();
  const signedUrl = await storage.createSignedUploadUrl(
    `classes/${classId}/${filename}`,
    fileType
  );
  
  return Response.json({ signedUrl, path });
}
```

## 4. Endpoint Summary

### Teacher Endpoints

| Method | Endpoint | Action | Auth |
|--------|----------|--------|------|
| POST | `createClass` | Tao lop hoc | Teacher |
| POST | `updateClass` | Cap nhat lop | Teacher (owner) |
| POST | `createScheduleSlot` | Tao TKB | Teacher |
| POST | `markAttendance` | Diem danh | Teacher |
| POST | `createLesson` | Upload bai giang | Teacher |
| POST | `createExercise` | Tao bai tap | Teacher |
| POST | `generateInvoice` | Tao hoa don | Teacher |
| POST | `sendInvoice` | Gui hoa don | Teacher |
| GET | `/api/teacher/stats` | Thong ke thue | Teacher |

### Student Endpoints

| Method | Endpoint | Action | Auth |
|--------|----------|--------|------|
| GET | `getMySchedule` | Xem TKB | Student |
| GET | `getMyLessons` | Xem bai giang | Student |
| GET | `getMyExercises` | Xem bai tap | Student |
| GET | `getMyAttendance` | Xem diem danh | Student |

### Parent Endpoints

| Method | Endpoint | Action | Auth |
|--------|----------|--------|------|
| GET | `getChildProgress` | Tien do con | Parent |
| GET | `getChildInvoices` | Hoa don con | Parent |
| POST | `payInvoice` | Thanh toan | Parent |
| GET | `getChildAttendance` | Diem danh con | Parent |

### Admin Endpoints

| Method | Endpoint | Action | Auth |
|--------|----------|--------|------|
| GET | `/api/admin/teachers` | DS giao vien | Admin |
| POST | `/api/admin/plans` | Tao goi | Admin |
| GET | `/api/admin/subscriptions` | DS subscription | Admin |
| POST | `/api/admin/toggle-billing` | Bat/tat thu phi | Admin |
| GET | `/api/admin/revenue` | Doanh thu | Admin |

### Chat Endpoints

| Method | Endpoint | Action |
|--------|----------|--------|
| POST | `sendMessage` | Gui tin nhan |
| GET | `getConversations` | DS cuoc tro chuyen |
| GET | `getMessages` | Tin nhan (pagination) |
| POST | `markAsRead` | Danh dau doc |

## 5. Realtime Channels

```typescript
// Chat channel
supabase.channel('chat:${conversationId}')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)
  .subscribe();

// Attendance channel
supabase.channel('attendance:${classId}')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, callback)
  .subscribe();

// Notification channel
supabase.channel('notifications:${userId}')
  .on('broadcast', { event: 'new_notification' }, callback)
  .subscribe();
```
""")
