#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include "constant.h"
#include "control/control.h"

// ให้ main.cpp ประกาศตัวแปรพวกนี้ไว้
extern SensorPacket gSensorPacket;

class NetworkService {
private:
    ControlService* _control;
    static NetworkService* _instance;

    static void onRecv(const uint8_t* mac, const uint8_t* incoming, int len) {
        Serial.printf("[onRecv] len=%d, expected=%d\n", len, (int)sizeof(CommandPacket));

        if (!_instance) return;
        if (len != sizeof(CommandPacket)) {
            Serial.println("[onRecv] size mismatch, ignore");
            return;
        }

        CommandPacket cmd;
        memcpy(&cmd, incoming, sizeof(CommandPacket));

        // ทำตาม Gateway ทันที
        _instance->_control->apply(cmd.active);
        gSensorPacket.controlState = _instance->_control->state();

        Serial.printf("[GW→SN] CMD=%s → CONTROL=%s\n",
                      cmd.active ? "ON" : "OFF",
                      gSensorPacket.controlState ? "ON" : "OFF");
    }

    static void onSent(const uint8_t* mac, esp_now_send_status_t status) {
        Serial.printf("[SN→GW] Send status: %s\n",
                      status == ESP_NOW_SEND_SUCCESS ? "OK" : "FAIL");
    }

public:
    NetworkService(ControlService* ctrl)
        : _control(ctrl) {}

    void begin() {
        _instance = this;

        // ---------- เชื่อม Wi-Fi เข้า AP "View" ----------
        WiFi.mode(WIFI_STA);      // ใช้โหมด STA อย่างเดียว
        WiFi.setSleep(false);
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

        Serial.print("[SN WiFi] Connecting");
        while (WiFi.status() != WL_CONNECTED) {
            Serial.print(".");
            delay(300);
        }
        Serial.println("\n[SN WiFi] Connected ✔");
        Serial.print("[SN WiFi] IP: ");      Serial.println(WiFi.localIP());
        Serial.print("[SN WiFi] Channel: "); Serial.println(WiFi.channel());

        // ---------- เริ่มต้น ESP-NOW ----------
        if (esp_now_init() != ESP_OK) {
            Serial.println("[ESP-NOW] Init failed");
            return;
        }

        esp_now_register_recv_cb(onRecv);
        esp_now_register_send_cb(onSent);

        esp_now_peer_info_t peer{};
        memset(&peer, 0, sizeof(peer));
        memcpy(peer.peer_addr, GATEWAY_MAC, 6);
        peer.channel = 0;      // 0 = ใช้ channel เดียวกับที่ Wi-Fi ต่ออยู่
        peer.encrypt = false;

        Serial.print("[SN] Peer MAC: ");
        for (int i = 0; i < 6; i++) {
            Serial.printf("%02X", GATEWAY_MAC[i]);
            if (i < 5) Serial.print(":");
        }
        Serial.println();

        if (esp_now_add_peer(&peer) != ESP_OK) {
            Serial.println("[ESP-NOW] Add peer failed");
        } else {
            Serial.println("[ESP-NOW] Ready, peer added");
        }
    }

    void sendPacket() {
        esp_err_t err = esp_now_send(GATEWAY_MAC,
                                     (uint8_t*)&gSensorPacket,
                                     sizeof(SensorPacket));
        if (err != ESP_OK) {
            Serial.printf("[SN→GW] Send error: %d\n", (int)err);
        }
    }
};

// ต้องมีนิยามตัวแปร static
NetworkService* NetworkService::_instance = nullptr;
