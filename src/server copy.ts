import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./db/mongo.js";
import { createAgenda } from "./agenda/agenda.js";
import { registerAgendaJobs } from "./agenda/register-jobs.js";
import { scheduleOneTimeJob } from "./agenda/schedulers/schedule-once.js";
import { scheduleRecurringJob } from "./agenda/schedulers/schedule-recurring.js";

async function bootstrap() {
  console.log("bootstrapping app...");

  await connectMongo();

  const agenda = createAgenda();
  registerAgendaJobs(agenda);

  await agenda.start();
  console.log("Agenda started");

  // clear old test jobs so restarts don't duplicate them
  await agenda.cancel({ name: "job:run-once" });
  await agenda.cancel({ name: "job:run-recurring" });
  console.log("Old test jobs cleared");

  // -----------------------------
  // ONE-TIME JOBS
  // -----------------------------
  await scheduleOneTimeJob(agenda, {
    when: "in 10 seconds",
    jobId: "once_job_1",
    type: "demo-once",
    payload: {
      msg: "one-time job 1",
      index: 1,
    },
    // removeOnComplete defaults to true
  });

  await scheduleOneTimeJob(agenda, {
    when: "in 20 seconds",
    jobId: "once_job_2",
    type: "demo-once",
    payload: {
      msg: "one-time job 2",
      index: 2,
    },
  });

  console.log("2 one-time jobs scheduled");

  // -----------------------------
  // FAST TEST RECURRING JOBS
  // -----------------------------
  // first starts in 3 seconds, repeats every 10 seconds, runs 5 times, then deletes itself
  await scheduleRecurringJob(agenda, {
    jobId: "recurring_fast_1",
    type: "demo-recurring-fast",
    interval: "10 seconds",
    startsAt: new Date(Date.now() + 3_000),
    maxRuns: 5,
    payload: {
      msg: "fast recurring job 1",
      startsAfter: "3 seconds",
      interval: "10 seconds",
    },
  });

  // second starts in 5 seconds, repeats every 15 seconds, runs 5 times, then deletes itself
  await scheduleRecurringJob(agenda, {
    jobId: "recurring_fast_2",
    type: "demo-recurring-fast",
    interval: "15 seconds",
    startsAt: new Date(Date.now() + 5_000),
    maxRuns: 5,
    payload: {
      msg: "fast recurring job 2",
      startsAfter: "5 seconds",
      interval: "15 seconds",
    },
  });

  console.log("2 fast recurring jobs scheduled");

  // -----------------------------
  // REAL INTERVAL RECURRING JOBS
  // -----------------------------
  // first every 1 minute, delayed 2 minutes, runs 5 times, then deletes itself
  await scheduleRecurringJob(agenda, {
    jobId: "recurring_real_1",
    type: "demo-recurring-real",
    interval: "1 minute",
    startsAt: new Date(Date.now() + 2 * 60_000),
    maxRuns: 5,
    payload: {
      msg: "real recurring job 1",
      startsAfter: "2 minutes",
      interval: "1 minute",
    },
  });

  // second every 2 minutes, delayed 1 minute, runs 5 times, then deletes itself
  await scheduleRecurringJob(agenda, {
    jobId: "recurring_real_2",
    type: "demo-recurring-real",
    interval: "2 minutes",
    startsAt: new Date(Date.now() + 1 * 60_000),
    maxRuns: 5,
    payload: {
      msg: "real recurring job 2",
      startsAfter: "1 minute",
      interval: "2 minutes",
    },
  });

  console.log("2 real recurring jobs scheduled");

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`autolayer-server running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
