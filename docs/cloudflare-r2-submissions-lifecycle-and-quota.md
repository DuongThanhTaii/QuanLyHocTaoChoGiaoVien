# R2 — tự xoá ảnh và chặn khi gần đầy

## 1. Tự xoá ảnh sau 14 ngày

Trong Cloudflare Dashboard, mở **R2 → bucket bài nộp → Settings → Lifecycle rules** và tạo một rule:

- Prefix: `assignments/images/`
- Action: Delete objects
- Age: `14 days`

`cloudflare-r2-submissions-lifecycle.json` là biểu diễn S3-compatible của rule này. Chỉ ảnh được đặt dưới prefix trên; file tài liệu vẫn được giữ lại. R2 thực thi lifecycle bất đồng bộ, vì vậy một object có thể biến mất sau mốc 14 ngày một khoảng ngắn.

Cron Vercel `/api/cron/r2-submission-cleanup` chạy mỗi ngày để xóa object R2 và metadata ảnh hết hạn trong database. Lifecycle rule vẫn nên được bật như một lớp dự phòng nếu cron bị gián đoạn. Cron dùng cùng `CRON_SECRET` với cron gia hạn gói.

## 2. Chặn upload trước khi phát sinh chi phí ngoài dự kiến

Khai báo các biến môi trường trên Vercel:

```text
R2_SUBMISSIONS_MAX_BYTES=5368709120
R2_SUBMISSIONS_BLOCK_AT_PERCENT=90
```

Ví dụ này đặt giới hạn 5 GiB và khóa cấp URL upload từ 4.5 GiB. Hãy thay giá trị đầu tiên bằng ngân sách bạn muốn dành riêng cho bài nộp; quy đổi: `1 GiB = 1073741824` bytes. Nếu chưa có `R2_SUBMISSIONS_MAX_BYTES`, ứng dụng chủ động khóa upload để tránh ghi dữ liệu không giới hạn.

Giới hạn này tính dung lượng asset bài nộp còn hiệu lực trong database, không phải tổng dung lượng của toàn bộ tài khoản Cloudflare. Để kiểm soát toàn tài khoản, hãy đặt thêm Usage Alerts/Billing alert trong Cloudflare.
