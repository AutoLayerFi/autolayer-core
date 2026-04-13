import type { Agenda } from "agenda";
import type { RunOnceJobData } from "../definitions/run-once.job.js";

export async function scheduleOneTimeJob(
  agenda: Agenda,
  input: {
    when?: string | Date;
    jobId: string;
    type: string;
    payload: Record<string, unknown>;
    removeOnComplete?: boolean;
  }
) {
  const when = input.when ?? new Date();

  const data: RunOnceJobData = {
    jobId: input.jobId,
    type: input.type,
    payload: input.payload,
    removeOnComplete: input.removeOnComplete ?? true,
  };

  return agenda.schedule(when, "job:run-once", data);
}
