import type { Agenda } from "agenda";
import { defineRunOnceJob } from "./definitions/run-once.job.js";
import { defineRunRecurringJob } from "./definitions/run-recurring.job.js";

export function registerAgendaJobs(agenda: Agenda): void {
  defineRunOnceJob(agenda);
  defineRunRecurringJob(agenda);
}
