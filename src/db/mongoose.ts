import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectMongoose(): Promise<typeof mongoose> {
  await mongoose.connect(env.MONGO_URI, {
    dbName: env.MONGO_DB_NAME,
  });

  return mongoose;
}

export function getMongooseDb() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("Mongoose DB not initialized");
  }

  return db;
}
