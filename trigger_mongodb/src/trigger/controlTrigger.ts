// functions/src/controlTrigger.ts
import * as functions from "firebase-functions";
import { randomUUID } from "crypto";
import { admin } from "../firebaseAdmin";
import { ControlLog, ControlMode } from "../types";
import { getControlLogsCollection } from "../mongoClient";
import { RTDB_PATHS } from "../paths";

async function createControlLog() {
  // อ่านค่าจาก /control และ /schedule โดยตรง
  const [controlSnap, scheduleSnap] = await Promise.all([
    admin.database().ref(RTDB_PATHS.CONTROL).once("value"),
    admin.database().ref(RTDB_PATHS.SCHEDULE).once("value"),
  ]);

  const controlVal = controlSnap.exists() ? controlSnap.val() : {};
  const scheduleVal = scheduleSnap.exists() ? scheduleSnap.val() : {};

  const isOn: boolean = !!controlVal.control_state;
  const mode: ControlMode = controlVal.mode === "auto" ? "auto" : "manual";
  const scheduleEnabled: boolean = !!scheduleVal.enable;

  const schedule = {
    countdown_sec: scheduleVal.countdown_sec ?? undefined,
    start_time: scheduleVal.start_time ?? undefined,
    stop_time: scheduleVal.stop_time ?? undefined,
    updatedAt: scheduleVal.updatedAt
      ? new Date(scheduleVal.updatedAt)
      : undefined,
  };

  const log: ControlLog = {
    uniqueId: randomUUID(),   // id เฉพาะของ log record นี้
    isOn,
    mode,
    scheduleEnabled,
    schedule,
    createdAt: new Date(),
  };

  const col = await getControlLogsCollection();
  await col.insertOne(log);

  console.log("📝 Control log saved:", log);
}

// trigger เมื่อ /control เปลี่ยน
export const onControlChanged = functions.database
  .ref(RTDB_PATHS.CONTROL)
  .onWrite(async (change) => {
    if (!change.after.exists() && !change.before.exists()) return null;
    await createControlLog();
    return null;
  });

// trigger เมื่อ /schedule เปลี่ยน
export const onScheduleChanged = functions.database
  .ref(RTDB_PATHS.SCHEDULE)
  .onWrite(async (change) => {
    if (!change.after.exists() && !change.before.exists()) return null;
    await createControlLog();
    return null;
  });

// ✅ trigger เพิ่มสำหรับ /humidity/control (ใช้ในโหมด auto)
export const onHumidityControlChanged = functions.database
  .ref(RTDB_PATHS.HUMIDITY_CONTROL)
  .onWrite(async (change) => {
    if (!change.after.exists() && !change.before.exists()) return null;
    await createControlLog();
    return null;
  });
