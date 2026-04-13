import { z } from "zod";
import { callTypeSchema } from "../shared/job.types.js";

const oneTimeScheduleSchema = z.object({
  runAt: z.iso.datetime({ offset: true }).optional(),
});

const recurringScheduleSchema = z.object({
  startsAt: z.iso.datetime({ offset: true }).optional(),
  interval: z.string().min(1),
  maxRuns: z.number().int().positive().optional(),
});

const jobDataSchema = z.object({
  description: z.string().min(1).optional(),
  callType: callTypeSchema,
  params: z.record(z.string(), z.unknown()),
});

const oneTimePayloadSchema = z.object({
  jobType: z.literal("one_time"),
  jobName: z.string().min(1),
  jobData: jobDataSchema,
  scheduleConfig: oneTimeScheduleSchema.optional(),
});

const recurringPayloadSchema = z.object({
  jobType: z.literal("recurring"),
  jobName: z.string().min(1),
  jobData: jobDataSchema,
  scheduleConfig: recurringScheduleSchema,
});

export const automationPayloadSchema = z.union([
  oneTimePayloadSchema,
  recurringPayloadSchema,
]);

export const prepareSessionSchema = z.object({
  payer: z.string().optional(),
  routeKey: z.string().min(1),
  payload: automationPayloadSchema,
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

export type AutomationPayloadInput = z.infer<typeof automationPayloadSchema>;
export type PrepareSessionInput = z.infer<typeof prepareSessionSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
export type FailSessionInput = z.infer<typeof failSessionSchema>;
