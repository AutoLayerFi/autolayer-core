import { env } from "../../config/env.js";

export interface PriceEstimate {
  amountAtomic: string;
  asset: string;
  network: string;
  breakdown: Record<string, unknown>;
}

class PricingService {
  estimate(routeKey: string, payload: Record<string, unknown>): PriceEstimate {
    const base = 1000000;
    const payloadSize = JSON.stringify(payload).length;

    let multiplier = 1;

    if (routeKey === "automation.execute") multiplier = 2;
    if (routeKey === "automation.deploy") multiplier = 5;
    if (routeKey === "automation.preview") multiplier = 1;

    const variable = Math.ceil(payloadSize / 200) * 50000;
    const amountAtomic = String(base * multiplier + variable);

    return {
      amountAtomic,
      asset: env.DEFAULT_ASSET,
      network: env.DEFAULT_NETWORK,
      breakdown: {
        baseAtomic: String(base),
        multiplier,
        payloadSize,
        variableAtomic: String(variable),
      },
    };
  }
}

export const pricingService = new PricingService();
