'use client';

import { QRCodeSVG } from 'qrcode.react';

export function QRCodeDisplay({ value }: { value: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-zinc-200 inline-block">
      <QRCodeSVG 
        value={value}
        size={200}
        bgColor={"#ffffff"}
        fgColor={"#18181b"}
        level={"L"}
        includeMargin={false}
      />
    </div>
  );
}
