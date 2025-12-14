#pragma once
#include <Arduino.h>

// ================= WIFI / ESP-NOW CONFIG =================
#define WIFI_SSID           "View"
#define WIFI_PASSWORD       "12345678"

// MAC ของ Gateway Node
const uint8_t GATEWAY_MAC[] = {0x28, 0x56, 0x2F, 0x49, 0x94, 0x28};

// ================= HARDWARE PINS =================
// ใช้ขาเดียวคุมทั้ง Fan + Steam ทางฮาร์ดแวร์
#define PIN_CONTROL         19
#define PIN_WATER_LEVEL     34

// I2C สำหรับ MPU6050
#define MPU_SDA             21
#define MPU_SCL             22

// ================= KEYPAD CONFIG =================
constexpr byte KEYPAD_ROWS = 4;
constexpr byte KEYPAD_COLS = 4;
constexpr byte ROW_PINS[4] = {32, 33, 25, 26};
constexpr byte COL_PINS[4] = {13, 12, 14, 27};
constexpr char KEY_MAP[KEYPAD_ROWS][KEYPAD_COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

// ================= MPU6050 CALIBRATION =================
#define MPU_REF_PITCH            -10.0
#define MPU_REF_ROLL             90.0
#define MPU_WARN_THRESHOLD_DEG   20.0f
#define MPU_FALL_THRESHOLD_DEG   30.0f

// ================= WATER LEVEL CALIBRATION =================
#define WATER_RAW_DRY    0   // ค่าดิบตอนแห้ง
#define WATER_RAW_FULL    2100   // ค่าดิบตอนเต็ม

// ================= TILT STATE =================
enum TiltState : uint8_t {
    TILT_NORMAL  = 0,  // ปกติ
    TILT_WARNING = 1,  // ระวัง
    TILT_FALL    = 2   // ล้ม
};

// ================= DATA STRUCTURES (PROTOCOL) =================
// 1. ส่งออก: Sensor -> Gateway
typedef struct {
  int      nodeId;
  int      waterRaw;
  int      waterPercent;
  uint8_t  tiltState;     // 0/1/2
  char     keyPress;      // 0 ถ้าไม่มีการกด
  bool     controlState;  // true = ON, false = OFF
} SensorPacket;

typedef struct {
  bool    active;
} CommandPacket;
