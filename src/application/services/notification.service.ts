import { SupabaseClient } from '@supabase/supabase-js';

// Giao diện dữ liệu thông báo
export interface NotificationData {
  userId: string;
  title: string;
  content: string;
  type: string;
  metadata?: any;
}

export class NotificationService {
  constructor(private readonly supabaseAdmin: SupabaseClient) {}

  // Lưu thông báo vào CSDL (để hiển thị In-App Notification)
  async createInAppNotification(data: NotificationData) {
    const { error } = await this.supabaseAdmin
      .from('notifications')
      .insert([
        {
          user_id: data.userId,
          title: data.title,
          content: data.content,
          type: data.type,
          metadata: data.metadata,
        }
      ]);
      
    if (error) {
      console.error('Failed to create in-app notification:', error);
    }
  }

  // Gửi thông báo Email
  async sendEmailNotification(email: string, title: string, content: string) {
    // TODO: Tích hợp dịch vụ gửi Email (ví dụ: Resend, SendGrid, Nodemailer)
    // Tạm thời giả lập việc gửi Email
    console.log(`[Email Mock] Sending to ${email}...`);
    console.log(`[Email Mock] Subject: ${title}`);
    console.log(`[Email Mock] Body: ${content}`);
    // return await resend.emails.send({ ... });
  }

  // Gửi thông báo Push (FCM - Firebase Cloud Messaging)
  async sendPushNotification(userId: string, title: string, body: string) {
    // 1. Lấy token của user từ bảng user_fcm_tokens
    const { data: tokens, error } = await this.supabaseAdmin
      .from('user_fcm_tokens')
      .select('token')
      .eq('user_id', userId);
      
    if (error || !tokens || tokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }

    // 2. Tích hợp firebase-admin để gửi thông báo
    // TODO: Cài đặt và cấu hình firebase-admin
    // Tạm thời giả lập
    console.log(`[FCM Mock] Sending push notification to user ${userId} with ${tokens.length} devices.`);
    console.log(`[FCM Mock] Title: ${title}`);
    console.log(`[FCM Mock] Body: ${body}`);
    
    /* 
    const fcmTokens = tokens.map(t => t.token);
    await admin.messaging().sendMulticast({
      tokens: fcmTokens,
      notification: { title, body }
    });
    */
  }

  // Hàm tổng hợp gửi thông báo đa kênh
  async notifyUser(userId: string, email: string | null, title: string, content: string, type: string, metadata?: any) {
    // 1. In-App
    await this.createInAppNotification({ userId, title, content, type, metadata });
    
    // 2. Email
    if (email) {
      await this.sendEmailNotification(email, title, content);
    }
    
    // 3. Push
    await this.sendPushNotification(userId, title, content);
  }
}
