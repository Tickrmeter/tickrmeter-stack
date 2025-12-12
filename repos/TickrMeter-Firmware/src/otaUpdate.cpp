#include <otaUpdate.h>
#include <esp32fota.h>
#include <secrets.h>
#include <display_func.h>
#include <esp_task_wdt.h>
#include <led.h>


void fwupdateCompleted(int partition, bool restart_after)
{
  Serial.printf("Update completed on %s partition\n", partition==U_SPIFFS ? "spiffs" : "firmware");
  display_message("Update completed!","Restarting...");
  delay(5000);
  if( restart_after ) {
      ESP.restart();
  }
}


void processUpdateMsg(String url, char* deviceID){
    url = url + "/" + String(deviceID) + "/signed";
    //replace https by http
    // url.replace("https", "http");
    log_i("Base firmware update url: %s", url.c_str());
    //prepare task handle
    TaskHandle_t updateFirmwareTaskHandle = NULL;

    //get current task core:
    BaseType_t xCoreID = xPortGetCoreID();
    //select the other core:
    if (xCoreID == 0)
    {
      xCoreID = 1;
    }
    else
    {
      xCoreID = 0;
    }

    esp_task_wdt_init(15,0);// 15 seconds timeout

    //create esp32 task for firmware update
    xTaskCreatePinnedToCore(
      updateFirmwareTask, /* Task function. */
        "firmwareUpdateTask", /* name of task. */
        10000,                /* Stack size of task */
        (void *)url.c_str(),  /* parameter of the task */
        1,                    /* priority of the task */
        &updateFirmwareTaskHandle, /* Task handle to keep track of created task */
        xCoreID);                       /* pin task to core 0 */
    ledOff();
    // firmwareUpdate(url);
    while(true){
      yield();
      delay(200);
      //check if task is still running
      if (eTaskGetState(updateFirmwareTaskHandle) == eDeleted)
      {
        log_i("Firmware update task finished");
        esp_task_wdt_init(5,0);
        break;
      }
    }
}


//task for updating firmware
void updateFirmwareTask(void * parameter)
{
  String url = (char *)parameter;
  Serial.println("Updating firmware...");
  display_message("Firmware updating...", "Keep the device plugged in!\nIt can take up to 10 minutes.");
  firmwareUpdate(url, true);
  vTaskDelete(NULL);
}

void updateStartFailed(int partition)
{
  log_e("Update start failed error");

  display_message("Update failed", "Partition error. Restarting...");
  delay(5000);
  ESP.restart();
}

void updateCheckFailed(int partition, int error)
{
  log_e("Update failed error: %d", error);

  display_message("Update failed", "SIG err. Restarting...");
  delay(5000);
  ESP.restart();
}

void updateProgresscb(int progress, int total)
{
  setLedColor(255, 255, 255);
  blinkLed();
  // Serial.printf("Progress: %d%%\n", (progress * 100) / total);
  // display_message("Firmware updating...", "Keep the device plugged in!\nIt can take up to 10 minutes.");
  // delay(1000);
}

void firmwareUpdate(String url, bool isSigned )
{
  esp32FOTA fwOTA;
  
  //set config
  FOTAConfig_t config;
  config.unsafe=true; //allow for untrusted certificates until we set up the CA cert
  fwOTA.setConfig(config);
  if (isSigned)
    fwOTA.setPubKey(RSASign);
  fwOTA.setExtraHTTPHeader("Origin", HTTP_ORIGIN);
  fwOTA.setUpdateCheckFailCb(updateCheckFailed);
  fwOTA.setProgressCb(updateProgresscb);
  fwOTA.setUpdateFinishedCb(fwupdateCompleted);
  fwOTA.forceUpdate(url.c_str(), isSigned);
  
}