import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' }, { status: 401 });
    }

    // 2. Retrieve teacher's Google refresh token
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.google_refresh_token) {
      return NextResponse.json(
        { error: 'Tài khoản chưa được liên kết với Google Drive. Vui lòng kết nối trước khi tải tài liệu.' },
        { status: 400 }
      );
    }

    // 3. Exchange refresh token for fresh access token
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Thiếu cấu hình Google OAuth trong hệ thống' },
        { status: 500 }
      );
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: profile.google_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.access_token) {
      console.error('Lỗi làm mới token Google:', tokens);
      return NextResponse.json(
        { error: 'Không thể xác thực với Google Drive. Vui lòng kết nối lại tài khoản.' },
        { status: 401 }
      );
    }

    const accessToken = tokens.access_token;

    // 4. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || file?.name || 'Tài liệu không tên';
    const description = (formData.get('description') as string) || '';
    const type = (formData.get('type') as string) === 'ASSIGNMENT' ? 'ASSIGNMENT' : 'LECTURE';

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng chọn file để tải lên' }, { status: 400 });
    }

    // 5. Perform multipart upload to Google Drive API v3
    const boundary = `-------GiasuProBoundary${Date.now()}${Math.random().toString(36).substring(2)}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: title,
      description: description,
    };

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`
      ),
      fileBuffer,
      Buffer.from(closeDelimiter),
    ]);

    const driveUploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,mimeType',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartRequestBody.length.toString(),
        },
        body: multipartRequestBody,
      }
    );

    const driveFileData = await driveUploadRes.json();

    if (!driveUploadRes.ok || !driveFileData.id) {
      console.error('Lỗi upload file lên Drive:', driveFileData);
      return NextResponse.json(
        { error: driveFileData.error?.message || 'Không thể tải file lên Google Drive' },
        { status: 500 }
      );
    }

    // 6. Set public read permission so students / anyone with link can view it
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileData.id}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch (permError) {
      console.warn('Lỗi phân quyền Drive file:', permError);
    }

    // 7. Store metadata into Supabase materials table
    const { data: newMaterial, error: insertError } = await admin
      .from('materials')
      .insert({
        teacher_id: user.id,
        title: title,
        description: description || null,
        type: type,
        drive_file_id: driveFileData.id,
        drive_view_link: driveFileData.webViewLink || `https://drive.google.com/file/d/${driveFileData.id}/view`,
        file_size_bytes: file.size,
        mime_type: file.type || driveFileData.mimeType || 'application/octet-stream',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Lỗi lưu database materials:', insertError);
      return NextResponse.json(
        { error: 'Đã tải lên Drive nhưng lỗi lưu trữ thông tin hệ thống: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      material: newMaterial,
    });
  } catch (error: any) {
    console.error('Unexpected error in content upload:', error);
    return NextResponse.json(
      { error: error.message || 'Đã xảy ra lỗi máy chủ trong quá trình tải tài liệu' },
      { status: 500 }
    );
  }
}
