import { Agenda } from "agenda";
import { MongoBackend } from "@agendajs/mongo-backend";
import { getDb } from "../db/mongo.js";

let agenda: Agenda | null = null;

export function createAgenda(): Agenda {
  if (agenda) return agenda;

  agenda = new Agenda({
    backend: new MongoBackend({
      mongo: getDb(),
      collection: "agendaJobs",
      ensureIndex: true,
    }),
    processEvery: "5 seconds",
    defaultConcurrency: 5,
    maxConcurrency: 20,
    defaultLockLifetime: 60_000,
  });

  return agenda;
}

export function getAgenda(): Agenda {
  if (!agenda) {
    throw new Error("Agenda not initialized");
  }

  return agenda;
}
