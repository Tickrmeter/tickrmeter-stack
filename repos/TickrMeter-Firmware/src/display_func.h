#ifndef DISPLAY_FUNC_H
#define DISPLAY_FUNC_H

#include <Arduino.h>
#include <GxEPD2_BW.h>  // Include GxEPD2 library for black and white displays
#include <Adafruit_GFX.h>  // Include Adafruit_GFX library
#include <Fonts/FreeSansBold12pt7b.h>
#include <Fonts/FreeSansBold18pt7b.h>
#include <Fonts/FreeSansBold9pt7b.h>
// #include <Fonts/FreeSansBold24pt7b.h>
#include <FreeSansBold24pt7bEuro.h>
#include "bitmap104x212.h"
#include "WiFiManager.h"
#include "mqtt.h"
#include "battery.h"
#include "secrets.h"

#define SCREEN_DRAWN_MAX 50//Flash screen after this many draws


void init_display();
void display_sleep();
void drawlogo();
void display_wifi(WiFiManager *myWiFiManager);
void displayWiFiLost(bool lost);
void drawServerConnected();
void drawServerNotConnected();
void drawWifiNotConnected();
void display_text(int color, const GFXfont font1, int x_pos,int y_pos,String text);
void displayStock(Stock stock, uint pos = 0, uint total=0);
// void display_mainscreen(String date1, String price, String symbol, String percent);
void display_regkey(String key, String valid , String mac);
void display_message(String message, String message2 = "");
void fullrefreshIfNeeded(bool forceNext);
void addCandleSticks(int count=1, bool atOnce=false);
void setCandleMessage(String message);
void drawPage(unsigned char bitmap[4662]);

// void display_firmware_update();
// const GFXfont * get_font(String font1);

#endif