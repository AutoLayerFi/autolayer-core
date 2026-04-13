import type { Agenda } from "agenda";
import type { RunRecurringJobData } from "../definitions/run-recurring.job.js";

export async function scheduleRecurringJob(
  agenda: Agenda,
  input: {
    jobId: string;
    type: string;
    payload: Record<string, unknown>;
    interval: string;
    startsAt?: string | Date;
    maxRuns?: number;
    removeOnComplete?: boolean;
  }
) {
  const data: RunRecurringJobData = {
    jobId: input.jobId,
    type: input.type,
    payload: input.payload,
    interval: input.interval,
    startsAt: input.startsAt
      ? new Date(input.startsAt).toISOString()
      : undefined,
    maxRuns: input.maxRuns,
    runCount: 0,
    removeOnComplete: input.removeOnComplete ?? true,
  };

  const job = agenda.create("job:run-recurring", data);

  job.unique({ "data.jobId": input.jobId });

  if (input.startsAt) {
    job.schedule(input.startsAt);
  }

  job.repeatEvery(input.interval);

  await job.save();

  return job;
}
