import type { Job, Agenda } from "agenda";

type FakeMinuteJobData = {
  source: string;
};

export function defineFakeMinuteJob(agenda: Agenda): void {
  agenda.define("fake:minute", async (job: Job<FakeMinuteJobData>) => {
    const source = job.attrs.data?.source ?? "unknown";
    console.log(
      `[fake:minute] ran at ${new Date().toISOString()} | source=${source}`
    );
  });
}
