#include <Arduino.h>
#include "constant.h"
#include "sensor/sensor.h"      // มี SensorService (water + gyro + keypad)
#include "control/control.h"
#include "network.h"

// --------- GLOBAL PACKET ที่ใช้ทั้งระบบ ---------
SensorPacket gSensorPacket;

// --------- Services ---------
SensorService  sensorService;
ControlService controlService;
NetworkService net(&controlService);

unsigned long lastSend = 0;
const unsigned long SENSOR_INTERVAL_MS = 3000;  // ส่งทุก 3 วิ (ตามที่ตกลง)

// สำหรับจับ keypress เปลี่ยน
char lastKeySent = 0;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n[SensorNode] Booting...");

    sensorService.begin();
    controlService.begin();
    net.begin();

    // ตั้งค่าเริ่มต้นของ packet
    memset(&gSensorPacket, 0, sizeof(gSensorPacket));
    gSensorPacket.nodeId       = 1;    // ถ้ามีหลาย node ค่อยเปลี่ยนทีหลัง
    gSensorPacket.controlState = controlService.state();

    Serial.println("[SensorNode] Ready");
}

void loop() {
    // 1) อัปเดต sensor ภายใน (gyro + keypad)
    sensorService.update();

    // 2) อ่านค่าจริงจาก SensorService
    gSensorPacket.waterRaw     = sensorService.getWaterRaw();
    gSensorPacket.waterPercent = sensorService.getWaterPercent();
    gSensorPacket.tiltState    = (uint8_t)sensorService.getTiltState();

    char k = sensorService.getKey();
    if (k != 0) {
        gSensorPacket.keyPress = k;
    } else {
        gSensorPacket.keyPress = 0;
    }

    // 3) sync controlState ตามของจริง (เผื่อมีคำสั่งจาก Gateway เข้ามาใน callback)
    gSensorPacket.controlState = controlService.state();

    // 4) ตัดสินใจว่าจะส่ง packet เมื่อไหร่
    bool shouldSend = false;

    // 4.1 ส่งทุก 3 วิ
    if (millis() - lastSend >= SENSOR_INTERVAL_MS) {
        shouldSend = true;
    }

    // 4.2 ถ้ามี key ใหม่ที่ต่างจากที่เคยส่ง → ส่งทันที
    if (gSensorPacket.keyPress != 0 && gSensorPacket.keyPress != lastKeySent) {
        shouldSend = true;
    }

    if (shouldSend) {
        net.sendPacket();
        lastSend = millis();
        lastKeySent = gSensorPacket.keyPress;

        char keyChar = (gSensorPacket.keyPress == 0) ? '-' : gSensorPacket.keyPress;

        Serial.printf("[SN→GW] node=%d | CTRL=%s | W=%d%%(%d) | T=%d | KEY='%c'\n",
                      gSensorPacket.nodeId,
                      gSensorPacket.controlState ? "ON" : "OFF",
                      gSensorPacket.waterPercent,
                      gSensorPacket.waterRaw,
                      gSensorPacket.tiltState,
                      keyChar);
    }

    // ทำ loop ให้เบา ไม่ block
    delay(5);
}
