import { z } from "zod";

export const estimatePriceSchema = z.object({
  routeKey: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

export type EstimatePriceInput = z.infer<typeof estimatePriceSchema>;
