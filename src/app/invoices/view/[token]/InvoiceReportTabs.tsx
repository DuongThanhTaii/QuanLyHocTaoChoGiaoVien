'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function InvoiceReportTabs({ invoice, report }: { invoice: ReactNode; report: ReactNode }) {
  const [tab, setTab] = useState<'invoice' | 'report'>('invoice');
  const print = (section: 'invoice' | 'report' | 'both') => {
    document.body.dataset.printSection = section;
    window.print();
    window.setTimeout(() => { delete document.body.dataset.printSection; }, 250);
  };
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('print');
    if (requested === 'report' || requested === 'both') {
      setTab(requested === 'report' ? 'report' : 'invoice');
      window.setTimeout(() => print(requested), 350);
    }
  }, []);
  return <>
    <style jsx global>{`
      @media print {
        body[data-print-section="invoice"] .report-section, body[data-print-section="report"] .invoice-section { display: none !important; }
        body[data-print-section="both"] .invoice-section, body[data-print-section="both"] .report-section { break-after: page; }
        .public-tabs, .print-actions { display: none !important; }
        body { background: white !important; }
      }
    `}</style>
    <div className="public-tabs sticky top-0 z-10 flex items-center gap-1 rounded-xl bg-white/95 p-1 shadow-sm backdrop-blur print:hidden">
      <button className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold ${tab === 'invoice' ? 'bg-orange-500 text-white' : 'text-zinc-600'}`} onClick={() => setTab('invoice')}>Hóa đơn</button>
      <button className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold ${tab === 'report' ? 'bg-orange-500 text-white' : 'text-zinc-600'}`} onClick={() => setTab('report')}>Báo cáo học tập</button>
    </div>
    <div className="print-actions flex flex-wrap justify-end gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => print('invoice')}><Printer className="mr-1.5 h-4 w-4" />In hóa đơn</Button>
      <Button variant="outline" size="sm" onClick={() => print('report')}><Printer className="mr-1.5 h-4 w-4" />In báo cáo</Button>
      <Button size="sm" onClick={() => print('both')}><Printer className="mr-1.5 h-4 w-4" />In cả hai</Button>
    </div>
    <section className={`invoice-section ${tab === 'invoice' ? 'block' : 'hidden'} print:block`}>{invoice}</section>
    <section className={`report-section ${tab === 'report' ? 'block' : 'hidden'} print:block`}>{report}</section>
  </>;
}
