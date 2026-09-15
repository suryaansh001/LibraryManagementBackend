import qrcode from 'qrcode';
import crypto from 'crypto';

export function generateQrToken() {
  return crypto.randomUUID();
}

export async function generateQrImage(token) {
  const data = JSON.stringify({ token, ts: Date.now() });
  return await qrcode.toDataURL(data);
}

export async function generateQrPng(token) {
  const data = JSON.stringify({ token, ts: Date.now() });
  return await qrcode.toBuffer(data, { type: 'png' });
}
