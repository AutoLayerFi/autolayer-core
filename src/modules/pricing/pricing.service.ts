import { env } from "../../config/env.js";

export interface PriceEstimate {
  amountAtomic: string;
  asset: string;
  network: string;
  breakdown: Record<string, unknown>;
}

class PricingService {
  estimate(routeKey: string, payload: Record<string, unknown>): PriceEstimate {
    const typedPayload = payload as {
      jobType?: "one_time" | "recurring";
      jobData?: {
        callType?: "contract_invoke" | "stellar_ops" | "upkeep";
        params?: Record<string, unknown>;
        description?: string;
      };
      scheduleConfig?: {
        maxRuns?: number;
      };
    };

    const base = 1_000000;
    const paramsSize = JSON.stringify(
      typedPayload.jobData?.params ?? {}
    ).length;
    const payloadUnits = Math.ceil(paramsSize / 200) * 50000;

    let routeMultiplier = 1;
    if (routeKey === "automation.execute") routeMultiplier = 2;
    if (routeKey === "automation.deploy") routeMultiplier = 5;

    let callTypeFee = 0;
    switch (typedPayload.jobData?.callType) {
      case "contract_invoke":
        callTypeFee = 250000;
        break;
      case "stellar_ops":
        callTypeFee = 200000;
        break;
      case "upkeep":
        callTypeFee = 150000;
        break;
      default:
        callTypeFee = 100000;
    }

    let schedulingFee = 0;
    if (typedPayload.jobType === "recurring") {
      const maxRuns =
        typeof typedPayload.scheduleConfig?.maxRuns === "number"
          ? typedPayload.scheduleConfig.maxRuns
          : 1;

      schedulingFee = 300000 + Math.min(maxRuns, 100) * 10000;
    } else {
      schedulingFee = 100000;
    }

    const amountAtomic = String(
      base * routeMultiplier + payloadUnits + callTypeFee + schedulingFee
    );

    return {
      amountAtomic,
      asset: env.DEFAULT_ASSET,
      network: env.DEFAULT_NETWORK,
      breakdown: {
        baseAtomic: String(base),
        routeMultiplier,
        jobType: typedPayload.jobType ?? "unknown",
        callType: typedPayload.jobData?.callType ?? "unknown",
        paramsSize,
        payloadUnitsAtomic: String(payloadUnits),
        callTypeFeeAtomic: String(callTypeFee),
        schedulingFeeAtomic: String(schedulingFee),
      },
    };
  }
}

export const pricingService = new PricingService();
