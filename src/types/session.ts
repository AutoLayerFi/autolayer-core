export type SessionStatus =
  | "payment_required"
  | "payment_pending"
  | "payment_verified"
  | "executing"
  | "completed"
  | "cancelled"
  | "expired"
  | "failed";

export interface SessionRecord {
  id: string;
  payer?: string;
  routeKey: string;
  payload: Record<string, unknown>;
  requestHash: string;
  amountAtomic: string;
  asset: string;
  network: string;
  status: SessionStatus;
  createdAtMs: number;
  expiresAtMs: number;
  paymentReference: string;
  paymentTxHash?: string;
  paymentVerifiedAtMs?: number;
  executionStartedAtMs?: number;
  completedAtMs?: number;
  result?: unknown;
  failureReason?: string;
}

export interface PaymentRequiredResponse {
  sessionId: string;
  status: "payment_required";
  payment: {
    amountAtomic: string;
    asset: string;
    network: string;
    reference: string;
  };
  expiresAt: string;
}
