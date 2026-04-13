import { Router } from "express";
import { estimatePriceSchema } from "./pricing.schemas.js";
import { pricingService } from "./pricing.service.js";

export const pricingRouter = Router();

pricingRouter.post("/estimate", (req, res) => {
  const input = estimatePriceSchema.parse(req.body);
  const estimate = pricingService.estimate(input.routeKey, input.payload);

  res.json({
    ok: true,
    estimate,
  });
});
