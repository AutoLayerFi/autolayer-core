import type { Request, Response } from "express";
import { toIso } from "../../lib/time.js";
import {
  completeSessionSchema,
  failSessionSchema,
  prepareSessionSchema,
  verifyPaymentSchema,
} from "./sessions.schemas.js";
import { sessionsService } from "./sessions.service.js";
import { getAgenda } from "../../agenda/agenda.js";
import { BadRequestError, ConflictError } from "../../lib/errors.js";
import { scheduleOneTimeJob } from "../../agenda/schedulers/schedule-once.js";
import { scheduleRecurringJob } from "../../agenda/schedulers/schedule-recurring.js";

type SessionParams = {
  sessionId: string;
};

export class SessionsController {
  async list(_req: Request, res: Response): Promise<void> {
    const sessions = await sessionsService.list();

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

  async prepare(req: Request, res: Response): Promise<void> {
    const input = prepareSessionSchema.parse(req.body);
    const session = await sessionsService.prepare(input);

    const agenda = getAgenda();
    await agenda.schedule(new Date(session.expiresAtMs), "session:expire", {
      sessionId: session.id,
    });

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

  async getById(req: Request<SessionParams>, res: Response): Promise<void> {
    const session = await sessionsService.getOrThrow(req.params.sessionId);

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

  async execute(req: Request<SessionParams>, res: Response): Promise<void> {
    const session = await sessionsService.getOrThrow(req.params.sessionId);

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

    if (session.status === "payment_verified") {
      res.status(202).json({
        ok: true,
        sessionId: session.id,
        status: "ready_to_queue",
        message:
          "Payment verified. Queueing happens when verification is confirmed.",
      });
      return;
    }

    if (session.status === "executing" || session.status === "completed") {
      res.json({
        ok: true,
        sessionId: session.id,
        status: session.status,
      });
      return;
    }

    throw new BadRequestError(
      `Session cannot execute from status ${session.status}`
    );
  }

  async paymentPending(
    req: Request<SessionParams>,
    res: Response
  ): Promise<void> {
    const session = await sessionsService.markPaymentPending(
      req.params.sessionId
    );

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
    });
  }

  async verifyPayment(
    req: Request<SessionParams>,
    res: Response
  ): Promise<void> {
    const input = verifyPaymentSchema.parse(req.body);
    const session = await sessionsService.markPaymentVerified(
      req.params.sessionId,
      input.txHash
    );

    const agenda = getAgenda();

    await agenda.cancel({
      name: "session:expire",
      data: { sessionId: session.id },
    });

    const payload = session.payload as {
      jobType: "one_time" | "recurring";
      jobName: string;
      jobData: {
        description?: string;
        callType: "contract_invoke" | "stellar_ops" | "upkeep";
        params: Record<string, unknown>;
      };
      scheduleConfig?: {
        runAt?: string;
        startsAt?: string;
        interval?: string;
        maxRuns?: number;
      };
    };

    let scheduledJobId: string | null = null;

    if (payload.jobType === "one_time") {
      const job = await scheduleOneTimeJob(agenda, {
        when: payload.scheduleConfig?.runAt
          ? new Date(payload.scheduleConfig.runAt)
          : new Date(),
        jobId: session.id,
        type: payload.jobName,
        payload: {
          sessionId: session.id,
          description: payload.jobData.description ?? null,
          callType: payload.jobData.callType,
          ...payload.jobData.params,
        },
        removeOnComplete: true,
      });

      scheduledJobId = String(job.attrs._id);
    } else if (payload.jobType === "recurring") {
      const job = await scheduleRecurringJob(agenda, {
        jobId: session.id,
        type: payload.jobName,
        interval: payload.scheduleConfig?.interval ?? "1 minute",
        startsAt: payload.scheduleConfig?.startsAt
          ? new Date(payload.scheduleConfig.startsAt)
          : new Date(),
        maxRuns: payload.scheduleConfig?.maxRuns ?? 1,
        payload: {
          sessionId: session.id,
          description: payload.jobData.description ?? null,
          callType: payload.jobData.callType,
          ...payload.jobData.params,
        },
        removeOnComplete: true,
      });

      scheduledJobId = String(job.attrs._id);
    } else {
      throw new ConflictError("Unsupported job type");
    }

    res.status(202).json({
      ok: true,
      sessionId: session.id,
      status: "queued",
      paymentTxHash: session.paymentTxHash,
      agendaJobId: scheduledJobId,
      message: "Payment verified and job queued",
    });
  }

  async complete(req: Request<SessionParams>, res: Response): Promise<void> {
    const input = completeSessionSchema.parse(req.body);
    const session = await sessionsService.markCompleted(
      req.params.sessionId,
      input.result
    );

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
      result: session.result,
    });
  }

  async fail(req: Request<SessionParams>, res: Response): Promise<void> {
    const input = failSessionSchema.parse(req.body);
    const session = await sessionsService.markFailed(
      req.params.sessionId,
      input.reason
    );

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
      failureReason: session.failureReason,
    });
  }

  async cancel(req: Request<SessionParams>, res: Response): Promise<void> {
    const session = await sessionsService.cancel(req.params.sessionId);

    const agenda = getAgenda();
    await agenda.cancel({
      name: "session:expire",
      data: { sessionId: session.id },
    });

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
    });
  }

  async expire(req: Request<SessionParams>, res: Response): Promise<void> {
    const session = await sessionsService.expire(req.params.sessionId);

    res.json({
      ok: true,
      sessionId: session.id,
      status: session.status,
    });
  }
}

export const sessionsController = new SessionsController();
