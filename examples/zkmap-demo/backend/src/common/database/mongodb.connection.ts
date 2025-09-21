import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!client || !db) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/anonymous-multi-party-vc';
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
  }

  return { client, db };
}