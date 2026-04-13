import crypto from "node:crypto";

export function generateSessionId(): string {
  return `sess_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function generatePaymentReference(): string {
  return `pay_${crypto.randomUUID().replace(/-/g, "")}`;
}
