import { MongoClient, Db } from 'mongodb';
export declare function connectToDatabase(): Promise<{
    client: MongoClient;
    db: Db;
}>;
