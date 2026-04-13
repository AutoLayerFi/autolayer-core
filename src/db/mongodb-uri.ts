import { env } from "../config/env.js";

export const MONGODB_URI = `mongodb+srv://${env.DB_USER}:${env.DB_PASSWORD}@autolayer.xt3zpps.mongodb.net/autolayer?appName=autolayer`;
