
import os

output_dir = "/mnt/agents/output/antigravity-edtech"
os.makedirs(output_dir, exist_ok=True)

# File 1: Project Overview
with open(f"{output_dir}/01-project-overview.md", "w", encoding="utf-8") as f:
    f.write("""# Antigravity EdTech - Project Overview

## 1. Tổng quan dự án

**Tên dự án:** Antigravity EdTech Platform  
**Mô tả:** Nền tảng quản lý giáo dục toàn diện (SaaS) kết nối Giáo viên - Học sinh - Phụ huynh trong một hệ sinh thái thống nhất.  
**Mô hình kinh doanh:** Freemium SaaS với subscription dành cho giáo viên/tổ chức giáo dục.  
**Tech Stack:** Next.js 15 (App Router), Node.js, Supabase, Vercel.

## 2. Các tác nhân (Actors)

| Actor | Mô tả chính | Thiết bị chính |
|-------|-------------|----------------|
| **Admin (Bạn)** | Quản lý toàn hệ thống, subscription, billing, cấu hình nền tảng | Desktop |
| **Giáo viên** | Quản lý lớp học, học phí, TKB, điểm danh, nội dung, hóa đơn | Desktop/Tablet |
| **Học sinh** | Xem TKB, bài giảng, bài tập, điểm danh cá nhân | Mobile/Desktop |
| **Phụ huynh** | Theo dõi tiến độ con, đóng học phí, chat với GV | Mobile chủ đạo |

## 3. Core Value Proposition

1. **All-in-one:** Giáo viên không cần dùng 5-6 app riêng lẻ (Excel, Messenger, Momo, Google Calendar...)
2. **Tự động hóa:** Hóa đơn học phí + thanh toán + xác nhận tự động
3. **Minh bạch:** Phụ huynh thấy real-time tiến độ, điểm danh, tài chính
4. **Compliance:** Thống kê sẵn cho khai thuế thu nhập cá nhân/tổ chức
5. **Embedded Tools:** Word/Excel editor ngay trong app

## 4. Ràng buộc & Yêu cầu phi chức năng

- **Performance:** TTFB < 600ms, tương tác < 100ms (Vercel Edge)
- **Real-time:** Chat, điểm danh, thông báo phải < 500ms latency
- **Bảo mật:** Dữ liệu học sinh nhạy cảm (COPPA-like compliance), mã hóa file bài giảng
- **Offline-first:** Một số tính năng xem bài giảng cần cache (PWA)
- **Multi-tenancy:** Dữ liệu giáo viên/phụ huynh/học sinh phải cô lập hoàn toàn
- **i18n:** Tiếng Việt chính, có thể mở rộng tiếng Anh sau
- **Payment:** Tích hợp VNPay/Momo/ZaloPay + Stripe (nếu mở rộng quốc tế)
""")

print("Created 01-project-overview.md")
