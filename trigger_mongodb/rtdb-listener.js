// rtdb-listener.js (ปรับปรุง)

require("dotenv").config({ path: ".env.listener" });

const admin = require("firebase-admin");
const { MongoClient } = require("mongodb");
const { randomUUID } = require("crypto");

// --------- Firebase Admin ----------

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const rtdb = admin.database();

// --------- MongoDB ----------

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DBNAME || "curtain_project";

if (!mongoUri) {
  console.error("❌ MONGODB_URI is not set in .env.listener");
  process.exit(1);
}

const client = new MongoClient(mongoUri);

async function main() {
  await client.connect();
  const db = client.db(mongoDbName);

  const sensorCol = db.collection("sensor_snapshots");
  const controlLogsCol = db.collection("control_logs");
  const speechLogsCol = db.collection("speech_logs");

  console.log("✅ Connected to MongoDB:", mongoDbName);
  console.log("✅ Connected to Firebase RTDB");

  // ----------------------------------------------------
  // 1) Sensor Listener (/sensor) - ใช้ .on('value')
  // ----------------------------------------------------
  const sensorRef = rtdb.ref("/sensor");

  sensorRef.on("value", async (snap) => {
    if (!snap.exists()) return;

    const sensorVal = snap.val() || {};
    const envVal = sensorVal.env || {};
    const tiltVal = sensorVal.tilt || {};
    const waterVal = sensorVal.water || {};
    const keyVal = sensorVal.key || {};

    const doc = {
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

    await sensorCol.insertOne(doc);
    console.log("💾 [Sensor] snapshot saved:", doc);
  });

  // ----------------------------------------------------
  // 2) Control + Schedule + Humidity/Control - ใช้ .on('value')
  // ----------------------------------------------------
  const controlRef = rtdb.ref("/control");
  const scheduleRef = rtdb.ref("/schedule");
  const humidityControlRef = rtdb.ref("/humidity/control");

  async function createControlLog() {
    // Logic เดิม...
    const [controlSnap, scheduleSnap] = await Promise.all([
      controlRef.get(),
      scheduleRef.get(),
    ]);

    const controlVal = controlSnap.exists() ? controlSnap.val() : {};
    const scheduleVal = scheduleSnap.exists() ? scheduleSnap.val() : {};

    const isOn = !!controlVal.control_state;
    const mode = controlVal.mode === "auto" ? "auto" : "manual";
    const scheduleEnabled = !!scheduleVal.enable;

    const schedule = {
      countdown_sec: scheduleVal.countdown_sec ?? undefined,
      start_time: scheduleVal.start_time ?? undefined,
      stop_time: scheduleVal.stop_time ?? undefined,
      updatedAt: scheduleVal.updatedAt
        ? new Date(scheduleVal.updatedAt)
        : undefined,
    };

    const log = {
      uniqueId: randomUUID(),
      isOn,
      mode,
      scheduleEnabled,
      schedule,
      createdAt: new Date(),
    };

    await controlLogsCol.insertOne(log);
    console.log("📝 [Control] log saved:", log);
  }

  // เมื่อ /control เปลี่ยน
  controlRef.on("value", async () => {
    await createControlLog();
  });

  // เมื่อ /schedule เปลี่ยน
  scheduleRef.on("value", async () => {
    await createControlLog();
  });

  // เมื่อ /humidity/control เปลี่ยน (ใช้ในโหมด auto)
  humidityControlRef.on("value", async () => {
    await createControlLog();
  });

    // ----------------------------------------------------
    // 3) Speech Logs from /speech_latest - ใช้ .on('value')
    // ----------------------------------------------------
  const speechLatestRef = rtdb.ref("/speech_latest");

    // 💡 การใช้ .on('value', ...) คือวิธี Listener ที่ถูกต้องสำหรับ Node.js script
  speechLatestRef.on("value", async (snap) => {
    // เพิ่ม Log เพื่อยืนยันว่า Event ถูกรับจริง
    console.log("📣 [Speech Event] Detected change at /speech_latest. Exists:", snap.exists());

    if (!snap.exists()) return;

    const data = snap.val() || {};
    
    // 🔑 ตรวจสอบว่า text หรือ timestamp มีการเปลี่ยนแปลงหรือไม่ ก่อนบันทึก
    if (!data.text && !data.timestamp) {
        console.log("⚠️ [Speech Log] Skipping: Data is empty or invalid.");
        return;
    }

    const logDoc = {
      uniqueId: randomUUID(),
      text: data.text ?? "",
      createdAt: data.timestamp
        ? new Date(data.timestamp)   // ใช้ timestamp จาก RTDB
        : new Date(),                // เผื่อกรณีไม่มี timestamp
    };

    await speechLogsCol.insertOne(logDoc);
    // แก้ไข Log Message ให้ถูกต้องและสอดคล้อง
    console.log("💬 [Speech] log saved from /speech_latest:", logDoc);
  });

}

main().catch((err) => {
  console.error("❌ Error in main():", err);
  process.exit(1);
});

// ปิด Mongo อย่างสวยงามเวลา Ctrl+C
process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down...");
  try {
    await client.close();
  } catch (e) {
    // ignore
  }
  process.exit(0);
});