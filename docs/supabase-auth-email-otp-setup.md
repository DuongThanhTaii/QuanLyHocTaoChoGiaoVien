# Supabase Auth email cho Mari

Thực hiện trong **Supabase Dashboard → Authentication → Email Templates** sau khi deploy bản OTP.

## Confirm signup

- Bật **Confirm email**.
- Đặt **OTP expiry** là `600` giây (10 phút).
- Template phải dùng `{{ .Token }}`, không dùng `{{ .ConfirmationURL }}`.
- Đặt tiêu đề: `Mã xác thực tài khoản Mari`.

```html
<div style="margin:0;background:#fff7e7;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937">
  <div style="max-width:560px;margin:auto;background:#ffffff;border-radius:20px;overflow:hidden">
    <div style="padding:28px 32px 18px;text-align:center;border-bottom:1px solid #fde7c2">
      <img src="https://mari.io.vn/images/empty_states/logo.png" alt="Mari" width="72" height="72" style="display:inline-block;border:0;outline:none" />
    </div>
    <div style="padding:32px;text-align:center">
      <p style="margin:0 0 8px;color:#e86f18;font-size:12px;font-weight:700;letter-spacing:1px">XÁC THỰC TÀI KHOẢN</p>
      <h1 style="margin:0 0 16px;font-size:26px">Mã xác thực của bạn</h1>
      <p style="margin:0 0 24px;line-height:1.6">Nhập mã này tại Mari để hoàn tất đăng ký. Không chia sẻ mã cho bất kỳ ai.</p>
      <div style="margin:0 auto 24px;padding:16px;background:#fff6e9;border:1px solid #f6c679;border-radius:14px;color:#a95123;font-size:32px;font-weight:700;letter-spacing:8px">{{ .Token }}</div>
      <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6">Mã có hiệu lực trong 10 phút. Nếu không phải bạn đăng ký Mari, bạn có thể bỏ qua email này.</p>
    </div>
  </div>
</div>
```

## Reset password

Giữ template reset dùng `{{ .ConfirmationURL }}`. Nếu có logo, luôn dùng URL PNG tuyệt đối `https://mari.io.vn/images/empty_states/logo.png`, không dùng đường dẫn tương đối hoặc WebP.
