import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI);
let db;

export async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME);
  }
  return db;
}
