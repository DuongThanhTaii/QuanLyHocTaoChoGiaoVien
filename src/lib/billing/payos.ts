import crypto from 'crypto';

type PaymentLinkRequest = {
  orderCode: number;
  amount: number;
  description: string;
  cancelUrl: string;
  returnUrl: string;
  buyerName?: string;
  buyerEmail?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  expiredAt: number;
};

type PayOSResponse = {
  code: string;
  desc: string;
  data?: { paymentLinkId: string; checkoutUrl: string; status: string };
};

function requiredEnvironment(name: 'PAYOS_CLIENT_ID' | 'PAYOS_API_KEY' | 'PAYOS_CHECKSUM_KEY') {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu cấu hình ${name} trên máy chủ.`);
  return value;
}

function normalizeValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

export function signPayOSData(data: Record<string, unknown>) {
  const source = Object.keys(data)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${normalizeValue(data[key])}`)
    .join('&');
  return crypto.createHmac('sha256', requiredEnvironment('PAYOS_CHECKSUM_KEY')).update(source).digest('hex');
}

export function verifyPayOSWebhook(data: Record<string, unknown>, receivedSignature: string | undefined) {
  if (!receivedSignature) return false;
  const expected = signPayOSData(data);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(receivedSignature, 'hex');
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function createPayOSPaymentLink(payload: PaymentLinkRequest) {
  const requestSignature = signPayOSData({
    amount: payload.amount,
    cancelUrl: payload.cancelUrl,
    description: payload.description,
    orderCode: payload.orderCode,
    returnUrl: payload.returnUrl,
  });
  const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': requiredEnvironment('PAYOS_CLIENT_ID'),
      'x-api-key': requiredEnvironment('PAYOS_API_KEY'),
    },
    body: JSON.stringify({ ...payload, signature: requestSignature }),
  });
  const body = await response.json().catch(() => null) as PayOSResponse | null;
  if (!response.ok || body?.code !== '00' || !body.data?.checkoutUrl) {
    throw new Error(body?.desc || 'Không thể tạo liên kết thanh toán PayOS.');
  }
  return body.data;
}
