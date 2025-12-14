# Smart Humidifier — Others (Sensor Node + MongoDB Trigger)

Repo นี้เก็บ “ส่วนประกอบเสริม” ของโปรเจค Smart Humidifier ที่แยกออกจาก Gateway repo หลัก ได้แก่

- `sensor-node/` — Firmware ของ **Sensor Node (ESP32)** ที่อยู่กับเครื่องจริง
- `trigger_mongodb/` — ตัว **Trigger/Listener** ที่ดึงข้อมูลจาก **Firebase RTDB** ไปเก็บ **MongoDB** (สำหรับเก็บ history/logs)
- `Smart Humidifier Report.pdf` — รายงาน/ภาพรวมระบบ

> Gateway Node อยู่ใน repo หลัก (ดูหัวข้อ “Related Repos” ด้านล่าง)

---

## Sensor Node คืออะไร
Sensor Node คือ ESP32 ที่อยู่กับตัวเครื่อง humidifier ทำหน้าที่:
- อ่าน **Water level** (analog) → แปลงเป็น % / สถานะน้ำ
- อ่าน **MPU6050 (Gyro/IMU)** ผ่าน I2C → ตรวจเอียง/ล้ม (Safety)
- อ่าน **Keypad 4x4** → คำสั่งแบบ local (override)
- คุม **Relay / อุปกรณ์พ่นไอน้ำ/พัดลม** ตามคำสั่งจาก Gateway
- ส่ง snapshot ไป Gateway ด้วย **ESP‑NOW**

### สิ่งที่ต้องตั้งค่าก่อนแฟลช
โดยปกติจะอยู่ในไฟล์ `constant.h` ของ sensor-node:
- MAC Address ของ Gateway (ESP‑NOW peer)
- Pin mapping (relay / water analog / I2C SDA/SCL / keypad pins)
- Threshold/Calibration ของน้ำ และเกณฑ์ tilt/fall (ถ้ามี)

### การใช้งาน (Firmware)
1) เปิดโปรเจค `sensor-node/` ใน PlatformIO หรือ Arduino IDE  
2) ตรวจค่าพิน/ MAC ให้ถูกต้อง  
3) Build + Upload  
4) เปิด Serial Monitor เพื่อตรวจ log (ส่ง/รับ ESP‑NOW, water%, tilt state, last key)

---

## trigger_mongodb คืออะไร
ชุดนี้ใช้เก็บ “ข้อมูลย้อนหลัง” จาก Firebase RTDB ลง MongoDB เช่น:
- snapshot ของ `/sensor`
- log ของ `/control`, `/schedule`, `/humidity/control`
- (ถ้ามี) voice/speech logs

เหมาะสำหรับ:
- ทำ dashboard แบบ history
- วิเคราะห์การใช้งาน/ความถี่เปิด-ปิด
- ตรวจสอบเหตุการณ์ safety ย้อนหลัง

### วิธีรันแบบ Local (แนะนำ Docker)
1) เข้าโฟลเดอร์ `trigger_mongodb/`
2) สร้างไฟล์ `.env` ตามที่โปรเจคต้องใช้ (Firebase RTDB + Mongo URI)
3) รัน:
```bash
docker compose up -d
```
4) เช็ค log:
```bash
docker compose logs -f
```

> ถ้าไม่ได้ใช้ docker ก็สามารถ `npm install` แล้ว `node <listener-file>` ได้ตามสคริปต์ในโฟลเดอร์

---

## Related Repos
- **Gateway Node (Main Repo)** — “สมองกลาง” อ่าน config จาก RTDB + ตัดสินใจ manual/auto/schedule แล้วส่งคำสั่งกลับ sensor node
- **Dashboard + WebSocket Repo** — UI สำหรับดู/สั่งงาน + (optional) WS server

Repo:
- https://github.com/View-MG/humidifier-dashboard
