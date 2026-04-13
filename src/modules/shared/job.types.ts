import { z } from "zod";

export const callTypeSchema = z.enum([
  "contract_invoke",
  "smart_automate",
  "stellar_ops",
  "upkeep",
]);

export type CallType = z.infer<typeof callTypeSchema>;
