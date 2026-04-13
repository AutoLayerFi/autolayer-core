import { MongoClient, Db } from "mongodb";
import { env } from "../config/env.js";
import { MONGODB_URI } from "./mongodb-uri.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(MONGODB_URI);

  await client.connect();

  db = client.db(env.DB_NAME);

  await db.command({ ping: 1 });

  console.log(`✅ MongoDB connected to DB: ${db.databaseName}`);

  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB not initialized");
  }
  return db;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
