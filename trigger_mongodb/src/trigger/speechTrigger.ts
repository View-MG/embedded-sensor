// functions/src/speechTrigger.ts
import * as functions from "firebase-functions";
import { randomUUID } from "crypto";
import { SpeechLog } from "../types";
import { getSpeechLogsCollection } from "../mongoClient";
import { RTDB_PATHS } from "../paths";

// Trigger ทุกครั้งที่มี node ใหม่ที่ /speech
export const syncSpeechLogToMongo = functions.database
  .ref(RTDB_PATHS.SPEECH)
  .onWrite(async (change, context) => {
    if (!change.after.exists()) {
      // ลบออกจาก RTDB ก็ไม่ต้องไปลบจาก Mongo (เก็บ history ไว้)
      return null;
    }

    const data = change.after.val();

    const log: SpeechLog = {
      uniqueId: randomUUID(),  // ✅ ไม่ใช่ device id แล้ว แค่ id ของ log record นี้
      text: data.text ?? "",
      createdAt: data.timestamp
        ? new Date(data.timestamp)
        : new Date(),
    };

    const col = await getSpeechLogsCollection();
    await col.insertOne(log);

    console.log("💬 Speech log saved:", log);
    return null;
  });
