#ifndef LED_H
#define LED_H
#include <Arduino.h>
// #include <RGBLed.h>

#define RED_LED 23
#define GREEN_LED 22
#define BLUE_LED 21



void setupPins();
void setLedBrightness(int brightness);
void glowLed();
void glowLed(String color);
void setLedColor(int red, int green, int blue);
void blinkLed();
void ledOff();
#endif