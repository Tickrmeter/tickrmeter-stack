#include <led.h>
#include <Arduino.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/ledc.h"
#include "esp_err.h"
#include "esp_pm.h"
#include "esp_sleep.h"
// #include "driver/uart.h"
// #include "esp32/rom/uart.h"

// RGBLed led(RED_LED, GREEN_LED, BLUE_LED, RGBLedCOMMON_ANODE);

bool ledState;
uint8_t _brightness = 100;

uint8_t RGBLedRED[3] = {255, 0, 0};
uint8_t RGBLedGREEN[3] = {0, 255, 0};
uint8_t RGBLedBLUE[3] = {0, 0, 255};
uint8_t RGBLedMAGENTA[3] = {255, 0, 255};
uint8_t RGBLedCYAN[3] = {0, 255, 255};
uint8_t RGBLedYELLOW[3] = {255, 255, 0};
uint8_t RGBLedWHITE[3] = {255, 255, 255};

uint8_t ledPINS[3] = {RED_LED, GREEN_LED, BLUE_LED};
// current values
uint8_t currentColor[3] = {0, 0, 0};//color without brightness
uint8_t _red;//color with brightness
uint8_t _green;
uint8_t _blue;

ledc_channel_config_t ledc_channel[3];

void setupPWM()
{
  ledc_timer_config_t ledc_timer;
  ledc_timer.duty_resolution = LEDC_TIMER_8_BIT; // resolution of PWM duty
  ledc_timer.freq_hz = 100;                      // frequency of PWM signal
  ledc_timer.speed_mode = LEDC_LOW_SPEED_MODE;   // timer mode
  ledc_timer.timer_num = LEDC_TIMER_0;           // timer index
  ledc_timer.clk_cfg = LEDC_USE_RTC8M_CLK;       // Force source clock to RTC8M
  ledc_timer_config(&ledc_timer);
  // configure every channels:

  for (int i = 0; i < 3; i++)
  {
    ledc_channel[i].channel = (ledc_channel_t) i;
    ledc_channel[i].duty = 0;
    ledc_channel[i].gpio_num = ledPINS[i];
    ledc_channel[i].speed_mode = LEDC_LOW_SPEED_MODE;
    ledc_channel[i].hpoint = 0;
    ledc_channel[i].timer_sel = LEDC_TIMER_0;
    ledc_channel_config(&ledc_channel[i]);
  }
}


void setLedColor(int red, int green, int blue)
{
  log_d("Set color to %u %u %u and brightness %u\n", red, green, blue, _brightness);

  currentColor[0] = red;
  currentColor[1] = green;
  currentColor[2] = blue;

  _red = red;
  _green = green;
  _blue = blue;

  uint8_t cred = (red * _brightness) / 100;
  uint8_t cgreen = (green * _brightness) / 100;
  uint8_t cblue = (blue * _brightness) / 100;


  if (cred >0){
    ledc_set_duty(LEDC_LOW_SPEED_MODE, (ledc_channel_t)0, 255 - cred);
    ledc_update_duty(LEDC_LOW_SPEED_MODE, (ledc_channel_t)0);
  }
  else{
    
    ledc_stop(LEDC_LOW_SPEED_MODE, (ledc_channel_t)0, HIGH);
  }

  if (cgreen >0){
    ledc_set_duty(LEDC_LOW_SPEED_MODE, (ledc_channel_t)1, 255 - cgreen);
    ledc_update_duty(LEDC_LOW_SPEED_MODE, (ledc_channel_t)1);
  }
  else{
    ledc_stop(LEDC_LOW_SPEED_MODE, (ledc_channel_t)1, HIGH);
  }
  if (cblue >0){
    ledc_set_duty(LEDC_LOW_SPEED_MODE, (ledc_channel_t)2, 255 - cblue);
    ledc_update_duty(LEDC_LOW_SPEED_MODE, (ledc_channel_t)2);
  }
  else{
    ledc_stop(LEDC_LOW_SPEED_MODE, (ledc_channel_t)2, HIGH);
  }
  
}

void glowLed(uint8_t color[3], int brightness)
{
  // log_d("Set brightness to %u\n", brightness);
  _brightness = brightness;
  setLedColor(color[0], color[1], color[2]);
}

void setLedBrightness(int brightness)
{
  log_d("Set brightness to %u\n", brightness);
  _brightness = brightness;
  setLedColor(_red, _green, _blue);//If commented, the led will not change color when brightness is changed in the app
}



uint8_t *getColor(String color)
{
  if (color == "red")
  {
    return RGBLedRED;
  }
  if (color == "green")
  {
    return RGBLedGREEN;
  }
  if (color == "blue")
  {
    return RGBLedBLUE;
  }
  if (color == "purple" || color == "magenta" || color == "pink" || color == "violet")
  {
    return RGBLedMAGENTA;
  }
  if (color == "cyan")
  {
    return RGBLedCYAN;
  }
  if (color == "yellow")
  {
    return RGBLedYELLOW;
  }
  if (color == "white")
  {
    return RGBLedWHITE;
  }

  //support for #RRGGBB
  if (color.length() == 7 && color[0] == '#')
  {
    uint8_t red = strtoul(color.substring(1, 3).c_str(), NULL, 16);
    uint8_t green = strtoul(color.substring(3, 5).c_str(), NULL, 16);
    uint8_t blue = strtoul(color.substring(5, 7).c_str(), NULL, 16);
    uint8_t *rgb = new uint8_t[3]{red, green, blue};
    return rgb;
  }

  return RGBLedWHITE;
}



void glowLed(String color)
{
  glowLed(getColor(color), _brightness);
}

void glowLed()
{
  glowLed(currentColor, _brightness);
}

void ledOff()
{
    ledc_stop(LEDC_LOW_SPEED_MODE, (ledc_channel_t)0, HIGH);
    ledc_stop(LEDC_LOW_SPEED_MODE, (ledc_channel_t)1, HIGH);
    ledc_stop(LEDC_LOW_SPEED_MODE, (ledc_channel_t)2, HIGH);
}

void blinkLed()
{
  if (ledState == LOW)
  {
    glowLed();
  }
  else
  {
    ledOff();
  }
  ledState = !ledState;
}

void setupPins()
{
  pinMode(17, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(19, OUTPUT);
  digitalWrite(19, LOW);

  // pinMode(RED_LED, OUTPUT);
  // digitalWrite(RED_LED, HIGH);
  // pinMode(BLUE_LED, OUTPUT);
  // digitalWrite(BLUE_LED, HIGH);
  // pinMode(GREEN_LED, OUTPUT);
  // digitalWrite(GREEN_LED, HIGH);
  setupPWM();
  setLedColor(0, 0, 0); // turn off all LEDs
}