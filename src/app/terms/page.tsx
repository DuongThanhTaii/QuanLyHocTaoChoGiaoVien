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
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-zinc-300">Quy định về việc sử dụng Mari để quản lý lớp học, học liệu, điểm danh, trao đổi, học phí và các gói dịch vụ trên nền tảng.</p>
          <p className="mt-6 text-sm text-slate-500 dark:text-zinc-400">Ngày hiệu lực và cập nhật lần cuối: {updatedAt}</p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <div className="border-l-4 border-orange-500 bg-orange-50 px-5 py-4 text-sm leading-6 text-slate-700 dark:bg-orange-950/30 dark:text-zinc-200">
          Bằng việc tạo tài khoản, đăng nhập hoặc tiếp tục sử dụng Mari, bạn xác nhận đã đọc, hiểu và đồng ý với Điều khoản này cùng <Link href="/privacy" className="font-medium text-orange-700 underline underline-offset-2 dark:text-orange-300">Chính sách bảo mật</Link>.
        </div>

        <div className="mt-12 space-y-12 leading-7 text-slate-700 dark:text-zinc-300">
          <TermsSection title="1. Phạm vi áp dụng">
            <p>Điều khoản này áp dụng cho website, ứng dụng, tài khoản, chức năng và nội dung do Mari cung cấp. Nếu bạn sử dụng Mari thay mặt cho trường học, trung tâm hoặc tổ chức khác, bạn xác nhận mình có thẩm quyền chấp thuận Điều khoản này cho tổ chức đó.</p>
            <p>Trong trường hợp có điều khoản riêng cho một gói dịch vụ, chương trình khuyến mại hoặc tích hợp bên thứ ba, điều khoản riêng sẽ được áp dụng cho phạm vi tương ứng và được ưu tiên khi có khác biệt.</p>
          </TermsSection>

          <TermsSection title="2. Giải thích thuật ngữ">
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Mari</strong> là nền tảng phần mềm hỗ trợ quản lý học tập và lớp học tại {SITE_CONFIG.url}.</li>
              <li><strong>Người dùng</strong> gồm giáo viên, học sinh, phụ huynh, nhân sự của tổ chức giáo dục và người được chủ tài khoản cho phép sử dụng Mari.</li>
              <li><strong>Nội dung người dùng</strong> là dữ liệu, học liệu, hình ảnh, tin nhắn, thông tin lớp, đánh giá, hóa đơn và dữ liệu khác do người dùng nhập, tạo hoặc tải lên.</li>
              <li><strong>Gói dịch vụ</strong> là quyền truy cập có thể kèm hạn mức và tính năng theo thông tin công bố tại thời điểm đăng ký/thanh toán.</li>
            </ul>
          </TermsSection>

          <TermsSection title="3. Vai trò của Mari và giao dịch giữa các bên">
            <p>Mari là công cụ phần mềm hỗ trợ vận hành lớp học. Mari không phải là cơ sở giáo dục, không tuyển sinh, không bảo đảm kết quả học tập và không là bên ký kết hợp đồng dạy học giữa giáo viên/đơn vị tổ chức với học sinh hoặc phụ huynh.</p>
            <p>Giáo viên hoặc đơn vị tổ chức tự chịu trách nhiệm về chất lượng giảng dạy, lịch học, điểm danh, nội dung học liệu, mức học phí, hóa đơn, nghĩa vụ thuế và mọi thỏa thuận trực tiếp với học sinh/phụ huynh. Mari không nhận giữ hộ học phí giữa các bên; việc chuyển khoản qua VietQR hoặc ngân hàng là giao dịch trực tiếp theo thông tin do người lập hóa đơn thiết lập.</p>
          </TermsSection>

          <TermsSection title="4. Tài khoản, độ tuổi và bảo mật">
            <ul className="list-disc space-y-2 pl-5">
              <li>Bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật. Không được mạo danh, dùng thông tin sai lệch hoặc xâm phạm tài khoản của người khác.</li>
              <li>Bạn có trách nhiệm bảo mật mật khẩu, thiết bị và mọi hoạt động phát sinh từ tài khoản. Khi nghi ngờ tài khoản bị truy cập trái phép, hãy đổi mật khẩu và liên hệ Mari ngay.</li>
              <li>Người chưa đủ tuổi tự giao kết theo quy định pháp luật chỉ sử dụng Mari với sự đồng ý và giám sát phù hợp của cha mẹ hoặc người giám hộ.</li>
              <li>Không được bán, cho thuê, chuyển nhượng hoặc chia sẻ thông tin đăng nhập trái phép. Chủ tài khoản tổ chức có trách nhiệm quản lý quyền của các thành viên được mời.</li>
            </ul>
          </TermsSection>

          <TermsSection title="5. Dữ liệu lớp học và trách nhiệm của người dùng">
            <p>Bạn chỉ được nhập, tải lên, chia sẻ hoặc công bố dữ liệu mà mình có quyền hợp pháp để sử dụng. Giáo viên/đơn vị tổ chức phải bảo đảm có căn cứ phù hợp để xử lý thông tin của học sinh, phụ huynh và người liên quan, bao gồm việc thông báo và xin đồng ý khi pháp luật yêu cầu.</p>
            <p>Hóa đơn, nhật ký điểm danh và báo cáo trên Mari là dữ liệu hỗ trợ quản lý/đối soát. Người lập chịu trách nhiệm kiểm tra tính chính xác trước khi gửi, in hoặc dùng cho mục đích kế toán, thuế hay giải quyết tranh chấp.</p>
          </TermsSection>

          <TermsSection title="6. Nội dung người dùng và học liệu">
            <p>Bạn giữ quyền đối với Nội dung người dùng của mình. Bạn cấp cho Mari quyền không độc quyền, giới hạn trong phạm vi cần thiết để lưu trữ, sao chép kỹ thuật, hiển thị và truyền tải nội dung nhằm cung cấp các chức năng mà bạn lựa chọn.</p>
            <p>Không được đăng hoặc tải lên nội dung vi phạm pháp luật, quyền sở hữu trí tuệ, quyền riêng tư, quyền trẻ em; nội dung lừa đảo, bạo lực, khiêu dâm, thù ghét, quấy rối, thư rác hoặc thông tin sai sự thật gây thiệt hại cho người khác. Mari có thể gỡ nội dung hoặc áp dụng biện pháp với tài khoản vi phạm.</p>
          </TermsSection>

          <TermsSection title="7. Gói dịch vụ, thanh toán, gia hạn và hoàn tiền">
            <p>Giá, chu kỳ, hạn mức, ưu đãi và điều kiện của từng Gói dịch vụ được hiển thị trước khi bạn xác nhận thanh toán. Gói được kích hoạt sau khi Mari hoặc đối tác thanh toán ghi nhận giao dịch thành công theo trạng thái hiển thị trên hệ thống.</p>
            <p>Bạn có thể ngừng gia hạn hoặc hủy Gói dịch vụ theo lựa chọn được Mari cung cấp. Quyền của gói đang hoạt động tiếp tục đến hết chu kỳ đã thanh toán, trừ khi Điều khoản, quy định pháp luật hoặc lý do bảo mật yêu cầu khác.</p>
            <p>Khoản phí đã thanh toán cho gói đã kích hoạt không được hoàn lại, trừ trường hợp pháp luật yêu cầu, Mari thông báo chính sách khác, hoặc lỗi thuộc hệ thống Mari khiến bạn không thể sử dụng dịch vụ trong thời gian đáng kể và Mari không khắc phục được trong thời hạn hợp lý. Yêu cầu hỗ trợ hoàn tiền cần được gửi kèm thông tin giao dịch để Mari xem xét.</p>
          </TermsSection>

          <TermsSection title="8. Dịch vụ bên thứ ba">
            <p>Mari có thể tích hợp Google Drive, ngân hàng, VietQR hoặc đối tác thanh toán. Việc sử dụng các dịch vụ đó có thể chịu điều khoản và chính sách riêng của bên thứ ba. Mari không lưu mật khẩu ngân hàng hoặc mật khẩu Google của bạn.</p>
            <p>Kết nối Google Drive chỉ được thực hiện khi bạn chủ động cấp quyền. Phạm vi quyền, cách Mari xử lý dữ liệu Drive và cách thu hồi quyền được mô tả tại <Link href="/privacy" className="font-medium text-orange-700 underline underline-offset-4 dark:text-orange-300">Chính sách bảo mật</Link>.</p>
          </TermsSection>

          <TermsSection title="9. Hành vi bị cấm">
            <ul className="list-disc space-y-2 pl-5">
              <li>Truy cập trái phép, dò quét, phá hoại, phát tán mã độc, can thiệp hệ thống hoặc khai thác dữ liệu của người dùng khác.</li>
              <li>Thu thập dữ liệu cá nhân trái phép, gửi thư rác, giả mạo, lừa đảo hoặc sử dụng Mari cho mục đích vi phạm pháp luật.</li>
              <li>Sao chép, sửa đổi, phân phối, bán lại, đảo ngược kỹ thuật hoặc khai thác mã nguồn/giao diện/dữ liệu Mari ngoài phạm vi được pháp luật và Mari cho phép.</li>
              <li>Vô hiệu hóa hoặc né tránh hạn mức, kiểm soát bảo mật, tính năng thanh toán hoặc các biện pháp bảo vệ của Mari.</li>
            </ul>
          </TermsSection>

          <TermsSection title="10. Sở hữu trí tuệ">
            <p>Thương hiệu, logo, giao diện, phần mềm, cơ sở dữ liệu, tài liệu và các tài sản thuộc Mari hoặc bên cấp phép được bảo hộ theo pháp luật. Ngoại trừ quyền sử dụng dịch vụ theo Điều khoản này, Mari không chuyển giao bất kỳ quyền sở hữu trí tuệ nào cho bạn.</p>
          </TermsSection>

          <TermsSection title="11. Tính sẵn sàng, bảo trì và hỗ trợ">
            <p>Mari nỗ lực duy trì dịch vụ ổn định, an toàn và cập nhật. Dịch vụ có thể bị gián đoạn tạm thời do bảo trì, sự cố kỹ thuật, hạ tầng của bên thứ ba hoặc sự kiện bất khả kháng. Khi hợp lý, Mari sẽ thông báo trước về bảo trì có kế hoạch.</p>
            <p>Để được hỗ trợ, hãy liên hệ theo thông tin tại Điều 14. Mari sẽ tiếp nhận và phản hồi trong thời hạn hợp lý tùy vào tính chất sự việc.</p>
          </TermsSection>

          <TermsSection title="12. Tạm ngừng, chấm dứt và xóa dữ liệu">
            <p>Bạn có thể ngừng sử dụng Mari bất kỳ lúc nào. Mari có thể giới hạn, tạm ngừng hoặc chấm dứt quyền truy cập khi có căn cứ hợp lý cho thấy có vi phạm Điều khoản, rủi ro bảo mật, yêu cầu của cơ quan có thẩm quyền hoặc nguy cơ gây hại cho người dùng/hệ thống.</p>
            <p>Sau khi tài khoản chấm dứt, dữ liệu được xử lý theo <Link href="/privacy" className="font-medium text-orange-700 underline underline-offset-4 dark:text-orange-300">Chính sách bảo mật</Link> và các nghĩa vụ lưu giữ theo pháp luật. Việc chấm dứt không loại trừ các nghĩa vụ hoặc trách nhiệm đã phát sinh trước thời điểm chấm dứt.</p>
          </TermsSection>

          <TermsSection title="13. Tuyên bố và giới hạn trách nhiệm">
            <p>Mari cung cấp dịch vụ trên cơ sở phù hợp với khả năng kỹ thuật thực tế và không cam kết dịch vụ luôn không gián đoạn hoặc không có lỗi. Mari sẽ áp dụng biện pháp hợp lý để khắc phục lỗi thuộc phạm vi kiểm soát của mình.</p>
            <p>Trong phạm vi pháp luật cho phép, Mari không chịu trách nhiệm cho chất lượng dạy học, nội dung do người dùng tạo, giao dịch/học phí giữa người dùng, hành vi của bên thứ ba hoặc thiệt hại gián tiếp. Quy định này không loại trừ các trách nhiệm mà pháp luật không cho phép loại trừ hoặc hạn chế.</p>
          </TermsSection>

          <TermsSection title="14. Khiếu nại, thay đổi điều khoản và luật áp dụng">
            <p>Mọi phản ánh hoặc khiếu nại về dịch vụ, vui lòng gửi tới <a className="font-medium text-orange-700 underline underline-offset-4 dark:text-orange-300" href={`mailto:${SITE_CONFIG.contact.email}`}>{SITE_CONFIG.contact.email}</a> hoặc hotline {SITE_CONFIG.contact.hotline}. Hãy cung cấp thông tin tài khoản, mô tả sự việc và tài liệu liên quan để Mari hỗ trợ hiệu quả.</p>
            <p>Mari có thể cập nhật Điều khoản khi cần thiết. Với thay đổi quan trọng, Mari sẽ công bố trên trang này và, khi phù hợp, thông báo qua kênh liên lạc trong hệ thống trước ngày hiệu lực. Việc tiếp tục sử dụng dịch vụ sau ngày hiệu lực thể hiện sự chấp thuận của bạn, trừ khi pháp luật có quy định khác.</p>
            <p>Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp được ưu tiên giải quyết bằng thương lượng; nếu không thành, mỗi bên có quyền yêu cầu cơ quan có thẩm quyền giải quyết theo pháp luật.</p>
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
