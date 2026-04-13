import type { Job, Agenda } from "agenda";

type FakeOnceJobData = {
  note: string;
};

export function defineFakeOnceJob(agenda: Agenda): void {
  agenda.define("fake:once", async (job: Job<FakeOnceJobData>) => {
    const note = job.attrs.data?.note ?? "no note";
    console.log(`[fake:once] ran at ${new Date().toISOString()} | ${note}`);
  });
}
