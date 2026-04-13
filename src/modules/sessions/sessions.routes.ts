import { Router } from "express";
import { sessionsController } from "./sessions.controller.js";

export const sessionsRouter = Router();

// list and prepare
sessionsRouter.get("/", (req, res) => sessionsController.list(req, res));
sessionsRouter.post("/prepare", (req, res) =>
  sessionsController.prepare(req, res)
);

// single session
sessionsRouter.get("/:sessionId", (req, res) =>
  sessionsController.getById(req, res)
);

// payment flow
sessionsRouter.post("/:sessionId/payment-required", (req, res) =>
  sessionsController.paymentRequired(req, res)
);

sessionsRouter.post("/:sessionId/payment-pending", (req, res) =>
  sessionsController.paymentPending(req, res)
);

sessionsRouter.post("/:sessionId/verify-payment", (req, res) =>
  sessionsController.verifyPayment(req, res)
);

// execution flow
sessionsRouter.post("/:sessionId/execute", (req, res) =>
  sessionsController.execute(req, res)
);

sessionsRouter.post("/:sessionId/complete", (req, res) =>
  sessionsController.complete(req, res)
);

sessionsRouter.post("/:sessionId/fail", (req, res) =>
  sessionsController.fail(req, res)
);

// lifecycle
sessionsRouter.post("/:sessionId/cancel", (req, res) =>
  sessionsController.cancel(req, res)
);

sessionsRouter.post("/:sessionId/expire", (req, res) =>
  sessionsController.expire(req, res)
);
