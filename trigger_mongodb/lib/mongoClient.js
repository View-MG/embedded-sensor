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
exports.getSensorSnapshotsCollection = getSensorSnapshotsCollection;
exports.getControlLogsCollection = getControlLogsCollection;
exports.getSpeechLogsCollection = getSpeechLogsCollection;
// functions/src/mongoClient.ts
const functions = __importStar(require("firebase-functions"));
const mongodb_1 = require("mongodb");
let client = null;
let db = null;
async function getDb() {
    var _a, _b;
    if (!client) {
        const uri = (_a = functions.config().mongo) === null || _a === void 0 ? void 0 : _a.uri;
        const dbName = (_b = functions.config().mongo) === null || _b === void 0 ? void 0 : _b.dbname;
        if (!uri || !dbName) {
            console.error("❌ Missing mongo config. Run:\n" +
                'firebase functions:config:set mongo.uri="..." mongo.dbname="..."');
            throw new Error("Mongo config missing");
        }
        client = new mongodb_1.MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log("✅ Connected to MongoDB");
    }
    if (!db)
        throw new Error("Mongo DB not initialized");
    return db;
}
async function getSensorSnapshotsCollection() {
    const database = await getDb();
    return database.collection("sensor_snapshots");
}
async function getControlLogsCollection() {
    const database = await getDb();
    return database.collection("control_logs");
}
async function getSpeechLogsCollection() {
    const database = await getDb();
    return database.collection("speech_logs");
}
//# sourceMappingURL=mongoClient.js.map