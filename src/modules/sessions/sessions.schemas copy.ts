import { z } from "zod";

export const prepareSessionSchema = z.object({
  payer: z.string().optional(),
  routeKey: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

export const verifyPaymentSchema = z.object({
  txHash: z.string().min(1),
  payer: z.string().optional(),
});

export const completeSessionSchema = z.object({
  result: z.unknown(),
});

export const failSessionSchema = z.object({
  reason: z.string().min(1),
});

export type PrepareSessionInput = z.infer<typeof prepareSessionSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
export type FailSessionInput = z.infer<typeof failSessionSchema>;
