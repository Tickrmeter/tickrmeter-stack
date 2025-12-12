#include "main.h"
#include "led.h"
#include "tickrwifi.h"
#include "xmc_lock_sr.h"
// keep boot count in eeeprom
#include <EEPROM.h>

#define EEPROM_SIZE 32
uint8_t bootCount = 0;
char chipID[13];
int lockres=-2;//return value of xmc_check_lock_sr(false); -2 means not initialized. Good value is 0


char loglbuf[1024]="";

void initEEPROM()
{
  log_i("Initializing EEPROM");
  EEPROM.begin(EEPROM_SIZE);
  log_i("EEPROM initialized");
  uint8_t ref = EEPROM.read(0);

  if (ref != 0x42)
  {
    log_i("EEPROM not initialized");
    EEPROM.write(0, 0x42);
    EEPROM.write(1, 0);
    EEPROM.commit();
    return;
  }
}

void readEEPROM()
{
  bootCount = EEPROM.read(1);
  if (bootCount > 3)
  {
    EEPROM.write(1, 0);
    EEPROM.commit();
    init_display();
    setupPins();
    resetAndAP();
  }
  else
  {
    EEPROM.write(1, ++bootCount);
    EEPROM.commit();
    log_i("Boot count: %d", bootCount);
  }
}

void resetBootCount()
{
  EEPROM.write(1, 0);
  EEPROM.commit();
  log_i("Boot count reset");
}

void setup()
{
  Serial.begin(115200);
  log_i("Starting TickrMeter");
  lockres = xmc_check_lock_sr(false);
  initEEPROM();
  init_display();
  setupPins();
  powerManager.init();
  powerManager.updateBattery();

    //turn on boot led: blue for p500 (INNER_VERSION "p500"), white for main
  if (INNER_VERSION == "p500")
    setLedColor(0, 0, 255); // blue
  else
    setLedColor(255, 255, 255); // white


#ifndef FASTSTART  
  // delay(500);
  readEEPROM();
  log_i("Firmware Version : %s", firmware_version.c_str());
  log_i("displaying TickrMeter logo");
  drawlogo();
  WiFi.mode(WIFI_STA);
  WiFi.scanNetworks(1);
  addCandleSticks();
  setCandleMessage("Waking up...");
  addCandleSticks(6);
  resetBootCount();
  checkFunctionAP();

  //check if we have a saved wifi
  if (WiFi.SSID() != ""){
    setCandleMessage("Connecting to saved wifi...");
  }
  else
  {
    setCandleMessage("Preparing Wifi setup...");
  }
 
  addCandleSticks(3);
#endif
  setupWifi();
  addCandleSticks(2);
  setCandleMessage("Wifi connected!");
  addCandleSticks(2);
  setCandleMessage("Connecting to markets...");
  addCandleSticks(2);
  reconnectMqtt();
  addCandleSticks(4);
  create_json_objects();
  addCandleSticks(2);
  log_mqtt(loglbuf);
}

int i = 0;

void loop()
{
  if (i++ > 1000)
  {
    i = 0;
    Serial.print(".");
  }

  // MQTT loop
  if (powerManager.isCharging || powerManager.wifiNeeded)
  { // loopClient() will connect to wifi if needed
    loopClient();
  }
  updateTimer.update();
  cycleTimer.update();
  blinkTimer.update();
  timeoutTimer.update();
  registrationTimer.update();

  if (!(powerManager.isCharging||powerManager.powerSavingMode == PowerSavingMode::PS_NONE)                                               // not charging AND:
      && (device_configured)
      && (timeoutTimer.state() != RUNNING)                                  // not waiting for an update
      && (updateTimer.state() != RUNNING || updateTimer.remaining() > 5000) // update timer is not running or more than 5 second remaining
      && (cycleTimer.state() != RUNNING || cycleTimer.remaining() > 5000)   // cycle timer is not running or more than 5 second remaining
  )
  {
    log_i("Not waiting for anything, going to sleep");
    updateCompleted();
  }
}