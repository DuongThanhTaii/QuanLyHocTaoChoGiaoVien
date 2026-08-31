-- Migration 14: Cải tiến Chat Realtime (1-1, Nhóm lớp, Hiệu năng)

-- Bổ sung các cột cho bảng conversations
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_message_text TEXT,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Bổ sung các cột cho bảng conversation_participants
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member', -- 'admin', 'member'
  ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;

-- Indexes tối ưu hóa tốc độ truy vấn chat
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user 
  ON public.conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_class 
  ON public.conversations(class_id);

CREATE INDEX IF NOT EXISTS idx_conversations_last_msg 
  ON public.conversations(last_message_at DESC);

-- Bật Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Cập nhật RLS Policies (Nếu chưa có)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Allow participants to view conversations'
  ) THEN
    CREATE POLICY "Allow participants to view conversations" ON public.conversations
      FOR SELECT USING (
        id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Allow participants to view messages'
  ) THEN
    CREATE POLICY "Allow participants to view messages" ON public.messages
      FOR SELECT USING (
        conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Allow participants to insert messages'
  ) THEN
    CREATE POLICY "Allow participants to insert messages" ON public.messages
      FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
      );
  END IF;
END
$$;
