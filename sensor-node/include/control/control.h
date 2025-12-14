#pragma once
#include <Arduino.h>
#include "constant.h"

class ControlService {
private:
    bool _state = false;

public:
    void begin() {
        pinMode(PIN_CONTROL, OUTPUT);
        apply(false);   // เริ่มต้นปิดไว้ก่อน
    }

    // ทำตามที่ Gateway สั่งทันที ไม่ต้องมี logic อื่น
    void apply(bool on) {
        _state = on;
        digitalWrite(PIN_CONTROL, on ? HIGH : LOW);
    }

    bool state() const {
        return _state;
    }
};
