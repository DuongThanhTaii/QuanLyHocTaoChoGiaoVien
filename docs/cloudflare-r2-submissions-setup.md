# Cloudflare R2 — bài nộp học sinh

Bucket bài nộp cần CORS vì trình duyệt học sinh tải trực tiếp file lên R2 bằng URL ký.

Trong Cloudflare Dashboard: **R2 → bucket bài nộp → Settings → CORS policy**, dán nội dung trong `cloudflare-r2-submissions-cors.json` rồi lưu. Nếu dùng thêm domain production khác, thêm chính xác origin HTTPS đó vào `AllowedOrigins`; không dùng `*`.

Sau khi lưu, mở lại trang học sinh rồi thử nộp một ảnh nhỏ. DevTools phải cho phép preflight `OPTIONS` và yêu cầu `PUT` trả về 200.
