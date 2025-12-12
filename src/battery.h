#ifndef BATTERY_H
#define BATTERY_H

#include <TickTwo.h>
#include "Battery18650Stats.h"

#define VIN_SENSOR 33
#define VSENSOR_EN GPIO_NUM_4

#define CHRG_PIN_DONE GPIO_NUM_5
#define CHRG_PIN_STAT GPIO_NUM_12
#define BAT_SENS GPIO_NUM_32

#define BATTERY_LOW 3
#define BATTERY_VERY_LOW 1
#define BATTERY_CHARGED 100
#define BATTERY_CHARGING 101
#define BATTERY_MEDIUM 70
#define BATTERY_HIGH 90

enum class PCBVersion
{
    PCB_V1_6,
    PCB_V1_7 
};

enum class PowerSavingMode
{
    PS_NONE,
    PS_LOW,
    PS_MEDIUM,
    PS_HIGH
};
class PowerManager
{
    Battery18650Stats battery;
    void prepareSleep();
    void internalWakeUp();
    void updatePSLevel();
    public:
    void init();
    bool updateInProgress;
    void updateBattery();
    uint batteryLevel;
    uint batteryLevelRaw;
    int vinLevel;
    bool isCharging;
    bool wifiNeeded=true;
    float updateFactor;
    uint8_t brightnessPcent;
    PowerSavingMode powerSavingMode;
    PCBVersion pcbVersion = PCBVersion::PCB_V1_6;
    std::function<void()> onCycleWakeup;
    std::function<void()> onUpdateWakeup;
    PowerManager(){
        battery = Battery18650Stats(BAT_SENS);
        isCharging = false;
        updateFactor = 1;
        brightnessPcent = 100;
        
    };

    void setPowerSavingMode(PowerSavingMode mode);
    // Events
    void cycleComplete();
    void standbyOrSleep();
};

extern PowerManager powerManager;
#endif