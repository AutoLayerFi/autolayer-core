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

export const estimatePriceSchema = z.object({
  routeKey: z.string().min(1),
  payload: z.union([oneTimePayloadSchema, recurringPayloadSchema]),
});

export type EstimatePriceInput = z.infer<typeof estimatePriceSchema>;
