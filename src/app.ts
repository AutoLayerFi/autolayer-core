import express from "express";
import { healthRouter } from "./modules/health/health.routes.js";
import { pricingRouter } from "./modules/pricing/pricing.routes.js";
import { sessionsRouter } from "./modules/sessions/sessions.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/v1/pricing", pricingRouter);
  app.use("/v1/sessions", sessionsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
