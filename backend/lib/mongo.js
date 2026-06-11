// ============================================================
// SHARED MONGODB CONNECTION - Analytics & Creator Management
// ============================================================

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGO_URL);
let db = null;

export async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME);
  }
  return db;
}

export { ObjectId } from 'mongodb';
