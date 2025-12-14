// functions/src/mongoClient.ts
import * as functions from "firebase-functions";
import { MongoClient, Db, Collection } from "mongodb";
import { SensorSnapshot, ControlLog, SpeechLog } from "./types";

let client: MongoClient | null = null;
let db: Db | null = null;

async function getDb(): Promise<Db> {
  if (!client) {
    const uri = functions.config().mongo?.uri as string | undefined;
    const dbName = functions.config().mongo?.dbname as string | undefined;

    if (!uri || !dbName) {
      console.error(
        "❌ Missing mongo config. Run:\n" +
          'firebase functions:config:set mongo.uri="..." mongo.dbname="..."'
      );
      throw new Error("Mongo config missing");
    }

    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log("✅ Connected to MongoDB");
  }

  if (!db) throw new Error("Mongo DB not initialized");
  return db;
}

export async function getSensorSnapshotsCollection(): Promise<
  Collection<SensorSnapshot>
> {
  const database = await getDb();
  return database.collection<SensorSnapshot>("sensor_snapshots");
}

export async function getControlLogsCollection(): Promise<
  Collection<ControlLog>
> {
  const database = await getDb();
  return database.collection<ControlLog>("control_logs");
}

export async function getSpeechLogsCollection(): Promise<
  Collection<SpeechLog>
> {
  const database = await getDb();
  return database.collection<SpeechLog>("speech_logs");
}
