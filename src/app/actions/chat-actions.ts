'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 1. Tìm kiếm người dùng bằng Số điện thoại hoặc Email
export async function searchUserByPhoneOrEmail(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery || cleanQuery.length < 2) {
    return { users: [] };
  }

  const admin = getAdminClient();

  // Tìm trong bảng profiles
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url, role')
    .neq('id', user.id)
    .or(`email.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%`)
    .limit(10);

  if (error) {
    console.error('Search error:', error);
    return { error: error.message, users: [] };
  }

  return { users: profiles || [] };
}

// 2. Mở hoặc tạo mới đoạn chat 1-1
export async function getOrCreateDirectConversation(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };
  if (user.id === targetUserId) return { error: 'Không thể chat với chính mình' };

  const admin = getAdminClient();

  // Kiểm tra xem đã có conversation direct giữa 2 người chưa
  const { data: userConvs } = await admin
    .from('conversation_participants')
    .select('conversation_id, conversations(type)')
    .eq('user_id', user.id);

  const directConvIds = (userConvs || [])
    .filter((c: any) => c.conversations?.type === 'direct')
    .map((c: any) => c.conversation_id);

  if (directConvIds.length > 0) {
    const { data: partnerMatch } = await admin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', targetUserId)
      .in('conversation_id', directConvIds)
      .maybeSingle();

    if (partnerMatch) {
      return { conversationId: partnerMatch.conversation_id };
    }
  }

  // Nếu chưa có, tạo conversation mới
  const { data: newConv, error: createError } = await admin
    .from('conversations')
    .insert({
      type: 'direct',
      created_by: user.id,
      last_message_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (createError || !newConv) {
    return { error: createError?.message || 'Không thể tạo cuộc trò chuyện' };
  }

  // Thêm 2 thành viên
  const { error: partError } = await admin
    .from('conversation_participants')
    .insert([
      { conversation_id: newConv.id, user_id: user.id, role: 'admin' },
      { conversation_id: newConv.id, user_id: targetUserId, role: 'member' }
    ]);

  if (partError) {
    return { error: partError.message };
  }

  return { conversationId: newConv.id };
}

// 3. Tạo nhóm chat lớp học và tự động add học sinh đã join
export async function createClassGroupConversation(classId: string, customTitle?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const admin = getAdminClient();

  // 1. Kiểm tra lớp học & quyền giáo viên
  const { data: clazz, error: classError } = await admin
    .from('classes')
    .select('id, name, teacher_id')
    .eq('id', classId)
    .single();

  if (classError || !clazz) {
    return { error: 'Không tìm thấy lớp học' };
  }

  const groupTitle = customTitle?.trim() || `Lớp ${clazz.name}`;

  // 2. Tạo conversation group
  const { data: newConv, error: convError } = await admin
    .from('conversations')
    .insert({
      type: 'group',
      title: groupTitle,
      class_id: classId,
      created_by: user.id,
      last_message_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (convError || !newConv) {
    return { error: convError?.message || 'Không thể tạo nhóm chat' };
  }

  // 3. Lấy danh sách học sinh đã có tài khoản (user_id) trong lớp
  const { data: enrollments } = await admin
    .from('enrollments')
    .select('student_id, students(user_id)')
    .eq('class_id', classId)
    .eq('status', 'ACTIVE');

  const participants = [{ conversation_id: newConv.id, user_id: user.id, role: 'admin' }];
  const addedUserIds = new Set<string>([user.id]);

  (enrollments || []).forEach((e: any) => {
    const studentUser = Array.isArray(e.students) ? e.students[0] : e.students;
    if (studentUser?.user_id && !addedUserIds.has(studentUser.user_id)) {
      addedUserIds.add(studentUser.user_id);
      participants.push({
        conversation_id: newConv.id,
        user_id: studentUser.user_id,
        role: 'member'
      });
    }
  });

  const { error: partError } = await admin
    .from('conversation_participants')
    .insert(participants);

  if (partError) {
    console.error('Error adding participants to class group:', partError);
  }

  // Gửi 1 tin nhắn chào mừng nhóm
  await admin.from('messages').insert({
    conversation_id: newConv.id,
    sender_id: user.id,
    content: `Chào mừng các bạn đến với nhóm chat ${groupTitle}! 🎉`,
    type: 'text'
  });

  return { conversationId: newConv.id, memberCount: participants.length };
}

// 4. Lấy danh sách hội thoại của người dùng hiện tại
export async function getUserConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { conversations: [] };

  const admin = getAdminClient();

  // Lấy các conversation_id mà user tham gia
  const { data: myParticipations, error: partError } = await admin
    .from('conversation_participants')
    .select('conversation_id, last_read_at, role')
    .eq('user_id', user.id);

  if (partError || !myParticipations || myParticipations.length === 0) {
    return { conversations: [] };
  }

  const convMap = new Map(myParticipations.map(p => [p.conversation_id, p]));
  const convIds = Array.from(convMap.keys());

  // Lấy thông tin các conversation
  const { data: conversations, error: convError } = await admin
    .from('conversations')
    .select(`
      id,
      type,
      title,
      class_id,
      created_by,
      created_at,
      last_message_at,
      last_message_text,
      conversation_participants (
        user_id,
        role,
        profiles (
          id,
          full_name,
          avatar_url,
          role,
          email,
          phone
        )
      )
    `)
    .in('id', convIds)
    .order('last_message_at', { ascending: false });

  if (convError || !conversations) {
    return { conversations: [] };
  }

  // Format dữ liệu cho Frontend
  const formatted = conversations.map((conv: any) => {
    const myPart = convMap.get(conv.id);
    const participants = (conv.conversation_participants || []).map((cp: any) => {
      const prof = Array.isArray(cp.profiles) ? cp.profiles[0] : cp.profiles;
      return {
        userId: cp.user_id,
        role: cp.role,
        fullName: prof?.full_name || 'Người dùng',
        avatarUrl: prof?.avatar_url || null,
        userRole: prof?.role || 'student',
        email: prof?.email,
        phone: prof?.phone
      };
    });

    let displayTitle = conv.title;
    let partnerInfo = null;

    if (conv.type === 'direct') {
      const partner = participants.find((p: any) => p.userId !== user.id);
      if (partner) {
        displayTitle = partner.fullName;
        partnerInfo = partner;
      } else {
        displayTitle = 'Cuộc trò chuyện';
      }
    }

    return {
      id: conv.id,
      type: conv.type,
      title: displayTitle,
      classId: conv.class_id,
      createdBy: conv.created_by,
      lastMessageAt: conv.last_message_at || conv.created_at,
      lastMessageText: conv.last_message_text || 'Chưa có tin nhắn',
      lastReadAt: myPart?.last_read_at || null,
      isUnread: Boolean(
        conv.last_message_text && 
        (!myPart?.last_read_at || new Date(conv.last_message_at || 0) > new Date(myPart.last_read_at))
      ),
      myRole: myPart?.role || 'member',
      memberCount: participants.length,
      partnerInfo,
      participants
    };
  });

  return { conversations: formatted };
}

// 5. Lấy danh sách tin nhắn của một hội thoại
export async function getConversationMessages(conversationId: string, limit = 50, offset = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { messages: [] };

  const admin = getAdminClient();

  const { data: messages, error } = await admin
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      type,
      metadata,
      created_at,
      profiles:sender_id (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching messages:', error);
    return { messages: [] };
  }

  const formatted = (messages || []).map((m: any) => {
    const sender = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      type: m.type,
      metadata: m.metadata,
      createdAt: m.created_at,
      senderName: sender?.full_name || 'Người dùng',
      senderAvatar: sender?.avatar_url || null,
      senderRole: sender?.role || 'student'
    };
  });

  return { messages: formatted };
}

// 6. Gửi tin nhắn
export async function sendMessage(conversationId: string, content: string, type = 'text', metadata: any = null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const text = content.trim();
  if (!text) return { error: 'Nội dung tin nhắn không được để trống' };

  const admin = getAdminClient();

  // 1. Insert message
  const { data: newMsg, error: msgError } = await admin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: text,
      type,
      metadata
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      type,
      metadata,
      created_at
    `)
    .single();

  if (msgError || !newMsg) {
    return { error: msgError?.message || 'Lỗi gửi tin nhắn' };
  }

  // 2. Cập nhật last_message_at và last_message_text trên conversation
  await admin
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_text: text
    })
    .eq('id', conversationId);

  // 3. Cập nhật last_read_at cho chính người gửi
  await admin
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  const formattedMsg = {
    id: newMsg.id,
    conversationId: newMsg.conversation_id,
    senderId: newMsg.sender_id,
    content: newMsg.content,
    type: newMsg.type,
    metadata: newMsg.metadata,
    createdAt: newMsg.created_at,
    senderName: profile?.full_name || 'Người dùng',
    senderAvatar: profile?.avatar_url || null,
    senderRole: profile?.role || 'student'
  };

  return { success: true, message: formattedMsg };
}

// 7. Đánh dấu đã đọc
export async function markConversationAsRead(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const admin = getAdminClient();
  await admin
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  return { success: true };
}

// 8. Rời khỏi nhóm chat
export async function leaveConversation(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const admin = getAdminClient();

  // Xóa user khỏi conversation_participants
  const { error } = await admin
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  // Gửi tin nhắn thông báo rời nhóm
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single();
  const userName = profile?.full_name || 'Một thành viên';
  await admin.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `${userName} đã rời khỏi nhóm chat.`,
    type: 'system'
  });

  return { success: true };
}

// 9. Đổi tên nhóm chat
export async function updateGroupTitle(conversationId: string, newTitle: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const title = newTitle.trim();
  if (!title) return { error: 'Tên nhóm không được để trống' };

  const admin = getAdminClient();

  const { error } = await admin
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// 10. Lấy danh sách lớp học của giáo viên (để tạo nhóm chat)
export async function getTeacherClassesForChat() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { classes: [] };

  const admin = getAdminClient();

  const { data: classes } = await admin
    .from('classes')
    .select(`
      id,
      name,
      subject,
      enrollments (
        id,
        status
      )
    `)
    .eq('teacher_id', user.id)
    .eq('is_active', true);

  const formatted = (classes || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    studentCount: (c.enrollments || []).filter((e: any) => e.status === 'ACTIVE').length
  }));

  return { classes: formatted };
}

// 11. Giải tán nhóm chat (Chỉ trưởng nhóm / giáo viên tạo nhóm)
export async function disbandGroupConversation(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const admin = getAdminClient();

  const { data: conv, error: convError } = await admin
    .from('conversations')
    .select('id, type, created_by')
    .eq('id', conversationId)
    .single();

  if (convError || !conv || conv.type !== 'group') {
    return { error: 'Không tìm thấy nhóm chat' };
  }

  const { data: myPart } = await admin
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (conv.created_by !== user.id && myPart?.role !== 'admin') {
    return { error: 'Chỉ trưởng nhóm mới có quyền giải tán nhóm' };
  }

  // Xóa toàn bộ tin nhắn, thành viên, và nhóm chat
  await admin.from('messages').delete().eq('conversation_id', conversationId);
  await admin.from('conversation_participants').delete().eq('conversation_id', conversationId);
  const { error: deleteError } = await admin.from('conversations').delete().eq('id', conversationId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  return { success: true };
}

// 12. Xóa thành viên khỏi nhóm chat
export async function kickGroupMember(conversationId: string, targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  const admin = getAdminClient();

  const { data: conv } = await admin
    .from('conversations')
    .select('id, created_by')
    .eq('id', conversationId)
    .single();

  const { data: myPart } = await admin
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (conv?.created_by !== user.id && myPart?.role !== 'admin') {
    return { error: 'Bạn không có quyền xóa thành viên này' };
  }

  const { error } = await admin
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', targetUserId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// 13. Lấy số lượng tin nhắn / đoạn chat chưa đọc
export async function getUnreadChatCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { unreadCount: 0 };

  const admin = getAdminClient();

  // Lấy danh sách conversation_participants của user
  const { data: myParts } = await admin
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id);

  if (!myParts || myParts.length === 0) {
    return { unreadCount: 0 };
  }

  const convIds = myParts.map(p => p.conversation_id);
  const partMap = new Map(myParts.map(p => [p.conversation_id, p.last_read_at]));

  // Lấy các cuộc trò chuyện có tin nhắn
  const { data: convs } = await admin
    .from('conversations')
    .select('id, last_message_at, last_message_text')
    .in('id', convIds);

  let unreadCount = 0;
  (convs || []).forEach(conv => {
    if (!conv.last_message_text) return;
    const lastRead = partMap.get(conv.id);
    if (!lastRead) {
      if (conv.last_message_at) unreadCount++;
    } else if (conv.last_message_at && new Date(conv.last_message_at) > new Date(lastRead)) {
      unreadCount++;
    }
  });

  return { unreadCount };
}
