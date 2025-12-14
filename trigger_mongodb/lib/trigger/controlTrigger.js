"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onHumidityControlChanged = exports.onScheduleChanged = exports.onControlChanged = void 0;
// functions/src/controlTrigger.ts
const functions = __importStar(require("firebase-functions"));
const crypto_1 = require("crypto");
const firebaseAdmin_1 = require("../firebaseAdmin");
const mongoClient_1 = require("../mongoClient");
const paths_1 = require("../paths");
async function createControlLog() {
    var _a, _b, _c;
    // อ่านค่าจาก /control และ /schedule โดยตรง
    const [controlSnap, scheduleSnap] = await Promise.all([
        firebaseAdmin_1.admin.database().ref(paths_1.RTDB_PATHS.CONTROL).once("value"),
        firebaseAdmin_1.admin.database().ref(paths_1.RTDB_PATHS.SCHEDULE).once("value"),
    ]);
    const controlVal = controlSnap.exists() ? controlSnap.val() : {};
    const scheduleVal = scheduleSnap.exists() ? scheduleSnap.val() : {};
    const isOn = !!controlVal.control_state;
    const mode = controlVal.mode === "auto" ? "auto" : "manual";
    const scheduleEnabled = !!scheduleVal.enable;
    const schedule = {
        countdown_sec: (_a = scheduleVal.countdown_sec) !== null && _a !== void 0 ? _a : undefined,
        start_time: (_b = scheduleVal.start_time) !== null && _b !== void 0 ? _b : undefined,
        stop_time: (_c = scheduleVal.stop_time) !== null && _c !== void 0 ? _c : undefined,
        updatedAt: scheduleVal.updatedAt
            ? new Date(scheduleVal.updatedAt)
            : undefined,
    };
    const log = {
        uniqueId: (0, crypto_1.randomUUID)(), // id เฉพาะของ log record นี้
        isOn,
        mode,
        scheduleEnabled,
        schedule,
        createdAt: new Date(),
    };
    const col = await (0, mongoClient_1.getControlLogsCollection)();
    await col.insertOne(log);
    console.log("📝 Control log saved:", log);
}
// trigger เมื่อ /control เปลี่ยน
exports.onControlChanged = functions.database
    .ref(paths_1.RTDB_PATHS.CONTROL)
    .onWrite(async (change) => {
    if (!change.after.exists() && !change.before.exists())
        return null;
    await createControlLog();
    return null;
});
// trigger เมื่อ /schedule เปลี่ยน
exports.onScheduleChanged = functions.database
    .ref(paths_1.RTDB_PATHS.SCHEDULE)
    .onWrite(async (change) => {
    if (!change.after.exists() && !change.before.exists())
        return null;
    await createControlLog();
    return null;
});
// ✅ trigger เพิ่มสำหรับ /humidity/control (ใช้ในโหมด auto)
exports.onHumidityControlChanged = functions.database
    .ref(paths_1.RTDB_PATHS.HUMIDITY_CONTROL)
    .onWrite(async (change) => {
    if (!change.after.exists() && !change.before.exists())
        return null;
    await createControlLog();
    return null;
});
//# sourceMappingURL=controlTrigger.js.map