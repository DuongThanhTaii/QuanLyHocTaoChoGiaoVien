import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { SITE_CONFIG } from '@/config/landing-data';
import { PublicLightTheme } from '@/components/providers/PublicLightTheme';
import { getCurrentLandingUser } from '@/lib/auth/get-current-landing-user';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật | Mari',
  description: 'Cách Mari thu thập, sử dụng, chia sẻ và bảo vệ dữ liệu cá nhân.',
  alternates: { canonical: '/privacy' },
};

const updatedAt = '04/09/2026';

export default async function PrivacyPage() {
  const currentUser = await getCurrentLandingUser();
  return <PublicLightTheme><div className="min-h-screen bg-[#fffdf9] text-slate-900 dark:bg-zinc-950 dark:text-zinc-50">
    <Navbar user={currentUser} />
    <main className="pt-16">
      <section className="border-b border-orange-100 bg-[radial-gradient(circle_at_top_right,#ffe4b8,transparent_34%),linear-gradient(135deg,#fffaf2,#fffdf9)] px-5 py-16 dark:border-zinc-800 dark:bg-zinc-950 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 transition hover:text-orange-800 dark:text-orange-300"><ArrowLeft className="size-4" />Về trang chủ</Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Mari · mari.io.vn</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Chính sách bảo mật</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-zinc-300">Cách Mari thu thập, sử dụng, lưu trữ, chia sẻ và bảo vệ thông tin khi bạn quản lý hoặc tham gia lớp học trên nền tảng.</p>
          <p className="mt-6 text-sm text-slate-500 dark:text-zinc-400">Ngày hiệu lực và cập nhật lần cuối: {updatedAt}</p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <div className="border-l-4 border-orange-500 bg-orange-50 px-5 py-4 text-sm leading-6 text-slate-700 dark:bg-orange-950/30 dark:text-zinc-200">
          Bằng việc tạo tài khoản, đăng nhập hoặc sử dụng Mari, bạn xác nhận đã đọc Chính sách này và <Link href="/terms" className="font-medium text-orange-700 underline underline-offset-2 dark:text-orange-300">Điều khoản sử dụng</Link>. Mari chỉ xử lý dữ liệu trong phạm vi cần thiết để cung cấp và bảo vệ dịch vụ.
        </div>

        <div className="mt-12 space-y-12 leading-7 text-slate-700 dark:text-zinc-300">
          <PolicySection title="1. Phạm vi và vai trò xử lý dữ liệu">
            <p>Chính sách này áp dụng cho website, tài khoản, các tính năng quản lý lớp học, học liệu, trao đổi, điểm danh, hóa đơn, gói dịch vụ và thông báo của Mari. Chính sách mô tả dữ liệu Mari xử lý khi bạn trực tiếp sử dụng nền tảng hoặc được giáo viên, phụ huynh, trường học hay tổ chức mời vào lớp.</p>
            <p>Giáo viên hoặc đơn vị tổ chức nhập dữ liệu học sinh/phụ huynh là bên chịu trách nhiệm bảo đảm đã thông báo, có căn cứ hợp pháp và lấy sự đồng ý khi pháp luật yêu cầu. Mari xử lý các dữ liệu đó để vận hành tính năng theo chỉ dẫn và quyền truy cập mà người dùng thiết lập.</p>
          </PolicySection>

          <PolicySection title="2. Dữ liệu Mari có thể thu thập">
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Dữ liệu tài khoản:</strong> họ tên, email, số điện thoại, vai trò, ảnh đại diện (nếu có), thông tin xác thực và mã định danh tài khoản.</li>
              <li><strong>Dữ liệu lớp học:</strong> thông tin học sinh, phụ huynh/người giám hộ, lớp học, lịch học, điểm danh, đánh giá, bài tập, học liệu, trao đổi và các dữ liệu do người dùng chủ động nhập hoặc tải lên.</li>
              <li><strong>Dữ liệu học phí và thanh toán:</strong> nội dung hóa đơn, kỳ thu, số tiền, trạng thái thanh toán, mã tham chiếu giao dịch, thông tin tài khoản nhận tiền do giáo viên thiết lập và thông tin đơn hàng gói Mari. Mari không yêu cầu hoặc lưu mật khẩu ngân hàng, số thẻ hay mã bảo mật thẻ của bạn.</li>
              <li><strong>Dữ liệu Google Drive:</strong> khi bạn chủ động liên kết Drive, Mari xử lý mã ủy quyền cần thiết và metadata tệp như tên, loại, kích thước, mã tệp và liên kết để lưu, gắn và quản lý học liệu.</li>
              <li><strong>Dữ liệu thông báo:</strong> nếu bạn cho phép thông báo trên trình duyệt, Mari lưu mã thiết bị/mã đăng ký thông báo để gửi thông báo liên quan đến tài khoản và lớp học.</li>
              <li><strong>Dữ liệu kỹ thuật:</strong> địa chỉ IP, nhật ký bảo mật, thông tin phiên đăng nhập, loại trình duyệt/thiết bị và thời điểm truy cập ở mức cần thiết để vận hành, phòng chống gian lận và khắc phục sự cố.</li>
            </ul>
          </PolicySection>

          <PolicySection title="3. Mục đích xử lý">
            <ul className="list-disc space-y-2 pl-5">
              <li>Tạo và bảo vệ tài khoản; xác thực đăng nhập, phân quyền và hỗ trợ khôi phục quyền truy cập.</li>
              <li>Cung cấp các tính năng quản lý lớp, học sinh, lịch học, điểm danh, đánh giá, học liệu, tin nhắn và báo cáo.</li>
              <li>Tạo hóa đơn, mã thanh toán, đối soát trạng thái giao dịch và quản lý quyền lợi của gói dịch vụ.</li>
              <li>Gửi thông báo trong hệ thống hoặc thông báo web khi bạn đã cấp quyền; hỗ trợ người dùng và phản hồi khiếu nại.</li>
              <li>Duy trì an ninh, ngăn chặn lạm dụng, sao lưu, cải thiện độ ổn định và tuân thủ nghĩa vụ pháp lý.</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. Google Drive và học liệu">
            <p>Khi bạn chọn “Kết nối Google Drive”, Mari yêu cầu quyền <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800 dark:bg-zinc-800 dark:text-zinc-100">drive.file</code>. Quyền này cho phép Mari tạo, xem, tải lên, cập nhật và quản lý <strong>các tệp do Mari tạo hoặc được bạn chọn thông qua Mari</strong>; Mari không yêu cầu quyền đọc toàn bộ Google Drive cá nhân của bạn.</p>
            <p>Quyền này chỉ được dùng để tải bài giảng/bài tập, lưu học liệu vào thư mục MariHocLieu, hiển thị danh sách học liệu, gắn học liệu vào lớp học và cho phép bạn quản lý các tệp đó. Mari không nhận hoặc lưu mật khẩu Google; bạn có thể thu hồi quyền trong phần Quyền truy cập của Tài khoản Google. Sau khi thu hồi, các chức năng học liệu dùng Drive sẽ bị giới hạn.</p>
          </PolicySection>

          <PolicySection title="5. Chia sẻ dữ liệu và bên cung cấp dịch vụ">
            <p>Mari không bán hoặc cho thuê dữ liệu cá nhân để quảng cáo. Mari chỉ chia sẻ dữ liệu tối thiểu cần thiết trong các trường hợp sau:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Supabase:</strong> cung cấp hạ tầng xác thực, cơ sở dữ liệu, lưu trữ và đồng bộ thời gian thực cho Mari.</li>
              <li><strong>Google:</strong> cung cấp đăng nhập Google và Google Drive khi bạn chọn sử dụng các tính năng đó.</li>
              <li><strong>PayOS và ngân hàng/VietQR:</strong> xử lý liên kết thanh toán hoặc xác nhận giao dịch theo yêu cầu thanh toán của bạn. Đối với học phí, thông tin nhận tiền do giáo viên/đơn vị tổ chức thiết lập và giao dịch được thực hiện trực tiếp theo kênh thanh toán tương ứng.</li>
              <li><strong>Firebase Cloud Messaging:</strong> chỉ khi bạn cho phép thông báo web, mã thiết bị được sử dụng để gửi thông báo tới trình duyệt của bạn.</li>
              <li><strong>Người dùng được cấp quyền:</strong> giáo viên, học sinh, phụ huynh, nhân sự tổ chức hoặc người tham gia lớp chỉ xem được dữ liệu phù hợp với vai trò và lớp học mà họ được cấp quyền.</li>
              <li><strong>Cơ quan có thẩm quyền:</strong> khi Mari có nghĩa vụ hoặc yêu cầu hợp pháp phải cung cấp thông tin.</li>
            </ul>
          </PolicySection>

          <PolicySection title="6. Liên kết công khai, hóa đơn và phân quyền">
            <p>Mari có thể tạo liên kết hoặc mã thanh toán để phụ huynh xem hóa đơn và đối soát. Người nhận liên kết có thể xem các thông tin cần thiết trên hóa đơn tương ứng; vì vậy, người lập hóa đơn cần chỉ gửi liên kết cho đúng người nhận và không công khai liên kết ở nơi không kiểm soát được.</p>
            <p>Mari áp dụng cơ chế xác thực và phân quyền theo tài khoản, vai trò và phạm vi lớp học. Tuy nhiên, người dùng vẫn cần bảo vệ mật khẩu, thiết bị và dữ liệu xuất/tải về của mình.</p>
          </PolicySection>

          <PolicySection title="7. Lưu trữ, xóa và thời hạn lưu giữ">
            <p>Dữ liệu được lưu trong thời gian tài khoản còn hoạt động hoặc trong thời gian cần thiết để cung cấp dịch vụ, bảo mật hệ thống, giải quyết khiếu nại/tranh chấp và thực hiện nghĩa vụ pháp lý. Khi bạn hoặc tổ chức yêu cầu xóa dữ liệu, Mari sẽ xử lý yêu cầu trong phạm vi tính năng, quan hệ quản lý dữ liệu và quy định pháp luật áp dụng.</p>
            <p>Một số dữ liệu có thể được giữ lại ở mức cần thiết trong bản sao lưu, nhật ký bảo mật, hồ sơ giao dịch hoặc khi pháp luật yêu cầu. Dữ liệu Drive vẫn nằm trong tài khoản Google Drive đã liên kết và có thể được bạn quản lý theo chính sách của Google.</p>
          </PolicySection>

          <PolicySection title="8. Biện pháp bảo vệ dữ liệu">
            <ul className="list-disc space-y-2 pl-5">
              <li>Dữ liệu được truyền qua kết nối HTTPS; Mari sử dụng xác thực và phân quyền để giới hạn truy cập.</li>
              <li>Đăng nhập Google sử dụng OAuth; Mari không nhận hoặc lưu mật khẩu Google hay mật khẩu ngân hàng của bạn.</li>
              <li>Mã truy cập Google phục vụ Drive được lưu ở phía máy chủ để thực hiện thao tác bạn đã cho phép, không được hiển thị công khai cho người dùng khác.</li>
              <li>Mari áp dụng các biện pháp kỹ thuật và tổ chức hợp lý để ngăn truy cập, sửa đổi, mất mát hoặc tiết lộ trái phép.</li>
            </ul>
            <p>Không hệ thống nào an toàn tuyệt đối. Bạn cần dùng mật khẩu mạnh, không chia sẻ thông tin đăng nhập và thông báo ngay cho Mari nếu nghi ngờ tài khoản bị truy cập trái phép.</p>
          </PolicySection>

          <PolicySection title="9. Dữ liệu trẻ em và người chưa thành niên">
            <p>Mari có thể xử lý dữ liệu học sinh do giáo viên, phụ huynh hoặc tổ chức giáo dục cung cấp để quản lý lớp học. Bên nhập dữ liệu có trách nhiệm bảo đảm quyền đại diện, việc thông báo và sự đồng ý của cha mẹ/người giám hộ khi cần thiết.</p>
            <p>Người chưa đủ tuổi tự giao kết theo quy định pháp luật chỉ nên tạo hoặc sử dụng tài khoản với sự đồng ý và giám sát phù hợp của cha mẹ/người giám hộ. Nếu bạn tin rằng dữ liệu trẻ em đã được cung cấp không phù hợp, hãy liên hệ Mari để được xem xét.</p>
          </PolicySection>

          <PolicySection title="10. Quyền và lựa chọn của bạn">
            <p>Trong phạm vi pháp luật áp dụng, bạn có thể yêu cầu được biết, truy cập, chỉnh sửa, cập nhật, rút lại sự đồng ý, hạn chế xử lý, yêu cầu xóa dữ liệu hoặc khiếu nại về việc xử lý dữ liệu cá nhân. Bạn cũng có thể tắt thông báo trong cài đặt trình duyệt, thu hồi quyền Google Drive trong Tài khoản Google và quản lý dữ liệu lớp học theo quyền được cấp.</p>
            <p>Để xử lý yêu cầu an toàn, Mari có thể cần xác minh danh tính, quyền đại diện hoặc quyền quản lý lớp của người yêu cầu. Việc thực hiện một số yêu cầu có thể bị giới hạn khi cần duy trì dịch vụ, bảo vệ quyền lợi hợp pháp của các bên hoặc tuân thủ nghĩa vụ lưu giữ theo pháp luật.</p>
          </PolicySection>

          <PolicySection title="11. Thay đổi chính sách">
            <p>Mari có thể cập nhật Chính sách này khi có thay đổi về dịch vụ, cách xử lý dữ liệu hoặc yêu cầu pháp lý. Với thay đổi quan trọng, Mari sẽ công bố trên trang này và, khi phù hợp, thông báo qua email hoặc trong hệ thống trước ngày hiệu lực. Việc tiếp tục sử dụng dịch vụ sau ngày hiệu lực được hiểu là bạn đã đọc Chính sách cập nhật, trừ khi pháp luật có quy định khác.</p>
          </PolicySection>

          <PolicySection title="12. Liên hệ và khiếu nại">
            <p>Nếu có câu hỏi, yêu cầu về dữ liệu cá nhân hoặc khiếu nại, vui lòng liên hệ Mari qua <a className="font-medium text-orange-700 underline underline-offset-4 dark:text-orange-300" href={`mailto:${SITE_CONFIG.contact.email}`}>{SITE_CONFIG.contact.email}</a> hoặc hotline {SITE_CONFIG.contact.hotline}. Vui lòng nêu tài khoản liên quan, nội dung yêu cầu và thông tin cần thiết để Mari xác minh và hỗ trợ.</p>
            <p>Chính sách này được giải thích và áp dụng theo pháp luật Việt Nam.</p>
          </PolicySection>
        </div>
      </article>
    </main>
    <Footer />
  </div></PublicLightTheme>;
}

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return <section>
    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
    <div className="mt-4 space-y-4 text-[15px] leading-7">{children}</div>
  </section>;
}
