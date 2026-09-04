import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

async function ensureMariHocLieuFolder(accessToken: string) {
  const search = new URLSearchParams({
    q: "name = 'MariHocLieu' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    spaces: 'drive',
    fields: 'files(id)',
    pageSize: '1',
  });
  const existingResponse = await fetch(`https://www.googleapis.com/drive/v3/files?${search}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const existing = await existingResponse.json() as { files?: Array<{ id: string }> };
  if (existingResponse.ok && existing.files?.[0]?.id) return existing.files[0].id;

  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'MariHocLieu', mimeType: 'application/vnd.google-apps.folder' }),
  });
  const folder = await createResponse.json() as { id?: string; error?: { message?: string } };
  if (!createResponse.ok || !folder.id) throw new Error(folder.error?.message || 'Không thể tạo thư mục MariHocLieu trên Google Drive.');
  return folder.id;
}

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
    const insertMaterial = async (material: Record<string, unknown>) => {
      const { error } = await admin.from('materials').insert(material);
      if (error) throw new Error(error.message);
    };

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
    const hocLieuFolderId = await ensureMariHocLieuFolder(accessToken);

    // 4. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || file?.name || 'Tài liệu không tên';
    const description = (formData.get('description') as string) || '';
    const type = (formData.get('type') as string) === 'ASSIGNMENT' ? 'ASSIGNMENT' : 'LECTURE';
    const dueDateStr = formData.get('dueDate') as string | null;
    const classIdsRaw = formData.get('classIds') as string | null;

    let classIds: string[] = [];
    if (classIdsRaw) {
      try {
        classIds = JSON.parse(classIdsRaw);
      } catch {
        classIds = classIdsRaw.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng chọn file để tải lên' }, { status: 400 });
    }

    if (classIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất một lớp học để đăng bài' }, { status: 400 });
    }

    // 5. Perform multipart upload to Google Drive API v3
    const boundary = `-------GiasuProBoundary${Date.now()}${Math.random().toString(36).substring(2)}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: title,
      description: description,
      parents: [hocLieuFolderId],
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

    const driveViewLink = driveFileData.webViewLink || `https://drive.google.com/file/d/${driveFileData.id}/view`;

    // 7. Distribute to all selected classes
    for (const classId of classIds) {
      if (type === 'LECTURE') {
        // Create lesson in lessons table
        const { data: newLesson, error: lessonError } = await admin
          .from('lessons')
          .insert({
            class_id: classId,
            title: title,
            content: description || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (lessonError) {
          console.error(`Lỗi tạo bài giảng cho lớp ${classId}:`, lessonError);
        }

        // Attach material in materials table
        await insertMaterial({
          lesson_id: newLesson?.id || null,
          class_id: classId,
          name: title,
          storage_path: driveViewLink,
          file_type: file.type || driveFileData.mimeType || 'application/octet-stream',
          size_bytes: file.size,
          uploaded_by: user.id,
        });
      } else {
        // ASSIGNMENT: Create exercise in exercises table
        const dueDate = dueDateStr ? new Date(dueDateStr).toISOString() : null;

        await admin.from('exercises').insert({
          class_id: classId,
          title: title,
          description: description || null,
          due_date: dueDate,
          max_score: 10,
          attachments: [
            {
              name: title,
              url: driveViewLink,
              drive_file_id: driveFileData.id,
              size_bytes: file.size,
              mime_type: file.type || driveFileData.mimeType,
            },
          ],
        });

        // Also record in materials table so it shows in central library
        await insertMaterial({
          class_id: classId,
          name: title,
          storage_path: driveViewLink,
          file_type: file.type || driveFileData.mimeType || 'application/octet-stream',
          size_bytes: file.size,
          uploaded_by: user.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      driveFile: driveFileData,
      assignedClassesCount: classIds.length,
    });
  } catch (error: unknown) {
    console.error('Unexpected error in content upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Đã xảy ra lỗi máy chủ trong quá trình tải tài liệu' },
      { status: 500 }
    );
  }
}
