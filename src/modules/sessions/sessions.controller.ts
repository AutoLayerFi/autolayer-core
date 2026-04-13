import type { Request, Response } from "express";
import { toIso } from "../../lib/time.js";
import {
  completeSessionSchema,
  failSessionSchema,
  prepareSessionSchema,
  verifyPaymentSchema,
} from "./sessions.schemas.js";
import { sessionsService } from "./sessions.service.js";

export class SessionsController {
  list(_req: Request, res: Response): void {
    const sessions = sessionsService.list();

    res.json({
      ok: true,
      sessions: sessions.map((session) => ({
        sessionId: session.id,
        status: session.status,
        routeKey: session.routeKey,
        amountAtomic: session.amountAtomic,
        asset: session.asset,
        network: session.network,
        createdAt: toIso(session.createdAtMs),
        expiresAt: toIso(session.expiresAtMs),
      })),
    });
  }

  prepare(req: Request, res: Response): void {
    const input = prepareSessionSchema.parse(req.body);
    const session = sessionsService.prepare(input);

    /*
      TODO:
      contract hook area:
      - init session on Soroban
      - write quoted amount
      - write request hash
      - write expiry
      - set payment status false
    */

    res.status(201).json({
      ok: true,
      sessionId: session.id,
      status: session.status,
      routeKey: session.routeKey,
      requestHash: session.requestHash,
      payment: {
        amountAtomic: session.amountAtomic,
        asset: session.asset,
        network: session.network,
        reference: session.paymentReference,
      },
      expiresAt: toIso(session.expiresAtMs),
    });
  }

  getById(req: Request, res: Response): void {
    const sessionId = String(req.params.sessionId);
    const session = sessionsService.getOrThrow(sessionId);

    res.json({
      ok: true,
      session: {
        sessionId: session.id,
        payer: session.payer ?? null,
        routeKey: session.routeKey,
        requestHash: session.requestHash,
        status: session.status,
        amountAtomic: session.amountAtomic,
        asset: session.asset,
        network: session.network,
        paymentReference: session.paymentReference,
        paymentTxHash: session.paymentTxHash ?? null,
        result: session.result ?? null,
        failureReason: session.failureReason ?? null,
        createdAt: toIso(session.createdAtMs),
        expiresAt: toIso(session.expiresAtMs),
        paymentVerifiedAt: session.paymentVerifiedAtMs
          ? toIso(session.paymentVerifiedAtMs)
          : null,
        executionStartedAt: session.executionStartedAtMs
          ? toIso(session.executionStartedAtMs)
          : null,
        completedAt: session.completedAtMs
          ? toIso(session.completedAtMs)
          : null,
      },
    });
  }

  paymentRequired(req: Request, res: Response): void {
    const sessionId = String(req.params.sessionId);
    const response = sessionsService.toPaymentRequired(sessionId);

    res.status(402).json({
      ok: false,
      ...response,
      message: "Payment required",
    });
  }

  paymentPending(req: Request, res: Response): void {
    const sessionId = String(req.params.sessionId);
    const session = sessionsService.markPaymentPending(sessionId);

    /*
      TODO:
      contract hook area:
      - optional mark pending in contract
      - optional attach submitted payer intent
    */

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
    });
  }

  verifyPayment(req: Request, res: Response): void {
    const input = verifyPaymentSchema.parse(req.body);

    /*
      TODO:
      contract hook area:
      - verify on-chain payment for session/paymentReference/amount
      - verify txHash really paid this session
      - verify not already settled
    */
    const sessionId = String(req.params.sessionId);
    const session = sessionsService.markPaymentVerified(
      sessionId,
      input.txHash
    );

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
      paymentTxHash: session.paymentTxHash,
    });
  }

  execute(req: Request, res: Response): void {
    const sessionId = String(req.params.sessionId);
    const session = sessionsService.getOrThrow(sessionId);

    if (
      session.status === "payment_required" ||
      session.status === "payment_pending"
    ) {
      res.status(402).json({
        ok: false,
        status: "payment_required",
        payment: {
          amountAtomic: session.amountAtomic,
          asset: session.asset,
          network: session.network,
          reference: session.paymentReference,
        },
        message: "Payment required",
      });
      return;
    }

    const executing = sessionsService.markExecuting(session.id);

    res.json({
      ok: true,
      sessionId: executing.id,
      status: executing.status,
    });
  }
  complete(req: Request, res: Response): void {
    const input = completeSessionSchema.parse(req.body);
    const sessionId = String(req.params.sessionId);
    const session = sessionsService.markCompleted(sessionId, input.result);

    /*
      TODO:
      contract hook area:
      - mark session completed on-chain
      - write result hash if needed
    */

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
      result: session.result,
    });
  }

  fail(req: Request, res: Response): void {
    const input = failSessionSchema.parse(req.body);
    const sessionId = String(req.params.sessionId);
    const session = sessionsService.markFailed(sessionId, input.reason);

    /*
      TODO:
      contract hook area:
      - mark session failed on-chain
      - store error code or reason hash if needed
    */

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
      failureReason: session.failureReason,
    });
  }

  cancel(req: Request, res: Response): void {
    const sessionId = String(req.params.sessionId);
    const session = sessionsService.cancel(sessionId);

    /*
      TODO:
      contract hook area:
      - cancel unpaid session on-chain
    */

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
    });
  }

  expire(req: Request, res: Response): void {
    const sessionId = String(req.params.sessionId);
    const session = sessionsService.expire(sessionId);

    /*
      TODO:
      contract hook area:
      - expire session on-chain
    */

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
    });
  }
}

export const sessionsController = new SessionsController();
