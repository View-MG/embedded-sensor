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
exports.syncSensorSnapshotToMongo = void 0;
// functions/src/sensorTrigger.ts
const functions = __importStar(require("firebase-functions"));
const crypto_1 = require("crypto");
const mongoClient_1 = require("../mongoClient");
const paths_1 = require("../paths");
// Trigger เมื่อ /sensor เปลี่ยน (env / key / tilt / water ตัวใดตัวหนึ่ง)
exports.syncSensorSnapshotToMongo = functions.database
    .ref(paths_1.RTDB_PATHS.SENSOR_ROOT)
    .onWrite(async (change) => {
    var _a, _b, _c, _d, _e, _f, _g;
    // ถ้า node /sensor ถูกลบไปทั้งก้อน ก็ไม่ต้องทำอะไร
    if (!change.after.exists()) {
        return null;
    }
    const sensorVal = change.after.val() || {};
    const envVal = sensorVal.env || {};
    const tiltVal = sensorVal.tilt || {};
    const waterVal = sensorVal.water || {};
    const keyVal = sensorVal.key || {};
    const snapshot = {
        // สุ่ม uniqueId ใหม่ทุก record
        uniqueId: (0, crypto_1.randomUUID)(),
        env: {
            humidity: (_a = envVal.humidity) !== null && _a !== void 0 ? _a : undefined,
            temperature: (_b = envVal.temperature) !== null && _b !== void 0 ? _b : undefined,
        },
        tilt: {
            state: (_c = tiltVal.state) !== null && _c !== void 0 ? _c : undefined,
            state_text: (_d = tiltVal.state_text) !== null && _d !== void 0 ? _d : undefined,
        },
        water: {
            percent: (_e = waterVal.percent) !== null && _e !== void 0 ? _e : undefined,
            raw: (_f = waterVal.raw) !== null && _f !== void 0 ? _f : undefined,
        },
        key: {
            last: (_g = keyVal.last) !== null && _g !== void 0 ? _g : undefined,
        },
        createdAt: new Date(),
    };
    const col = await (0, mongoClient_1.getSensorSnapshotsCollection)();
    await col.insertOne(snapshot);
    console.log("💾 Sensor snapshot saved:", snapshot);
    return null;
});
//# sourceMappingURL=sensorTrigger.js.map