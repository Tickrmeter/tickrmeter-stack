#include "battery.h"
#include <Arduino.h>
#include <display_func.h>
#include <esp_sleep.h>
#include <tickrwifi.h>
#include <mqtt.h>
#include <led.h>
// #define DEBUGMODE

bool show_battery = false;
unsigned long batteryMillis;

static int emergencyBatteryThreshold = 7; // Start strict at boot, then becomes lenient

u32_t chargingModeDelay = 0;

void PowerManager::updateBattery()
{
#ifdef DEBUGMODE
  isCharging = false;
  batteryLevel = 50;
  updatePSLevel();

  return;
#endif
  log_i("Updating battery level");
  digitalWrite(VSENSOR_EN, HIGH);
  delay(150);
  batteryLevelRaw = battery.getBatteryChargeLevel();
  if (batteryLevel == 0)
  {
    batteryLevel = batteryLevelRaw;
  }
  else
  {
    batteryLevel = (batteryLevel * 0.8F + batteryLevelRaw * 0.2F); // Smooth the battery level
  }
  vinLevel = analogRead(VIN_SENSOR); // VIN is poluted by the battery
  // digitalWrite(4, LOW);
  delay(100);
  if (chargingModeDelay > millis() || vinLevel < 2500)
  {
    isCharging = false; // fake non charging mode in case of weak power supply
    log_d("Fake non charging mode");
  }
  else
  {
    // check GPIO 37 5 times to be sure
    isCharging = vinLevel > 2500;
    // for (int i = 0; i < 5; i++)
    // {
    //   isCharging = isCharging || analogRead(37) > 2000; // hack to detect charging. For some reason, this goes high when charging.
    //   delay(50);
    // }
    log_d("Real charging mode: analog 37: %d, vin: %d, isCharging: %d", analogRead(37), vinLevel, isCharging);
  }
  // debug
  //  batteryLevel = 29;
  //  isCharging = false;
  // end debug
  log_i("Battery level: %d, Charging: %d, vin: %d", batteryLevel, isCharging, vinLevel);
  updatePSLevel();
  if (isCharging)
  {
    log_d("Charging mode, forcing wifi");
    wifiNeeded = true;
  }
}

void PowerManager::init()
{
  // trick for version 1.6 to detect if charging
  gpio_set_direction(GPIO_NUM_37, GPIO_MODE_INPUT);
  gpio_set_pull_mode(GPIO_NUM_37, GPIO_PULLUP_ONLY);

  // determine the PCB version: put VSENSOR_EN to LOW and check if there is a voltage BAT_SENS, if yes, it's a V1.6, else it's a V1.7
  pinMode(VSENSOR_EN, OUTPUT);
  digitalWrite(VSENSOR_EN, LOW);
  delay(50);
  int voltage = analogRead(BAT_SENS);
  log_i("Voltage on BAT_SENS: %d", voltage);
  if (voltage > 50)
  {
    powerManager.pcbVersion = PCBVersion::PCB_V1_6;
    log_i("PCB version: V1.6");
  }
  else
  {
    powerManager.pcbVersion = PCBVersion::PCB_V1_7;
    log_i("PCB version: V1.7");
  }
}

void PowerManager::updatePSLevel()
{
  if (isCharging || batteryLevel >= 90)
  {
    setPowerSavingMode(PowerSavingMode::PS_NONE);
    return;
  }
  // we should not trust the isCharging flag
  else if (batteryLevel <= emergencyBatteryThreshold && !isCharging && vinLevel < 2500)
  {
    log_i("Battery is very low, going to sleep");
    display_sleep();
    ledOff();
    //   // esp_sleep_enable_ext0_wakeup(GPIO_NUM_37, 1);
    //   esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);
    //   esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);
    //   esp_deep_sleep_start();
    // }
    // else if ( batteryLevel <= 3 && !isCharging && vinLevel < 2500)
    // {
    //   log_i("Displaying sleep message");
    //   display_sleep();
    //   ledOff();
    pinMode(GPIO_NUM_37, INPUT);
    esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);
    gpio_wakeup_enable(GPIO_NUM_37, GPIO_INTR_HIGH_LEVEL);
    esp_sleep_enable_gpio_wakeup();

    delay(1000);
    esp_light_sleep_start();
    esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
    log_i("Wakeup reason: %d", wakeup_reason);
    esp_restart();
  }
  else if (batteryLevel <= 10)
  {
    setPowerSavingMode(PowerSavingMode::PS_HIGH); // No light, further reduced frequency
  }
  // else if (batteryLevel <= 50)
  // {
  //   setPowerSavingMode(PowerSavingMode::PS_MEDIUM); // reduced light and frequency
  // }
  else
  {
    setPowerSavingMode(PowerSavingMode::PS_LOW); // Sleeping only
  }

  // set emergencyBatteryThreshold to running value
  emergencyBatteryThreshold = 1;

}

//**************************************************************************************************
// POWERMANAGER CLASS FUNCTIONS
//**************************************************************************************************

// Function called before going to sleep
// It will turn off wifi and go to sleep for the time remaining until the next event
void PowerManager::prepareSleep()
{

  // check if there are new messages for us to process
  //  loopClient()){
  // if there are, we should not go to sleep
  //  log_i("New messages just processed, not going to sleep");
  //  return;
  // }

  if (powerSavingMode == PowerSavingMode::PS_NONE)
  {
    log_i("Plugged in, not need to sleep");
    return; // No need to prepare sleep
  }

  int32_t sleepDuration = 0;
  bool wifiAtWakeup = false;
  // see when is the next event:

  // log the status of the timers:
  //  log_i("Blink timer: %d, Cycle timer: %d, Update timer: %d", blinkTimer.state(), cycleTimer.state(), updateTimer.state());
  // and their remaining time

  // if any of the timers is due, we should not go to sleep
  if ((cycleTimer.state() == RUNNING && cycleTimer.remaining() <= 0) ||
      (updateTimer.state() == RUNNING && updateTimer.remaining() <= 0))
  {
    log_i("One of the timers is due, not going to sleep");
    return;
  }

  log_i("Cycle timer remaining: %d, Update timer remaining: %d", cycleTimer.remaining(), updateTimer.remaining());
  if (updateTimer.remaining() < cycleTimer.remaining() || cycleTimer.state() != RUNNING)
  {
    sleepDuration = updateTimer.remaining();
    wifiAtWakeup = true;
  }
  else if (cycleTimer.state() == RUNNING)
  {
    log_i("Cycle timer is running, sleep for cycle timer: %d", cycleTimer.remaining());
    sleepDuration = cycleTimer.remaining();
    if (sleepDuration <= 0)
    {
      log_i("Cycle timer is due, not going to sleep");
      return;
    }
  }

  if (sleepDuration <= 0)
  {
    log_i("Sleep duration is 0, not going to sleep");
    return;
  }

  int32_t wakeUpTime = millis() + sleepDuration;
  //  Turn off wifi
  turnOffWifi();

  log_i("Going to sleep for %d seconds", sleepDuration / 1000); // convert to seconds
  Serial.flush();

  // if we are blinking, ie the blink timer is running
  if (blinkTimer.state() == RUNNING)
  {
    log_d("Blink timer is running, only sleep for blink timer");
    while (millis() < wakeUpTime)
    {
      // sleep until the blink timer is due
      log_d("Sleeping for Blink timer remaining %d", blinkTimer.remaining());
      esp_sleep_enable_timer_wakeup(blinkTimer.remaining() * 1000L); // convert to microseconds
      esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_ON);

      // start light sleep... Zzzzzzzzzzz
      // make sure the GPIO is maintained high during sleep
      gpio_hold_en(VSENSOR_EN);

      esp_err_t res = esp_light_sleep_start();

      while (blinkTimer.remaining() > 0)
      {
        log_d("Blink timer remaining %d", blinkTimer.remaining());
        yield();
      }
      log_d("Blink timer done");
      blinkTimer.update();
    }
  }
  else
  {
    log_d("Blink timer is not running, sleep for the full duration");
    // Sleeping
    //  gpio_wakeup_enable(GPIO_NUM_37, GPIO_INTR_HIGH_LEVEL);

    if (chargingModeDelay > millis())
    { // avoid waking up by gpio is PSU unreliable
      log_d("Charging mode delay is not over, not enabling gpio wakeup");
      esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);
    }
    else
    {
      log_d("enabling gpio wakeup");
      pinMode(GPIO_NUM_37, INPUT);
      gpio_wakeup_enable(GPIO_NUM_37, GPIO_INTR_HIGH_LEVEL);
      if (esp_sleep_enable_gpio_wakeup() == ESP_OK)
      {
        log_d("gpio wakeup enabled");
      }
      else
      {
        log_d("gpio wakeup not enabled");
      }
      // esp_sleep_enable_ext0_wakeup(GPIO_NUM_37, 1);
    }
    // esp_sleep_enable_ext0_wakeup(GPIO_NUM_37, 1);
    Serial.flush();
    esp_sleep_enable_timer_wakeup(sleepDuration * 1000L); // convert to microseconds
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_ON);

    uint32_t sleepTime = millis();
    // make sure the GPIO is maintained high during sleep
    gpio_hold_en(VSENSOR_EN);

    // start light sleep... Zzzzzzzzzzz
    esp_err_t res = esp_light_sleep_start();
    log_i("Woke up with result %d", res);
    // reason for wakeup
    esp_sleep_wakeup_cause_t wakeup_reason;
    wakeup_reason = esp_sleep_get_wakeup_cause();
    log_i("Wakeup reason: %d", wakeup_reason);

    // if we woke up because of the gpio, we should check if it is after a short time.
    // if (true || wakeup_reason == ESP_SLEEP_WAKEUP_GPIO)
    log_i("Woke up because of GPIO 37");
    if (millis() - sleepTime < 3000)
    {
      log_i("Woke up after less than 3 seconds: disabling gpio wakeup for 5min");
      // set the gpio as input
      chargingModeDelay = millis() + 300000;
    }
    // // set the gpio as input
    // pinMode(GPIO_NUM_37, INPUT);

    // u8_t l1 = gpio_get_level(GPIO_NUM_37);
    // log_d("l1: %d", l1);
    // delay(500);
    // u8_t l2 = gpio_get_level(GPIO_NUM_37);
    // log_d("l2: %d", l2);

    // if ( l2 == 0)
    // {
    //   log_i("GPIO dropped to 0. Consider we are NOT charging for next 5 min.");
    //   log_d("GPIO 37: %d", analogRead(37));
    //   chargingModeDelay = millis() + 300000;
    // }
  }

  // Waking up!

  // relaunch the fading once we wake up
  // if (powerSavingMode == PowerSavingMode::PS_MEDIUM)
  // {
  // log_d("Waking up from fading");
  // fadeToBlack();
  // }

  if (wifiAtWakeup || updateTimer.remaining() < 1)
  {
    connectWifi();
    wifiNeeded = true;
    reconnectMqtt();
  }
  else
  {
    log_i("Wifi not needed!");
    wifiNeeded = false;
  }

  internalWakeUp();

  if (onCycleWakeup != nullptr)
    onCycleWakeup();
}

void PowerManager::internalWakeUp()
{
  updateBattery();
}

void PowerManager::setPowerSavingMode(PowerSavingMode mode)
{
  powerSavingMode = mode;
  switch (mode)
  {
  case PowerSavingMode::PS_NONE:
  case PowerSavingMode::PS_LOW:
    log_i("Power saving mode: %s", (mode == PowerSavingMode::PS_NONE) ? "none" : "low");
    updateFactor = 1;
    brightnessPcent = 100;
    break;
  case PowerSavingMode::PS_MEDIUM:
    log_i("Power saving mode: medium");
    updateFactor = 1.5;
    brightnessPcent = 25;
    break;
  case PowerSavingMode::PS_HIGH:
    log_i("Power saving mode: high");
    updateFactor = 3;
    brightnessPcent = 0;
    break;
  }
}

void PowerManager::cycleComplete()
{
  // light sleep for cycleInterval
  // if (updateInProgress)
  // {
  //   log_i("Update in progress, not going to sleep");
  //   return;
  // }
  if (powerSavingMode == PowerSavingMode::PS_NONE)
  {
    return; // No need to sleep
  }
  prepareSleep();
}

void PowerManager::standbyOrSleep()
{
  if (!device_configured || isCharging || powerSavingMode == PowerSavingMode::PS_NONE)
  {
    log_i("Unassigned, Plugged in or high power, not going to sleep");
    return; // No need to sleep
  }
  // Wifi can now be turned off
  prepareSleep();
}
