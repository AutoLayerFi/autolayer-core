import type { Agenda, Job } from "agenda";

export type RunRecurringJobData = {
  jobId: string;
  type: string;
  payload: Record<string, unknown>;
  interval: string;
  startsAt?: string;
  maxRuns?: number;
  runCount?: number;
  removeOnComplete?: boolean;
};

export function defineRunRecurringJob(agenda: Agenda): void {
  agenda.define("job:run-recurring", async (job: Job<RunRecurringJobData>) => {
    const data = job.attrs.data;

    if (!data) {
      console.log("[job:run-recurring] missing job data");
      return;
    }

    const currentRunCount = (data.runCount ?? 0) + 1;
    const removeOnComplete = data.removeOnComplete ?? true;

    console.log(
      `[job:run-recurring] ran at ${new Date().toISOString()} | jobId=${
        data.jobId
      } | type=${data.type} | run=${currentRunCount}${
        typeof data.maxRuns === "number" ? `/${data.maxRuns}` : ""
      }`
    );
    console.log("[job:run-recurring] payload:", data.payload);

    job.attrs.data = {
      ...data,
      runCount: currentRunCount,
    };

    await job.save();

    if (typeof data.maxRuns === "number" && currentRunCount >= data.maxRuns) {
      console.log(
        `[job:run-recurring] reached maxRuns for jobId=${data.jobId}`
      );

      if (removeOnComplete) {
        await job.remove();
        console.log(`[job:run-recurring] removed jobId=${data.jobId}`);
      }
    }
  });
}
