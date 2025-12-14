export interface SensorSnapshot {
  uniqueId: string;

  env: {
    humidity?: number;     // %
    temperature?: number;  // °C
  };

  tilt?: {
    state?: number;
    state_text?: string;
  };

  water?: {
    percent?: number;
    raw?: number;
  };

  key?: {
    last?: string;
  };

  createdAt: Date;
}

// functions/src/types.ts

export type ControlMode = "manual" | "auto";

export interface ControlLog {
  uniqueId: string;

  isOn: boolean;
  mode: ControlMode;

  // true ถ้า /schedule/enable เป็น true
  scheduleEnabled: boolean;

  // เก็บ snapshot schedule ตอนนั้น
  schedule?: {
    countdown_sec?: number;
    start_time?: string;
    stop_time?: string;
    updatedAt?: Date;
  };

  createdAt: Date;
}

export interface SpeechLog {
  // id สุ่มของ log record นี้ (ไม่ใช่ device id แล้ว)
  uniqueId: string;

  text: string;
  createdAt: Date;
}
