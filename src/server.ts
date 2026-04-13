import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./db/mongo.js";
import { createAgenda } from "./agenda/agenda.js";
import { registerAgendaJobs } from "./agenda/register-jobs.js";

async function bootstrap() {
  console.log("bootstrapping app...");

  await connectMongo();
  console.log("Mongo connected");

  const agenda = createAgenda();

  registerAgendaJobs(agenda);
  console.log("Agenda jobs registered");

  await agenda.start();
  console.log("Agenda started");

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`autolayer-server running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
