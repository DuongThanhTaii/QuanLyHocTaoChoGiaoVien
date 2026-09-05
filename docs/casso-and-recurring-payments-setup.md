# Casso đối soát học phí và gia hạn gói Mari

## 1. Áp dụng database

Chạy `src/infrastructure/persistence/supabase/migrations/24_casso_reconciliation_and_subscription_renewal.sql` trong Supabase SQL Editor. Migration tạo bảng kết nối Casso, webhook idempotency, hàng chờ đối soát và trạng thái gia hạn.

## 2. Casso OAuth2

Đăng ký ứng dụng OAuth2 của Mari trong Casso Developer, rồi thêm vào Vercel:

```bash
CASSO_CLIENT_ID=...
CASSO_CLIENT_SECRET=...
# 32 bytes, base64 hoặc 64 ký tự hex. Không dùng giá trị mẫu.
CASSO_TOKEN_ENCRYPTION_KEY=...
NEXT_PUBLIC_APP_URL=https://mari.io.vn
```

Redirect URI phải là `https://mari.io.vn/api/casso/callback`. Giáo viên kết nối qua Hồ sơ cá nhân, cấp quyền tại Casso/Cas ID rồi chọn STK trùng với tài khoản nhận học phí đã thêm trong Mari.

Webhook Mari là `https://mari.io.vn/api/webhooks/casso`. App tạo webhook chỉ nhận giao dịch tiền vào và dùng secret riêng đã mã hóa theo kết nối. Nếu Casso cấp Webhook V2 cho app OAuth, chọn V2 và ký `X-Casso-Signature`; endpoint cũng kiểm tra header secret của luồng API hiện tại.

## 3. PayOS recurring

PayOS hiện có vẫn xử lý thanh toán gói lần đầu ở cấp Mari. Không đặt `PAYOS_RECURRING_ENABLED=true` cho đến khi PayOS cấp recurring/tokenization production cùng định dạng API chính thức.

Khi PayOS đã cấp quyền, lưu **token reference** do PayOS trả về vào `platform_payment_methods`; không lưu số tài khoản, thẻ, CVV hay thông tin ngân hàng. Sau đó triển khai adapter gọi API recurring theo tài liệu PayOS đã cấp và mới bật:

```bash
PAYOS_RECURRING_ENABLED=true
CRON_SECRET=<random-long-secret>
```

Vercel gọi `/api/cron/subscription-renewals` mỗi ngày lúc 01:00 UTC. Endpoint chỉ chấp nhận `Authorization: Bearer $CRON_SECRET`.

## 4. Kiểm tra trước production

- Kết nối Casso test, gửi giao dịch có đúng mã hóa đơn và xác nhận chỉ một hóa đơn được gạch nợ.
- Gửi lại cùng webhook để kiểm tra không tạo thanh toán trùng.
- Giao dịch sai số tiền/mã hóa đơn phải vào hàng chờ xác nhận hoặc bị bỏ qua.
- Tắt gia hạn tại `/settings/billing`; kiểm tra `auto_renew=false` và `cancel_at_period_end=true`.
- Chỉ test auto-charge bằng sandbox/production credentials do PayOS cung cấp; không giả lập bằng Payment Link một lần.
