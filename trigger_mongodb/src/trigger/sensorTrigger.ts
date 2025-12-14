// functions/src/sensorTrigger.ts
import * as functions from "firebase-functions";
import { randomUUID } from "crypto";
import { SensorSnapshot } from "../types";
import { getSensorSnapshotsCollection } from "../mongoClient";
import { RTDB_PATHS } from "../paths";

// Trigger เมื่อ /sensor เปลี่ยน (env / key / tilt / water ตัวใดตัวหนึ่ง)
export const syncSensorSnapshotToMongo = functions.database
  .ref(RTDB_PATHS.SENSOR_ROOT)
  .onWrite(async (change) => {
    // ถ้า node /sensor ถูกลบไปทั้งก้อน ก็ไม่ต้องทำอะไร
    if (!change.after.exists()) {
      return null;
    }

    const sensorVal = change.after.val() || {};

    const envVal = sensorVal.env || {};
    const tiltVal = sensorVal.tilt || {};
    const waterVal = sensorVal.water || {};
    const keyVal = sensorVal.key || {};

    const snapshot: SensorSnapshot = {
      // สุ่ม uniqueId ใหม่ทุก record
      uniqueId: randomUUID(),
      env: {
        humidity: envVal.humidity ?? undefined,
        temperature: envVal.temperature ?? undefined,
      },
      tilt: {
        state: tiltVal.state ?? undefined,
        state_text: tiltVal.state_text ?? undefined,
      },
      water: {
        percent: waterVal.percent ?? undefined,
        raw: waterVal.raw ?? undefined,
      },
      key: {
        last: keyVal.last ?? undefined,
      },
      createdAt: new Date(),
    };

    const col = await getSensorSnapshotsCollection();
    await col.insertOne(snapshot);

    console.log("💾 Sensor snapshot saved:", snapshot);
    return null;
  });
