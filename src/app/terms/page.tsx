import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { SITE_CONFIG } from '@/config/landing-data';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng | Mari',
  description: 'Điều khoản sử dụng nền tảng quản lý học tập và lớp học Mari.',
  alternates: { canonical: '/terms' },
};

const updatedAt = '04/09/2026';

export default function TermsPage() {
  return <div className="min-h-screen bg-[#fffdf9] text-slate-900 dark:bg-zinc-950 dark:text-zinc-50">
    <Navbar />
    <main className="pt-16">
      <section className="border-b border-orange-100 bg-[radial-gradient(circle_at_top_right,#ffe4b8,transparent_34%),linear-gradient(135deg,#fffaf2,#fffdf9)] px-5 py-16 dark:border-zinc-800 dark:bg-zinc-950 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 transition hover:text-orange-800 dark:text-orange-300"><ArrowLeft className="size-4" />Về trang chủ</Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Mari · mari.io.vn</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Điều khoản sử dụng</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-zinc-300">Các điều khoản này quy định cách bạn sử dụng Mari để quản lý lớp học, học liệu, điểm danh, trao đổi và học phí.</p>
          <p className="mt-6 text-sm text-slate-500 dark:text-zinc-400">Cập nhật lần cuối: {updatedAt}</p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <div className="border-l-4 border-orange-500 bg-orange-50 px-5 py-4 text-sm leading-6 text-slate-700 dark:bg-orange-950/30 dark:text-zinc-200">
          Bằng việc tạo tài khoản, truy cập hoặc sử dụng Mari, bạn xác nhận đã đọc, hiểu và đồng ý với Điều khoản sử dụng này cùng <Link href="/privacy" className="font-medium text-orange-700 underline underline-offset-2 dark:text-orange-300">Chính sách bảo mật</Link>.
        </div>

        <div className="mt-12 space-y-12 leading-7 text-slate-700 dark:text-zinc-300">
          <TermsSection title="1. Phạm vi áp dụng và chấp thuận">
            <p>Mari là nền tảng số hỗ trợ giáo viên, học sinh, phụ huynh và tổ chức giáo dục quản lý hoạt động lớp học. Các điều khoản này áp dụng cho website, ứng dụng, tính năng và nội dung do Mari cung cấp.</p>
            <p>Nếu bạn sử dụng Mari thay mặt cho trường học, trung tâm hoặc tổ chức khác, bạn cam kết có thẩm quyền đại diện và ràng buộc tổ chức đó với các điều khoản này.</p>
          </TermsSection>

          <TermsSection title="2. Tài khoản và bảo mật">
            <ul className="list-disc space-y-2 pl-5">
              <li>Bạn cung cấp thông tin đăng ký chính xác, đầy đủ và cập nhật khi có thay đổi.</li>
              <li>Bạn tự chịu trách nhiệm bảo mật mật khẩu, thiết bị và mọi hoạt động phát sinh từ tài khoản của mình; hãy thông báo ngay cho Mari khi nghi ngờ có truy cập trái phép.</li>
              <li>Không được chuyển nhượng, cho thuê, bán hoặc dùng chung tài khoản trái với mục đích được Mari cho phép.</li>
              <li>Người dùng chưa đủ tuổi tự giao kết theo quy định pháp luật cần sử dụng Mari với sự đồng ý và giám sát phù hợp của cha mẹ hoặc người giám hộ.</li>
            </ul>
          </TermsSection>

          <TermsSection title="3. Vai trò và trách nhiệm của người dùng">
            <p>Giáo viên hoặc đơn vị tổ chức lớp chịu trách nhiệm về nội dung giảng dạy, lịch học, điểm danh, thông tin lớp, mức học phí, hóa đơn, thông báo và việc giải quyết các thỏa thuận trực tiếp với học sinh/phụ huynh.</p>
            <p>Người dùng chỉ nhập, tải lên hoặc chia sẻ dữ liệu mà mình có quyền hợp pháp để sử dụng. Giáo viên/đơn vị tổ chức phải có cơ sở pháp lý phù hợp để xử lý thông tin của học sinh, phụ huynh và người liên quan, bao gồm việc thông báo và xin sự đồng ý khi pháp luật yêu cầu.</p>
            <p>Mari cung cấp công cụ quản lý; Mari không phải là cơ sở giáo dục, không bảo đảm kết quả học tập và không là bên cung ứng dịch vụ dạy học giữa giáo viên với học sinh/phụ huynh.</p>
          </TermsSection>

          <TermsSection title="4. Học phí, hóa đơn và thanh toán">
            <p>Giáo viên/đơn vị tổ chức tự thiết lập học phí, kỳ tính phí, các khoản giảm trừ/phụ thu và thông tin nhận tiền. Hóa đơn hiển thị trên Mari là bản ghi hỗ trợ đối soát giữa các bên; người lập hóa đơn chịu trách nhiệm về tính chính xác, căn cứ thu và nghĩa vụ thuế liên quan.</p>
            <p>Khi Mari cung cấp gói dịch vụ trả phí, giá, chu kỳ và điều kiện áp dụng sẽ được hiển thị trước khi bạn xác nhận thanh toán. Giá mới chỉ áp dụng theo thông tin được công bố tại thời điểm giao dịch; các quyền/gói đã thanh toán được áp dụng theo bản ghi giao dịch tương ứng, trừ khi pháp luật yêu cầu khác.</p>
            <p>Thanh toán qua ngân hàng, VietQR hoặc đối tác thanh toán có thể chịu điều khoản riêng của ngân hàng/đối tác đó. Mari không lưu thông tin đăng nhập ngân hàng của bạn.</p>
          </TermsSection>

          <TermsSection title="5. Nội dung, học liệu và quyền sở hữu trí tuệ">
            <p>Bạn giữ quyền đối với nội dung mình tạo hoặc tải lên, đồng thời cấp cho Mari quyền cần thiết, không độc quyền và giới hạn trong việc lưu trữ, sao chép kỹ thuật, hiển thị và truyền tải nội dung để vận hành dịch vụ theo lựa chọn của bạn.</p>
            <p>Bạn cam kết học liệu, hình ảnh, tài liệu và nội dung khác không vi phạm quyền sở hữu trí tuệ, quyền riêng tư hoặc quyền hợp pháp của bất kỳ bên nào. Thương hiệu, giao diện, mã nguồn và tài sản của Mari thuộc Mari hoặc bên cấp phép, trừ khi có thỏa thuận khác bằng văn bản.</p>
          </TermsSection>

          <TermsSection title="6. Hành vi không được phép">
            <ul className="list-disc space-y-2 pl-5">
              <li>Vi phạm pháp luật; giả mạo danh tính; lừa đảo; quấy rối; phát tán nội dung xâm hại trẻ em, bạo lực, thù ghét hoặc trái pháp luật.</li>
              <li>Truy cập trái phép, dò quét, phá hoại, can thiệp hệ thống; phát tán mã độc; khai thác dữ liệu người dùng khác khi chưa được phép.</li>
              <li>Sử dụng Mari để gửi thư rác, quảng cáo không được yêu cầu hoặc thu thập dữ liệu cá nhân trái phép.</li>
              <li>Sao chép, sửa đổi, phân phối hoặc khai thác dịch vụ Mari ngoài phạm vi pháp luật và điều khoản này cho phép.</li>
            </ul>
          </TermsSection>

          <TermsSection title="7. Dữ liệu cá nhân và quyền riêng tư">
            <p>Việc Mari thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân được mô tả trong <Link href="/privacy" className="font-medium text-orange-700 underline underline-offset-4 dark:text-orange-300">Chính sách bảo mật</Link>. Khi dùng tính năng kết nối Google Drive, quyền truy cập và cách dùng dữ liệu Drive được áp dụng theo chính sách đó và sự cho phép chủ động của bạn.</p>
          </TermsSection>

          <TermsSection title="8. Tạm ngừng hoặc chấm dứt dịch vụ">
            <p>Mari có thể giới hạn, tạm ngừng hoặc chấm dứt quyền truy cập khi có căn cứ hợp lý cho thấy bạn vi phạm điều khoản, gây rủi ro bảo mật, theo yêu cầu của cơ quan có thẩm quyền hoặc để bảo vệ người dùng và hệ thống. Khi phù hợp, Mari sẽ thông báo cho bạn về biện pháp áp dụng.</p>
            <p>Bạn có thể ngừng sử dụng dịch vụ bất kỳ lúc nào. Việc xóa tài khoản/dữ liệu có thể chịu thời gian lưu giữ cần thiết cho bảo mật, giải quyết tranh chấp và nghĩa vụ pháp lý.</p>
          </TermsSection>

          <TermsSection title="9. Tuyên bố và giới hạn trách nhiệm">
            <p>Mari nỗ lực duy trì dịch vụ an toàn, ổn định và chính xác, nhưng dịch vụ được cung cấp trên cơ sở phù hợp với khả năng thực tế. Mari không cam kết dịch vụ luôn không gián đoạn hoặc không có lỗi; tuy nhiên, Mari sẽ có biện pháp hợp lý để khắc phục sự cố.</p>
            <p>Trong phạm vi pháp luật cho phép, Mari không chịu trách nhiệm cho thiệt hại phát sinh từ nội dung, thỏa thuận, học phí hoặc hành vi giữa giáo viên, học sinh, phụ huynh và bên thứ ba. Quy định này không loại trừ các trách nhiệm mà pháp luật không cho phép loại trừ.</p>
          </TermsSection>

          <TermsSection title="10. Khiếu nại, thay đổi điều khoản và luật áp dụng">
            <p>Mọi phản ánh hoặc khiếu nại về dịch vụ, vui lòng liên hệ Mari tại <a className="font-medium text-orange-700 underline underline-offset-4 dark:text-orange-300" href={`mailto:${SITE_CONFIG.contact.email}`}>{SITE_CONFIG.contact.email}</a> hoặc hotline {SITE_CONFIG.contact.hotline}. Mari sẽ tiếp nhận và phản hồi trong thời hạn hợp lý.</p>
            <p>Mari có thể cập nhật Điều khoản khi cần thiết. Với thay đổi quan trọng, Mari sẽ công bố trên trang này và cập nhật ngày hiệu lực. Việc tiếp tục sử dụng dịch vụ sau ngày hiệu lực thể hiện sự chấp thuận của bạn, trừ khi pháp luật quy định khác.</p>
            <p>Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp trước hết được ưu tiên giải quyết bằng thương lượng thiện chí; nếu không thành, các bên có quyền yêu cầu cơ quan có thẩm quyền giải quyết theo quy định pháp luật.</p>
          </TermsSection>
        </div>
      </article>
    </main>
    <Footer />
  </div>;
}

function TermsSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2><div className="mt-4 space-y-4 text-[15px] leading-7">{children}</div></section>;
}
