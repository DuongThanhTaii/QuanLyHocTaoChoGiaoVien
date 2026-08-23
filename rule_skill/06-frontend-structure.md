## 1. Dashboard Architecture

### Layout Strategy (Next.js App Router)
```
app/
├── (auth)/                           # Auth group (no sidebar)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
│
├── (dashboard)/                      # Main app group
│   ├── layout.tsx                    # Sidebar + Header + Command Palette
│   ├── teacher/
│   │   ├── page.tsx                    # Teacher Dashboard Overview
│   │   ├── classes/
│   │   │   ├── page.tsx                # List classes
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx            # Class detail
│   │   │   │   ├── schedule/page.tsx   # TKB lop
│   │   │   │   ├── students/page.tsx   # DS hoc sinh
│   │   │   │   ├── attendance/page.tsx # Diem danh
│   │   │   │   ├── lessons/page.tsx    # Bai giang
│   │   │   │   ├── exercises/page.tsx  # Bai tap
│   │   │   │   └── invoices/page.tsx   # Hoa don lop
│   │   ├── students/page.tsx           # All students view
│   │   ├── calendar/page.tsx           # Global calendar (all classes)
│   │   ├── invoices/page.tsx           # Invoice management
│   │   ├── analytics/page.tsx          # Tax & revenue reports
│   │   └── tools/
│   │       ├── word/page.tsx
│   │       └── excel/page.tsx
│   │
│   ├── student/
│   │   ├── page.tsx                    # Student Dashboard
│   │   ├── schedule/page.tsx           # My schedule
│   │   ├── classes/page.tsx            # My classes
│   │   ├── assignments/page.tsx        # Bai tap
│   │   └── attendance/page.tsx         # My attendance
│   │
│   ├── parent/
│   │   ├── page.tsx                    # Parent Dashboard
│   │   ├── children/page.tsx           # DS con
│   │   ├── progress/page.tsx           # Tien do
│   │   ├── payments/page.tsx           # Thanh toan
│   │   └── messages/page.tsx           # Chat voi GV
│   │
│   └── admin/
│       ├── page.tsx                    # Admin Dashboard
│       ├── teachers/page.tsx
│       ├── subscriptions/page.tsx
│       ├── plans/page.tsx
│       ├── revenue/page.tsx
│       └── settings/page.tsx
```

## 2. Role-Based UI Components

```typescript
// src/shared/components/role-gate.tsx
export function RoleGate({ 
  allowedRoles, 
  children, 
  fallback = <AccessDenied /> 
}: RoleGateProps) {
  const { user } = useAuth();
  
  if (!allowedRoles.includes(user.role)) {
    return fallback;
  }
  
  return <>{children}</>;
}

// Usage
<RoleGate allowedRoles={['teacher', 'admin']}>
  <InvoiceManager />
</RoleGate>
```

## 3. Workflow UX cho tung Actor

### 3.1 Giao vien - Tao lop -> TKB -> Diem danh

```
Step 1: Tao lop
+-----------------------------------------+
| [+ Tao lop moi]                         |
| Ten lop: ________________               |
| Mon hoc: [Dropdown]                     |
| Hoc phi/buoi: [____] VND               |
| Loai phi: [Theo buoi]                |
| Mau: [Do][Xanh][Vang]                        |
| [Tao lop]                               |
+-----------------------------------------+

Step 2: Them hoc sinh
+-----------------------------------------+
| Lop: Toan 12A                           |
| [+ Them hoc sinh]                       |
| +-------------+  +-------------+        |
| | Tim theo    |  | Nhap moi    |        |
| | SDT/Email   |  | Ten: ____   |        |
| | [________]  |  | SDT: ____   |        |
| | [Tim]       |  | [Them]      |        |
| +-------------+  +-------------+        |
+-----------------------------------------+

Step 3: Tao TKB
+-----------------------------------------+
| Thoi khoa bieu - Toan 12A               |
|                                         |
|    Thu 2   Thu 3   Thu 4   Thu 5...    |
| 1  [+Them] [+Them] [+Them] [+Them]     |
| 2  [18:00] [      ] [18:00] [      ]     |
|    Toan12A          Toan12A              |
|                                         |
| [Luu TKB]                               |
+-----------------------------------------+

Step 4: Diem danh (hang ngay)
+-----------------------------------------+
| Diem danh - Toan 12A - Thu 2 (24/8)    |
|                                         |
| [x] Nguyen Van A    [Co mat] [Ghi chu] |
| [x] Tran Thi B      [Vang]   [Ghi chu] |
| [x] Le Van C        [Muon]   [Ghi chu] |
|                                         |
| [Luu diem danh]  [Gui thong bao PH]    |
+-----------------------------------------+
```

### 3.2 Giao vien - Tao hoa don tu dong

```
+-----------------------------------------+
| Hoa don hoc phi                         |
|                                         |
| [Tao hoa don thu cong]                  |
| [Tao hoa don tu dong]                 |
|   |- Theo thang                         |
|   |- Theo tuan                          |
|   |- Theo goi (custom)                  |
|                                         |
| Chon lop: [Toan 12A]                  |
| Thang: [Thang 8/2026]                 |
|                                         |
| Preview:                                |
| +-------------------------------------+ |
| | Nguyen Van A: 8 buoi x 150k = 1.2tr | |
| | Tran Thi B:   7 buoi x 150k = 1.05tr| |
| | (Nghi 1 buoi co phep)               | |
| +-------------------------------------+ |
|                                         |
| [Tao & Gui hoa don]                     |
+-----------------------------------------+
```

### 3.3 Phu huynh - Theo doi con

```
+-----------------------------------------+
| Con: Nguyen Van A                       |
|                                         |
| [TKB] [Bai tap] [Diem danh]           |
|                                         |
| Hom nay: Toan 12A - 18:00-19:30        |
| Trang thai: [Dang hoc]                  |
|                                         |
| Tien do tuan nay:                       |
| ########---- 75% hoan thanh bai tap |
|                                         |
| Diem danh gan day:                      |
| * 24/8: Co mat                          |
| * 22/8: Co mat                          |
| * 19/8: Muon 15 phut                    |
|                                         |
| [Nhan giao vien]                     |
| [Thanh toan hoc phi]                 |
+-----------------------------------------+
```

### 3.4 Hoc sinh - Xem bai tap

```
+-----------------------------------------+
| Bai tap cua toi                         |
|                                         |
| [Sap den han] [Da nop] [Qua han]       |
|                                         |
| * Toan 12A - Bai tap chuong 3          |
|   Han: 25/8 23:59  [Con 2 ngay]        |
|   [Lam bai]                             |
|                                         |
| * Tieng Anh - Essay Writing             |
|   Han: 28/8 23:59  [Con 5 ngay]        |
|   [Lam bai]                             |
|                                         |
| * Vat ly - Bai tap ly thuyet            |
|   Da nop: 23/8 20:00  [Da cham: 8.5] |
+-----------------------------------------+
```

## 4. Design System (Tailwind + shadcn/ui)

```typescript
// Teacher-specific components
<TeacherCalendar 
  classes={classes} 
  onSlotClick={handleSlotClick}
  onAttendanceClick={handleAttendance}
/>

<InvoiceGenerator 
  classId={classId}
  onGenerate={handleGenerate}
  previewMode={true}
/>

<AttendanceGrid 
  students={students}
  date={selectedDate}
  onMark={handleMarkAttendance}
/>

// Parent-specific components
<ChildProgress 
  childId={childId}
  timeRange="week"
/>

<PaymentGateway 
  invoice={invoice}
  methods={['momo', 'vnpay', 'bank']}
  onSuccess={handlePaymentSuccess}
/>

// Student-specific components
<StudentSchedule 
  view="week"
  showHomework={true}
/>

<LessonViewer 
  lesson={lesson}
  attachments={materials}
/>
```

## 5. Mobile-First cho Phu huynh & Hoc sinh

- **Phu huynh:** 80% traffic mobile -> Bottom Navigation, Swipe gestures, Push notifications
- **Hoc sinh:** Mobile app-like experience, offline cache cho bai giang
- **Giao vien:** Desktop-first nhung responsive de xem nhanh tren tablet
""")
