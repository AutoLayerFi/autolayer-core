import { env } from "../../config/env.js";
import { generatePaymentReference, generateSessionId } from "../../lib/ids.js";
import { sha256 } from "../../lib/hash.js";
import { addSeconds, isExpired, nowMs } from "../../lib/time.js";
import { sessionStore } from "../../store/session.store.js";
import type {
  PaymentRequiredResponse,
  SessionRecord,
} from "../../types/session.js";
import { pricingService } from "../pricing/pricing.service.js";
import { ConflictError, GoneError, NotFoundError } from "../../lib/errors.js";

class SessionsService {
  prepare(input: {
    payer?: string;
    routeKey: string;
    payload: Record<string, unknown>;
  }): SessionRecord {
    const estimate = pricingService.estimate(input.routeKey, input.payload);
    const createdAtMs = nowMs();
    const expiresAtMs = addSeconds(createdAtMs, env.SESSION_TTL_SECONDS);

    const session: SessionRecord = {
      id: generateSessionId(),
      payer: input.payer,
      routeKey: input.routeKey,
      payload: input.payload,
      requestHash: sha256({
        routeKey: input.routeKey,
        payload: input.payload,
      }),
      amountAtomic: estimate.amountAtomic,
      asset: estimate.asset,
      network: estimate.network,
      status: "payment_required",
      createdAtMs,
      expiresAtMs,
      paymentReference: generatePaymentReference(),
    };

    return sessionStore.create(session);
  }

  list(): SessionRecord[] {
    return sessionStore.list().map((session) => this.applyExpiry(session));
  }

  getOrThrow(sessionId: string): SessionRecord {
    const session = sessionStore.get(sessionId);

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    return this.applyExpiry(session);
  }

  private applyExpiry(session: SessionRecord): SessionRecord {
    if (
      ["payment_required", "payment_pending"].includes(session.status) &&
      isExpired(session.expiresAtMs)
    ) {
      const expired = sessionStore.update(session.id, {
        status: "expired",
      });

      if (!expired) {
        throw new NotFoundError("Session not found");
      }

      return expired;
    }

    return session;
  }

  toPaymentRequired(sessionId: string): PaymentRequiredResponse {
    const session = this.getOrThrow(sessionId);

    return {
      sessionId: session.id,
      status: "payment_required",
      payment: {
        amountAtomic: session.amountAtomic,
        asset: session.asset,
        network: session.network,
        reference: session.paymentReference,
      },
      expiresAt: new Date(session.expiresAtMs).toISOString(),
    };
  }

  markPaymentPending(sessionId: string): SessionRecord {
    const session = this.getOrThrow(sessionId);

    if (session.status === "expired") {
      throw new GoneError("Session expired");
    }

    if (session.status !== "payment_required") {
      return session;
    }

    const updated = sessionStore.update(sessionId, {
      status: "payment_pending",
    });

    if (!updated) {
      throw new NotFoundError("Session not found");
    }

    return updated;
  }

  markPaymentVerified(sessionId: string, txHash: string): SessionRecord {
    const session = this.getOrThrow(sessionId);

    if (session.status === "expired") {
      throw new GoneError("Session expired");
    }

    const updated = sessionStore.update(sessionId, {
      status: "payment_verified",
      paymentTxHash: txHash,
      paymentVerifiedAtMs: nowMs(),
    });

    if (!updated) {
      throw new NotFoundError("Session not found");
    }

    return updated;
  }

  markExecuting(sessionId: string): SessionRecord {
    const session = this.getOrThrow(sessionId);

    if (session.status !== "payment_verified") {
      throw new ConflictError("Session payment is not verified");
    }

    const updated = sessionStore.update(sessionId, {
      status: "executing",
      executionStartedAtMs: nowMs(),
    });

    if (!updated) {
      throw new NotFoundError("Session not found");
    }

    return updated;
  }

  markCompleted(sessionId: string, result: unknown): SessionRecord {
    const session = this.getOrThrow(sessionId);

    if (session.status !== "executing") {
      throw new Error("Session is not executing");
    }

    const updated = sessionStore.update(sessionId, {
      status: "completed",
      completedAtMs: nowMs(),
      result,
    });

    if (!updated) {
      throw new NotFoundError("Session not found");
    }

    return updated;
  }

  markFailed(sessionId: string, reason: string): SessionRecord {
    const updated = sessionStore.update(sessionId, {
      status: "failed",
      failureReason: reason,
    });

    if (!updated) {
      throw new NotFoundError("Session not found");
    }

    return updated;
  }

  cancel(sessionId: string): SessionRecord {
    const session = this.getOrThrow(sessionId);

    if (!["payment_required", "payment_pending"].includes(session.status)) {
      throw new Error("Session cannot be cancelled");
    }

    const updated = sessionStore.update(sessionId, {
      status: "cancelled",
    });

    if (!updated) {
      throw new NotFoundError("Session not found");
    }

    return updated;
  }

  expire(sessionId: string): SessionRecord {
    const session = this.getOrThrow(sessionId);

    if (["completed", "cancelled", "failed"].includes(session.status)) {
      return session;
    }

    const updated = sessionStore.update(sessionId, {
      status: "expired",
    });

    if (!updated) {
      throw new NotFoundError("Session not found");
    }

    return updated;
  }
}

export const sessionsService = new SessionsService();
