import ChatWindow from '@/components/chat/ChatWindow';

export default function TeacherChatPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Tin nhắn</h1>
      
      <div className="flex gap-6 h-[600px]">
        {/* Sidebar */}
        <div className="w-1/3 bg-white border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700">
            Hội thoại
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b hover:bg-gray-50 cursor-pointer bg-blue-50">
              <h3 className="font-semibold text-gray-800">Toán 12A (Nhóm lớp)</h3>
              <p className="text-sm text-gray-500 truncate">Học sinh A: Thầy ơi cho em hỏi...</p>
            </div>
            <div className="p-4 border-b hover:bg-gray-50 cursor-pointer">
              <h3 className="font-semibold text-gray-800">Phụ huynh em B</h3>
              <p className="text-sm text-gray-500 truncate">Vâng cảm ơn thầy ạ.</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3">
          <ChatWindow conversationId="demo-conv-1" currentUserId="teacher-1" />
        </div>
      </div>
    </div>
  );
}
