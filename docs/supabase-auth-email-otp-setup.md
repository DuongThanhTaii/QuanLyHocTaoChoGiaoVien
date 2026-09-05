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

- Đặt tiêu đề: `Mã đặt lại mật khẩu Mari`.
- Template **Reset password** phải dùng `{{ .Token }}`, không dùng `{{ .ConfirmationURL }}`.
- Luồng Mari sẽ xác thực mã bằng trang `/reset-password`, sau đó mới đổi mật khẩu.

```html
<!doctype html>
<html lang="vi">
  <body style="margin:0;background:#f7f8fc;font-family:Arial,Helvetica,sans-serif;color:#172033">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fc">
      <tr><td align="center" style="padding:36px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">
          <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #edf0f5">
            <img src="https://mari.io.vn/images/empty_states/logo.png" alt="Mari" height="38" style="display:block;border:0;height:38px;width:auto">
          </td></tr>
          <tr><td style="padding:34px 32px 12px">
            <p style="margin:0 0 12px;color:#f97316;font-size:14px;font-weight:700">BẢO MẬT TÀI KHOẢN</p>
            <h1 style="margin:0;font-size:27px;line-height:1.3">Đặt lại mật khẩu</h1>
            <p style="margin:18px 0 0;font-size:16px;line-height:1.65;color:#526075">Nhập mã bên dưới tại Mari để tạo mật khẩu mới. Không chia sẻ mã này cho bất kỳ ai.</p>
          </td></tr>
          <tr><td style="padding:20px 32px 32px">
            <div style="margin:0;padding:16px;background:#fff5eb;border:1px solid #fbd2b4;border-radius:10px;color:#f97316;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center">{{ .Token }}</div>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#738096">Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này một cách an toàn.</p>
          </td></tr>
          <tr><td style="padding:20px 32px;background:#fbfcfe;border-top:1px solid #edf0f5;font-size:12px;line-height:1.6;color:#8490a3">Đây là email tự động từ Mari. Vui lòng không trả lời email này.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```
