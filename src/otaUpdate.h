// #include <esp32fota.h>
#include <Arduino.h>

void processUpdateMsg(String url, char* deviceID);
void firmwareUpdate(String url, bool isSigned = true);
void updateFirmwareTask(void * parameter);