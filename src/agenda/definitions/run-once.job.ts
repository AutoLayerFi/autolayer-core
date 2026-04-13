import type { Agenda, Job } from "agenda";

export type RunOnceJobData = {
  jobId: string;
  type: string;
  payload: Record<string, unknown>;
  removeOnComplete?: boolean;
};

export function defineRunOnceJob(agenda: Agenda): void {
  agenda.define("job:run-once", async (job: Job<RunOnceJobData>) => {
    const data = job.attrs.data;

    if (!data) {
      console.log("[job:run-once] missing job data");
      return;
    }

    const removeOnComplete = data.removeOnComplete ?? true;

    console.log(
      `[job:run-once] ran at ${new Date().toISOString()} | jobId=${
        data.jobId
      } | type=${data.type}`
    );
    console.log("[job:run-once] payload:", data.payload);

    if (removeOnComplete) {
      await job.remove();
      console.log(`[job:run-once] removed jobId=${data.jobId}`);
    }
  });
}
