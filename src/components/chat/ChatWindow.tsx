'use client'

import { useState } from 'react';
import { useSupabaseRealtime } from '@/infrastructure/realtime/use-supabase-realtime';

export default function ChatWindow({ conversationId, currentUserId }: { conversationId: string, currentUserId: string }) {
  const { messages } = useSupabaseRealtime(conversationId);
  const [inputText, setInputText] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Server Action would be called here to save message
    // await sendTextMessage(conversationId, inputText);
    
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-100 p-4 border-b font-semibold text-gray-800">
        Chat Nhóm
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {msg.type === 'invoice_link' && (
                  <div className="flex items-center gap-2">
                    <span>🧾</span> <strong>Hóa đơn học phí</strong>
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-gray-50 border-t flex gap-2">
        <input 
          type="text" 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          placeholder="Nhập tin nhắn..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 rounded-full font-semibold hover:bg-blue-700">
          Gửi
        </button>
      </form>
    </div>
  );
}
