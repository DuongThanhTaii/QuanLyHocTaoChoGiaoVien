import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { SITE_CONFIG } from '@/config/landing-data';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật | Mari',
  description: 'Cách Mari thu thập, sử dụng và bảo vệ dữ liệu, bao gồm quyền truy cập Google Drive.',
  alternates: { canonical: '/privacy' },
};

const updatedAt = '04/09/2026';

export default function PrivacyPage() {
  return <div className="min-h-screen bg-[#fffdf9] text-slate-900 dark:bg-zinc-950 dark:text-zinc-50">
    <Navbar />
    <main className="pt-16">
      <section className="border-b border-orange-100 bg-[radial-gradient(circle_at_top_right,#ffe4b8,transparent_34%),linear-gradient(135deg,#fffaf2,#fffdf9)] px-5 py-16 dark:border-zinc-800 dark:bg-zinc-950 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 transition hover:text-orange-800 dark:text-orange-300"><ArrowLeft className="size-4" />Về trang chủ</Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Mari · mari.io.vn</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Chính sách bảo mật</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-zinc-300">Chính sách này giải thích rõ dữ liệu Mari sử dụng, lý do Mari yêu cầu quyền Google Drive và cách chúng tôi bảo vệ thông tin của bạn.</p>
          <p className="mt-6 text-sm text-slate-500 dark:text-zinc-400">Cập nhật lần cuối: {updatedAt}</p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <div className="border-l-4 border-orange-500 bg-orange-50 px-5 py-4 text-sm leading-6 text-slate-700 dark:bg-orange-950/30 dark:text-zinc-200">
          Mari chỉ yêu cầu kết nối Google Drive khi giáo viên chủ động dùng chức năng tải lên và quản lý học liệu. Bạn vẫn có thể sử dụng các chức năng khác của Mari mà không kết nối Google Drive.
        </div>

        <div className="mt-12 space-y-12 leading-7 text-slate-700 dark:text-zinc-300">
          <PolicySection title="1. Quyền Google Drive được dùng để làm gì?">
            <p>Khi bạn chọn “Kết nối Google Drive”, Mari yêu cầu quyền <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800 dark:bg-zinc-800 dark:text-zinc-100">drive.file</code>. Quyền này cho phép Mari tạo, xem, tải lên, cập nhật và quản lý <strong>những tệp học liệu do Mari tạo hoặc được bạn chọn thông qua Mari</strong>; Mari không yêu cầu quyền đọc toàn bộ Google Drive cá nhân của bạn.</p>
            <p>Quyền này chỉ phục vụ các chức năng: tải bài giảng/bài tập, lưu học liệu vào thư mục <strong>MariHocLieu</strong> trên Drive của bạn, hiển thị danh sách học liệu, gắn học liệu vào lớp học và cho phép bạn tải/xóa các tệp đó từ Mari.</p>
          </PolicySection>

          <PolicySection title="2. Dữ liệu Mari xử lý">
            <p>Tùy theo chức năng bạn sử dụng, Mari có thể xử lý thông tin tài khoản (họ tên, email, số điện thoại), dữ liệu lớp học, thông tin học sinh/phụ huynh mà giáo viên nhập, lịch học, trao đổi, thông tin thanh toán và metadata của học liệu (tên tệp, loại tệp, dung lượng, đường dẫn tệp).</p>
            <p>Nội dung tệp học liệu bạn tải lên được lưu trong Google Drive mà bạn đã kết nối. Mari dùng metadata cần thiết để hiển thị và quản lý học liệu trong tài khoản của bạn.</p>
          </PolicySection>

          <PolicySection title="3. Cách dữ liệu được bảo vệ">
            <ul className="list-disc space-y-2 pl-5">
              <li>Dữ liệu được truyền qua kết nối HTTPS.</li>
              <li>Đăng nhập Google sử dụng OAuth; Mari không nhận hoặc lưu mật khẩu Google của bạn.</li>
              <li>Token Google được lưu ở phía máy chủ để thực hiện yêu cầu bạn đã cho phép, không được hiển thị cho người dùng khác hoặc gửi vào trình duyệt như dữ liệu công khai.</li>
              <li>Các kiểm soát xác thực và phân quyền của Mari giới hạn người dùng chỉ truy cập dữ liệu thuộc tài khoản/lớp học mà họ được phép.</li>
              <li>Chúng tôi không bán, cho thuê hoặc dùng dữ liệu Google Drive để quảng cáo hay huấn luyện mô hình cho bên thứ ba.</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. Chia sẻ và thời gian lưu trữ">
            <p>Mari chỉ chia sẻ dữ liệu khi cần để vận hành dịch vụ, thực hiện nghĩa vụ pháp lý hoặc theo yêu cầu/hành động của bạn. Học liệu trên Drive vẫn thuộc Google Drive của bạn. Dữ liệu được giữ trong thời gian tài khoản còn hoạt động hoặc theo thời hạn cần thiết để vận hành, bảo mật, giải quyết tranh chấp và tuân thủ nghĩa vụ pháp lý.</p>
            <p>Bạn có thể xóa học liệu trong Mari. Để ngừng Mari truy cập Drive, bạn có thể thu hồi quyền của Mari trong phần Quyền truy cập của Tài khoản Google; một số chức năng quản lý học liệu sẽ không còn hoạt động sau đó.</p>
          </PolicySection>

          <PolicySection title="5. Quyền của bạn và liên hệ">
            <p>Bạn có thể yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân mà Mari đang quản lý, hoặc đặt câu hỏi về chính sách này. Hãy liên hệ tại <a className="font-medium text-orange-700 underline underline-offset-4 dark:text-orange-300" href={`mailto:${SITE_CONFIG.contact.email}`}>{SITE_CONFIG.contact.email}</a>.</p>
            <p>Khi có thay đổi quan trọng, Mari sẽ cập nhật chính sách trên trang này và điều chỉnh ngày cập nhật ở đầu trang.</p>
          </PolicySection>
        </div>
      </article>
    </main>
    <Footer />
  </div>;
}

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return <section>
    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
    <div className="mt-4 space-y-4 text-[15px] leading-7">{children}</div>
  </section>;
}
