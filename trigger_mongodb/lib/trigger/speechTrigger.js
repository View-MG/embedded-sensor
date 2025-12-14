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
exports.syncSpeechLogToMongo = void 0;
// functions/src/speechTrigger.ts
const functions = __importStar(require("firebase-functions"));
const crypto_1 = require("crypto");
const mongoClient_1 = require("../mongoClient");
const paths_1 = require("../paths");
// Trigger ทุกครั้งที่มี node ใหม่ที่ /speech/{uniqueId}/{logId}
exports.syncSpeechLogToMongo = functions.database
    .ref(paths_1.RTDB_PATHS.SPEECH)
    .onWrite(async (change, context) => {
    var _a;
    if (!change.after.exists()) {
        // ลบออกจาก RTDB ก็ไม่ต้องไปลบจาก Mongo (เก็บ history ไว้)
        return null;
    }
    const data = change.after.val();
    const log = {
        uniqueId: (0, crypto_1.randomUUID)(), // ✅ ไม่ใช่ device id แล้ว แค่ id ของ log record นี้
        text: (_a = data.text) !== null && _a !== void 0 ? _a : "",
        createdAt: data.createdAt
            ? new Date(data.createdAt)
            : new Date(),
    };
    const col = await (0, mongoClient_1.getSpeechLogsCollection)();
    await col.insertOne(log);
    console.log("💬 Speech log saved:", log);
    return null;
});
//# sourceMappingURL=speechTrigger.js.map