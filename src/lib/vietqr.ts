/**
 * Tiện ích tạo mã VietQR chuẩn NAPAS 247 và định danh Ngân hàng Việt Nam
 */

export interface BankInfo {
  code: string;
  name: string;
  shortName: string;
  bin: string;
}

export const POPULAR_VIETNAMESE_BANKS: BankInfo[] = [
  { code: 'vietcombank', name: 'Ngân hàng Ngoại thương VN (Vietcombank)', shortName: 'VCB', bin: '970436' },
  { code: 'mb', name: 'Ngân hàng Quân Đội (MBBank)', shortName: 'MB', bin: '970422' },
  { code: 'techcombank', name: 'Ngân hàng Kỹ Thương VN (Techcombank)', shortName: 'TCB', bin: '970407' },
  { code: 'vietinbank', name: 'Ngân hàng Công Thương VN (VietinBank)', shortName: 'CTG', bin: '970415' },
  { code: 'bidv', name: 'Ngân hàng Đầu tư và Phát triển VN (BIDV)', shortName: 'BIDV', bin: '970418' },
  { code: 'acb', name: 'Ngân hàng Á Châu (ACB)', shortName: 'ACB', bin: '970416' },
  { code: 'tpbank', name: 'Ngân hàng Tiên Phong (TPBank)', shortName: 'TPB', bin: '970423' },
  { code: 'vpbank', name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)', shortName: 'VPB', bin: '970432' },
  { code: 'agribank', name: 'Ngân hàng Nông nghiệp & PTNT (Agribank)', shortName: 'VBA', bin: '970405' },
  { code: 'vib', name: 'Ngân hàng Quốc tế (VIB)', shortName: 'VIB', bin: '970441' },
  { code: 'sacombank', name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)', shortName: 'STB', bin: '970403' },
  { code: 'hdbank', name: 'Ngân hàng Phát triển TP.HCM (HDBank)', shortName: 'HDB', bin: '970437' },
  { code: 'ocb', name: 'Ngân hàng Phương Đông (OCB)', shortName: 'OCB', bin: '970448' },
  { code: 'msb', name: 'Ngân hàng Hàng Hải (MSB)', shortName: 'MSB', bin: '970426' },
  { code: 'shb', name: 'Ngân hàng Sài Gòn - Hà Nội (SHB)', shortName: 'SHB', bin: '970443' },
  { code: 'seabank', name: 'Ngân hàng Đông Nam Á (SeABank)', shortName: 'SSB', bin: '970440' },
  { code: 'namabank', name: 'Ngân hàng Nam Á (NamABank)', shortName: 'NAB', bin: '970428' },
  { code: 'lpbank', name: 'Ngân hàng Bưu điện Liên Việt (LPBank)', shortName: 'LPB', bin: '970449' },
  { code: 'bacabank', name: 'Ngân hàng Bắc Á (BacABank)', shortName: 'BAB', bin: '970409' },
  { code: 'abbank', name: 'Ngân hàng An Bình (ABBANK)', shortName: 'ABB', bin: '970425' },
  { code: 'cake', name: 'Ngân hàng số CAKE by VPBank', shortName: 'CAKE', bin: '546034' },
  { code: 'timo', name: 'Ngân hàng số Timo by BVBank', shortName: 'TIMO', bin: '963388' },
];

export function normalizeBankCode(bankNameOrCode?: string | null): string {
  if (!bankNameOrCode) return 'vietcombank';
  const clean = bankNameOrCode.toLowerCase().replace(/[^a-z0-9]/g, '');

  const match = POPULAR_VIETNAMESE_BANKS.find(
    b => b.code === clean || 
         b.shortName.toLowerCase() === clean || 
         clean.includes(b.code) || 
         clean.includes(b.shortName.toLowerCase()) ||
         b.name.toLowerCase().includes(bankNameOrCode.toLowerCase())
  );

  return match ? match.code : clean || 'vietcombank';
}

export function generateVietQrUrl(params: {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  memo: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}): string {
  const bankCode = normalizeBankCode(params.bankName);
  const accountNo = params.accountNumber.trim();
  const template = params.template || 'compact2';
  const amount = Math.round(params.amount || 0);
  const memoEncoded = encodeURIComponent(params.memo.trim());
  const accountNameEncoded = encodeURIComponent(params.accountName.trim());

  return `https://img.vietqr.io/image/${bankCode}-${accountNo}-${template}.png?amount=${amount}&addInfo=${memoEncoded}&accountName=${accountNameEncoded}`;
}
