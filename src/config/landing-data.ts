export interface NavLinkItem {
  title: string;
  href: string;
  description?: string;
  badge?: string;
}

export interface NavMenuCategory {
  title: string;
  href?: string;
  menu?: NavLinkItem[];
}

export const SITE_CONFIG = {
  name: "Mari",
  slogan: "Nền tảng Quản lý Học tập & Lớp học Toàn diện cho Giáo viên",
  description:
    "Đơn giản hóa điểm danh QR, nhắc lịch dạy, báo cáo tiến độ phụ huynh và tự động hóa học phí qua VietQR chỉ trên một nền tảng duy nhất.",
  url: "https://mari.io.vn",
  contact: {
    hotline: "0356 170 187",
    email: "duongthanhtai1308@gmail.com",
    address: " phường Bình Lợi Trung, TP. Hồ Chí Minh",
  },
};

export const NAV_LINKS: NavMenuCategory[] = [
  {
    title: "Tính năng",
    menu: [
      {
        title: "Điểm danh thông minh",
        href: "#features",
        description:
          "Điểm danh QR 1 chạm, tự động gửi thông báo tức thì cho phụ huynh.",
      },
      {
        title: "Học phí VietQR tự động",
        href: "#features",
        description:
          "Tự động sinh QR kèm cú pháp, gạch nợ tức thì không cần kiểm tra thủ công.",
      },
      {
        title: "Thời khóa biểu & Lịch dạy",
        href: "#features",
        description:
          "Quản lý lịch học, tự động nhắc nhở và thông báo đổi lịch/học bù.",
      },
      {
        title: "Sổ liên lạc số 3 bên",
        href: "#features",
        description:
          "Kết nối trực tiếp Giáo viên - Phụ huynh - Học sinh, lưu trữ bài tập an toàn.",
      },
    ],
  },
  {
    title: "Quy trình",
    href: "#process",
  },
  {
    title: "Bảng giá",
    href: "#pricing",
  },
  {
    title: "Đánh giá",
    href: "#testimonials",
  },
  {
    title: "Hỏi đáp",
    href: "#faq",
  },
];

export const METRICS = [
  {
    value: "2,500+",
    label: "Giáo viên & Gia sư",
    description: "Đang tin dùng mỗi ngày trên toàn quốc",
  },
  {
    value: "45,000+",
    label: "Buổi học được quản lý",
    description: "Điểm danh chính xác, không nhầm lẫn",
  },
  {
    value: "99.8%",
    label: "Học phí gạch nợ tự động",
    description: "Qua VietQR động chính xác từng giao dịch",
  },
  {
    value: "5+ Giờ",
    label: "Tiết kiệm mỗi tuần",
    description: "Giải phóng thời gian làm sổ sách, đối soát",
  },
];

export const PROCESS_STEPS = [
  {
    step: "01",
    title: "Khởi tạo lớp và học sinh",
    description:
      "Nhập danh sách học sinh từ file Excel chỉ trong 30 giây. Hệ thống tự động tạo mã QR định danh và tài khoản kết nối cho từng học sinh.",
    badge: "Bắt đầu nhanh",
    catDialogue: "Chào thầy cô! Em đã sẵn sàng hỗ trợ lớp học rồi ạ! 🐾",
  },
  {
    step: "02",
    title: "Giảng dạy và điểm danh 1 chạm",
    description:
      "Điểm danh nhanh bằng quét mã QR hoặc chạm tick. Hệ thống tự động cập nhật lịch sử chuyên cần và gửi thông báo trực tiếp đến phụ huynh.",
    badge: "Tiết kiệm 80% thời gian",
    catDialogue: "Học sinh điểm danh đúng giờ, phụ huynh yên tâm tuyệt đối! ✨",
  },
  {
    step: "03",
    title: "Tự động hóa Học phí VietQR",
    description:
      "Mỗi kỳ học phí, hệ thống tự xuất hóa đơn và mã VietQR chuẩn xác. Phụ huynh thanh toán là gạch nợ real-time, không cần chụp màn hình chuyển khoản.",
    badge: "Minh bạch & Chính xác",
    catDialogue:
      "Học phí về tài khoản ngay, sổ sách tự động cân đối luôn nha! 💰",
  },
];

export const PRICING_PLANS = [
  {
    name: "Free",
    tier: "free",
    priceMonthly: "0đ",
    priceYearly: "0đ",
    period: "mãi mãi",
    description:
      "Dành cho giáo viên mới bắt đầu với lớp học quy mô nhỏ.",
    popular: false,
    cta: "Bắt đầu miễn phí",
    features: [
      "Tối đa 2 lớp đang hoạt động",
      "Tối đa 30 học sinh mỗi lớp",
      "Tối đa 2 đoạn chat đang hoạt động",
      "Điểm danh cơ bản",
      "Thời khóa biểu cá nhân",
      "Báo cáo điểm danh cơ bản",
      "Hỗ trợ cộng đồng",
    ],
  },
  {
    name: "Giáo viên Pro",
    tier: "pro",
    priceMonthly: "99.000đ",
    priceYearly: "990.000đ",
    period: "tháng",
    yearlyNote: "Thanh toán theo năm (tiết kiệm 20%)",
    description:
      "Dành cho giáo viên chuyên nghiệp cần tự động hóa vận hành lớp học.",
    popular: true,
    highlightBadge: "Được tin dùng nhiều nhất",
    cta: "Nâng cấp Pro",
    features: [
      "Tối đa 12 lớp đang hoạt động",
      "Tối đa 60 học sinh mỗi lớp",
      "Tối đa 20 đoạn chat đang hoạt động",
      "Tự động tạo mã VietQR động thu học phí",
      "Gạch nợ học phí tự động tức thì",
      "Điểm danh mã QR cá nhân cho học sinh",
      "Thông báo tự động đến Phụ huynh",
      "20 GB kho tài liệu & bài tập",
      "Báo cáo phân tích doanh thu chuyên sâu",
      "Hỗ trợ kỹ thuật ưu tiên 24/7",
    ],
  },
  {
    name: "Giáo viên Max",
    tier: "max",
    priceMonthly: "249.000đ",
    priceYearly: "2.490.000đ",
    period: "tháng",
    yearlyNote: "Thanh toán theo năm (tiết kiệm 20%)",
    description:
      "Dành cho giáo viên, nhóm lớp có số lượng học sinh và nội dung lớn.",
    popular: false,
    cta: "Nâng cấp Max",
    features: [
      "Tất cả quyền lợi của gói Pro",
      "Tối đa 40 lớp đang hoạt động",
      "Tối đa 150 học sinh mỗi lớp",
      "Tối đa 100 đoạn chat đang hoạt động",
      "100 GB kho tài liệu",
      "Tùy biến thương hiệu & ưu tiên hỗ trợ",
    ],
  },
];

export const TESTIMONIALS = [
  {
    name: "Thầy Hoàng Văn Nam",
    role: "Giáo viên Toán THPT & Luyện thi ĐH (Hà Nội)",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    content:
      "Trước đây tôi quản lý 6 lớp với hơn 150 em học sinh, mỗi đầu tháng là ác mộng với việc kiểm tra tin nhắn chuyển khoản học phí. Từ ngày dùng tính năng VietQR tự động của Gia Sư Pro, tôi tiết kiệm được ít nhất 2 ngày mỗi tháng. Phụ huynh ai cũng khen chuyên nghiệp!",
  },
  {
    name: "Cô Nguyễn Thu Trang",
    role: "Chủ nhiệm CLB Tiếng Anh & Gia sư IELTS (Đà Nẵng)",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    content:
      "Tính năng điểm danh QR cực kỳ mượt mà. Học sinh vào lớp chỉ cần quét mã thẻ, máy báo 'ting ting' là phụ huynh ở nhà biết ngay con đã đến lớp an toàn. Rất đáng giá cho mọi thầy cô!",
  },
  {
    name: "Thầy Lê Minh Đức",
    role: "Gia sư Hóa học & Quản lý Tổ hợp dạy thêm (TP. HCM)",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    content:
      "Giao diện hiện đại, trực quan và đặc biệt tông màu cam trắng nhìn rất sáng, tràn đầy năng lượng. Hệ thống quản lý lịch học bù và tài liệu rất tiện lợi cho học sinh theo dõi.",
  },
  {
    name: "Chị Phạm Minh Anh",
    role: "Phụ huynh bé Tuấn Kiệt (Lớp 11)",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    content:
      "Cảm giác rất an tâm khi theo dõi được lịch học, nhận xét của thầy cô sau mỗi buổi học ngay trên điện thoại. Đóng học phí thì chỉ cần mở app ngân hàng quét mã QR là xong ngay, không sợ nhầm lẫn.",
  },
];

export const FAQS = [
  {
    question: "Gia Sư Pro có cần cài đặt phần mềm phức tạp không?",
    answer:
      "Hoàn toàn không. Gia Sư Pro là nền tảng web hiện đại (Cloud SaaS), bạn có thể truy cập mượt mà trên mọi thiết bị: máy tính bàn, laptop, iPad, điện thoại iPhone/Android chỉ qua trình duyệt web.",
  },
  {
    question: "Tính năng tự động hóa học phí qua VietQR hoạt động như thế nào?",
    answer:
      "Hệ thống sẽ tự động tạo một mã VietQR động tương ứng với số tiền học phí và cú pháp định danh duy nhất cho từng học sinh. Khi phụ huynh quét mã thanh toán bằng bất kỳ app ngân hàng nào (MBBank, Techcombank, Vietcombank, v.v.), hệ thống sẽ nhận diện và tự động đánh dấu 'Đã thanh toán' ngay lập tức mà bạn không cần kiểm tra số dư thủ công.",
  },
  {
    question: "Học sinh và Phụ huynh có phải trả phí để sử dụng không?",
    answer:
      "Không. Phụ huynh và Học sinh được sử dụng hoàn toàn miễn phí để xem thời khóa biểu, nhận thông báo điểm danh, tải tài liệu bài tập và đóng học phí.",
  },
  {
    question:
      "Tôi có thể chuyển danh sách học sinh từ file Excel cũ sang không?",
    answer:
      "Có! Gia Sư Pro hỗ trợ tính năng Import từ file Excel sẵn có. Bạn chỉ cần tải file danh sách học sinh hiện tại lên, hệ thống sẽ tự động phân loại và khởi tạo đầy đủ dữ liệu trong vòng vài chục giây.",
  },
  {
    question: "Dữ liệu học sinh và thông tin liên lạc có được bảo mật không?",
    answer:
      "Dữ liệu của bạn được mã hóa an toàn trên máy chủ đám mây chuẩn quốc tế (Supabase / AWS), đảm bảo quyền riêng tư tuyệt đối cho giáo viên và thông tin của học sinh.",
  },
];
