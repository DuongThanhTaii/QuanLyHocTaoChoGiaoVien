'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { completeTeacherProductTour } from '@/app/(dashboard)/tour-actions';

type TourState = { eligibleAt?: string; completedAt?: string };
type UiSettings = { tours?: { teacher_setup_v1?: TourState } };

const STEPS = [
  { path: '/teacher', target: 'teacher-dashboard', title: 'Chào mừng đến với Mari', description: 'Đây là bảng điều khiển để bạn nắm nhanh lịch dạy và công việc trong ngày.' },
  { path: '/teacher/classes', target: 'teacher-create-class', title: 'Tạo và quản lý lớp học', description: 'Bắt đầu tại đây để tạo lớp mới, theo dõi danh sách lớp và học sinh của bạn.' },
  { path: '/teacher/classes/create', target: 'teacher-create-class-form', title: 'Thiết lập lớp đầu tiên', description: 'Điền tên lớp, môn học, học phí; bạn cũng có thể thêm học sinh và lịch học ngay trong biểu mẫu.' },
  { path: '/teacher/schedule', target: 'teacher-schedule', title: 'Sắp xếp thời khóa biểu', description: 'Xem lịch dạy tổng, quản lý các buổi cố định hoặc linh hoạt để luôn chủ động thời gian.' },
  { path: '/teacher/invoices', target: 'teacher-invoices', title: 'Tạo hóa đơn học phí', description: 'Lập và gửi hóa đơn, kèm VietQR để phụ huynh tiện thanh toán và đối soát.' },
  { path: '/teacher', target: 'teacher-support', title: 'Hỗ trợ luôn sẵn sàng', description: 'Mở Trung tâm hỗ trợ khi cần liên hệ Mari hoặc muốn xem lại hướng dẫn này.' },
] as const;

type Rect = { top: number; left: number; width: number; height: number };

export function TeacherProductTour({ userRole, uiSettings }: { userRole: string; uiSettings?: UiSettings | Record<string, unknown> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const tourState = (uiSettings as UiSettings | undefined)?.tours?.teacher_setup_v1;
  const isReplay = searchParams.get('tour') === 'teacher-setup';
  const requestedStep = Number(searchParams.get('step'));

  const updateRect = useCallback(() => {
    const target = Array.from(document.querySelectorAll(`[data-tour-id="${STEPS[stepIndex].target}"]`)).find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (!target) return setTargetRect(null);
    const rect = target.getBoundingClientRect();
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, [reduceMotion, stepIndex]);

  useEffect(() => {
    if (userRole !== 'teacher') return;
    if (isReplay) {
      setStepIndex(Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < STEPS.length ? requestedStep : 0);
      setActive(true);
      return;
    }
    if (tourState?.eligibleAt && !tourState.completedAt) setActive(true);
  }, [isReplay, requestedStep, tourState?.completedAt, tourState?.eligibleAt, userRole]);

  useEffect(() => {
    const startReplay = () => {
      setStepIndex(0);
      setActive(true);
      router.push('/teacher?tour=teacher-setup&step=0');
    };
    window.addEventListener('mari:start-teacher-tour', startReplay);
    return () => window.removeEventListener('mari:start-teacher-tour', startReplay);
  }, [router]);

  useEffect(() => {
    if (!active) return;
    dialogRef.current?.focus();
    const refresh = () => updateRect();
    const timer = window.setInterval(refresh, 200);
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);
    refresh();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
    };
  }, [active, pathname, stepIndex, updateRect]);

  const clearTourParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tour');
    params.delete('step');
    const suffix = params.toString();
    router.replace(`${pathname}${suffix ? `?${suffix}` : ''}`);
  }, [pathname, router, searchParams]);

  const finish = useCallback(async () => {
    setActive(false);
    clearTourParams();
    await completeTeacherProductTour();
  }, [clearTourParams]);

  const navigate = (nextIndex: number) => {
    if (nextIndex < 0) return;
    if (nextIndex >= STEPS.length) return void finish();
    setStepIndex(nextIndex);
    const next = STEPS[nextIndex];
    router.push(`${next.path}?tour=teacher-setup&step=${nextIndex}`);
  };

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') void finish();
      if (event.key === 'ArrowRight') navigate(stepIndex + 1);
      if (event.key === 'ArrowLeft') navigate(stepIndex - 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (userRole !== 'teacher') return null;
  const step = STEPS[stepIndex];
  const popoverStyle = targetRect && typeof window !== 'undefined' && window.innerWidth >= 640
    ? { top: Math.min(Math.max(targetRect.top + targetRect.height + 16, 16), window.innerHeight - 260), left: Math.min(Math.max(targetRect.left, 16), window.innerWidth - 380) }
    : undefined;

  return <AnimatePresence>
    {active && <>
      <motion.div className="fixed inset-0 z-30 bg-transparent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden="true" />
      {targetRect && <motion.div
        className="pointer-events-none fixed z-40 rounded-xl border-2 border-orange-300 bg-transparent shadow-[0_0_0_9999px_rgba(9,9,11,0.6)]"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ top: targetRect.top - 6, left: targetRect.left - 6, width: targetRect.width + 12, height: targetRect.height + 12, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
      />}
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-tour-title"
        className={`fixed z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-orange-100 bg-card p-5 text-card-foreground shadow-2xl outline-none sm:w-96 ${popoverStyle ? '' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}
        style={popoverStyle}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
      >
        <button type="button" onClick={() => void finish()} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Bỏ qua hướng dẫn"><X className="size-4" /></button>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-600"><Sparkles className="size-4" /> Hướng dẫn nhanh <span className="ml-auto mr-6 text-xs font-medium text-muted-foreground">{stepIndex + 1}/{STEPS.length}</span></div>
        <h2 id="teacher-tour-title" className="pr-6 text-lg font-bold tracking-tight">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
        {!targetRect && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Mari đang định vị khu vực hướng dẫn. Bạn vẫn có thể tiếp tục để xem bước tiếp theo.</p>}
        <div className="mt-5 flex items-center justify-between gap-2">
          {stepIndex > 0 ? <button type="button" onClick={() => navigate(stepIndex - 1)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"><ArrowLeft className="size-4" /> Quay lại</button> : <button type="button" onClick={() => void finish()} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Bỏ qua</button>}
          <button type="button" onClick={() => navigate(stepIndex + 1)} className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">{stepIndex === STEPS.length - 1 ? <>Hoàn tất <Check className="size-4" /></> : <>Tiếp theo <ArrowRight className="size-4" /></>}</button>
        </div>
      </motion.div>
    </>}
  </AnimatePresence>;
}
