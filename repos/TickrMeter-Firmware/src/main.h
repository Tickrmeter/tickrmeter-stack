#ifndef MAIN_H
#define MAIN_H

#include <Arduino.h>
// #include <display.h>
#include "display_func.h"
#include <EEPROM.h>
#include <freertos/task.h>
// #include "soc/rtc_io_reg.h"//needed for bug fix in XT_DAC_Audio
#include "bitmap104x212.h"
#include "secrets.h"
#include "mqtt.h"
#include "battery.h"
#include <TickTwo.h>

#define WM_STRINGS_FILE "wm_custom.h"

#pragma once
#define PROGMEM


PowerManager powerManager;

String firmware_version = FW_VERSION;
unsigned long screenupdatetime = 0; //time taken by screen to update, you can increase or decrease it according to your screen.
void setupWifi();

#endif