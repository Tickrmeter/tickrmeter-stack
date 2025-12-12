#include <mqtt.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>
#include <display_func.h>
#include <battery.h>
#include <led.h>
#include <secrets.h>
#include <otaUpdate.h>
#include "alert.h"
#include <tickrwifi.h>
#include <page.h>

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

bool reconnected = false;
bool WifiConnected = false;

extern u16_t wifiLostCount;

TickTwo updateTimer(requestUpdate, 10000, 0, MILLIS);
TickTwo cycleTimer(cyclePlaylist, 10000, 0, MILLIS);
TickTwo blinkTimer(blinkLed, 300, 0, MILLIS);
TickTwo timeoutTimer(timeoutUpdate, 10000, 0, MILLIS);
// registrationTimeout is set to 15 minutes in setup
TickTwo registrationTimer(registrationTimeoutCallback, 15 * 60 * 1000, 0, MILLIS);

char ota_topic[28]; // RBE 14+1+12=27 FIRMWAREUPDATE/12bb12bb12bb12bb -> It doesn't fit!!
char alert_topic[25];

char JSONmsgUpdateNoSymb[100];
char JSONmsgBootMsg[100];
char JSONmsgUpdateWithSymb[150];
char JSONmessageBufferheartbeat[200];

static PlaylistConfig currentPlaylist;
static Stock currentStock = Stock();

extern char chipID[13];

char deviceID[13];
bool device_configured;
bool onPlaylist = false;
bool gotBootMsg = false;

bool pageMode = false;

int brightness = 0;

u_long lastHeartbeat = 0;



String asString(ArduinoJson::JsonVariant variant){
    if (variant.as<String>() == "null")
    {
        return "";
    }
    return variant.as<String>();
}

void log_mqtt(const char *format, ...)
{
  //create a buffer
  char buf[1024];
  char *p = buf;
  //initialize the buffer
  buf[0] = '\0';
  //format the buffer
  va_list argptr;
  va_start(argptr, format);
  p += vsprintf(p, format, argptr);
  va_end(argptr);
  //send it
  mqttClient.publish(String("LOG/"+String(deviceID)).c_str(), buf);
}

void sendHeartBeatMsg(bool force = false)
{
  log_d("Sending heartbeat message");
  powerManager.updateBattery();

  if (!force && millis() - lastHeartbeat < 30000 && lastHeartbeat != 0)
  {
    log_i("Heartbeat too soon, returning. Last heartbeat was %d ", lastHeartbeat);

    return;
  }
  lastHeartbeat = millis();
  snprintf(JSONmessageBufferheartbeat, sizeof(JSONmessageBufferheartbeat),
           "{\"status\":\"online\",\"firmware_version\":\"%s\",\"device\":\"%s\",\"battery\":\"%d\",\"vin\":\"%d\",\"uptime\":\"%d\",\"isCharging\":\"%d\",\"wflct\":\"%d\",\"iv\":\"%s\", \"xmc\":\"%d\", \"flashID\":\"%s\"}",
           firmware_version.c_str(),
           deviceID,
           powerManager.batteryLevel,
           powerManager.vinLevel,
           millis() / 1000,
           powerManager.isCharging
           , wifiLostCount, INNER_VERSION,
           lockres,
           chipID);
  mqttClient.publish("DEVICESTATUS_RES", JSONmessageBufferheartbeat);
  log_i("Hearbeat message sent: %s", JSONmessageBufferheartbeat);
}

void Stock::requestUpdate()
{
  reconnectMqtt();//should not be needed, but just in case
  log_i("Requesting symbol update");
  snprintf(JSONmsgUpdateWithSymb, sizeof(JSONmsgUpdateWithSymb),
           "{\"type\":\"UPDATE\",\"device\":\"%s\"}",
           deviceID);
  mqttClient.publish("STOCKPRICEUPDATE", JSONmsgUpdateWithSymb);
  log_i("Requested single object update: %s", JSONmsgUpdateWithSymb);
    
}

void cyclePlaylist()
{
  log_i("Cycling playlist triggered!");
  if (!onPlaylist)
  {
    log_i("Not on playlist, returning");
    return;
  }
  currentPlaylist.nextStock();
  updateDisplay();
  powerManager.cycleComplete();
}

void updateCompleted()
{

  if (onPlaylist && cycleTimer.state() != RUNNING)
  {
    log_i("Resuming cycle timer");
    cycleTimer.resume();
    cycleTimer.update();
  }
  timeoutTimer.stop();
  log_i("Playlist or Single Update completed");
  // if (!readyToSleep){//On the first call, we just set a flag to indicate we're ready to sleep
  //   readyToSleep = true;
  //   return;
  // }
  // //On a second call, we actually go to sleep
  // readyToSleep = false;
  // log_i("Update completed and display updated, going to sleep");

  // powerManager.updateInProgress = false;
  powerManager.standbyOrSleep();
}



void requestUpdate()
{
  log_i("updateTimer triggered");
  powerManager.updateInProgress = true;
  timeoutTimer.start();
  if (onPlaylist)
  {
    log_i("Requesting playlist update");
    requestPlaylistUpdate();
  }
  else
  {
    log_i("Requesting single stock update");
    currentStock.requestUpdate();
    currentPlaylist.updateCount = 1;
  }
  sendHeartBeatMsg(); // send heartbeat message while we have connection
}


void requestPlaylistUpdate()
{
  // Request single update in case we a not on a playlist anymore
  currentStock.requestUpdate();

  log_i("Requesting playlist update, stock count: %d", currentPlaylist.stockCount);
  // request update for each stock in the currentplaylist

  for (int i = 0; i < currentPlaylist.stockCount; i++)
  {
    snprintf(JSONmsgUpdateWithSymb, sizeof(JSONmsgUpdateWithSymb),
             "{\"type\":\"UPDATE\",\"device\":\"%s\",\"symbol\":\"%s\"}",
             deviceID,
             currentPlaylist.stocks[i].name.c_str());
    mqttClient.publish("STOCKPRICEUPDATE", JSONmsgUpdateWithSymb);
    delay(300);//Give the broker (and the API) a chance to process the message
    log_i("Requested playlist object update: %s", JSONmsgUpdateWithSymb);
  }
  currentPlaylist.updateCount = currentPlaylist.stockCount + 1;//We need to wait for the playlist update + all the stock updates
  log_i("Cycle timer is in %d seconds", cycleTimer.remaining() / 1000);
  if (cycleTimer.remaining() < 2000)
  {
    log_i("Pausing cycle timer");
    cycleTimer.pause();
  }
  //start timeout timer
  timeoutTimer.start();

}

void registrationTimeoutCallback()
{
  registrationTimer.stop();
  // if we are not charging, go to deep sleep
  display_message("Registration timed out", "Rebooting...");
  delay(8000);
  ESP.restart();
}

void timeoutUpdate()
{
  if (!gotBootMsg)
  {
    log_i("Boot message not received, resending");
    create_json_objects();
    return;
  }
  log_i("Update timed out. Missing %d updates!!", currentPlaylist.updateCount);
  currentPlaylist.updateCount = 0;
  timeoutTimer.stop();

  updateCompleted();
}

// Subscribe to all topics
void sub_mqtt()
{
  sendHeartBeatMsg();
  mqttClient.subscribe(deviceID, 1);
  mqttClient.subscribe("DEVICESTATUS");
  // mqttClient.subscribe("FIRMWAREUPDATE"); // RBE: Warning, we are subscribing to 'FIRMWAREUPDATE'. If a message goes here, every devices will upgrade

  snprintf(ota_topic, sizeof(ota_topic), "FIRMWAREUPDATE/%s", deviceID);
  log_i("Subscribed to OTA topic: %s", ota_topic);
  mqttClient.subscribe(ota_topic);

  snprintf(alert_topic, sizeof(alert_topic), "ALERT/%s", deviceID);
  log_i("Subscribed to alarms topic: %s", alert_topic);
  mqttClient.subscribe(alert_topic);
}

void create_json_objects()
{
  log_d("sendin boot message!");
  snprintf(JSONmsgUpdateNoSymb, sizeof(JSONmsgUpdateNoSymb), "{\"type\":\"UPDATE\",\"device\":\"%s\"}", deviceID);
  snprintf(JSONmsgBootMsg, sizeof(JSONmsgBootMsg), "{\"type\":\"BOOT\",\"device\":\"%s\"}", deviceID);
  mqttClient.publish("TICKRMETERBOOT", JSONmsgBootMsg);
  // mqttClient.publish("STOCKPRICEUPDATE", JSONmsgUpdateNoSymb);//No need it's done with TICKRMETERBOOT
  sendHeartBeatMsg();
  timeoutTimer.start();
  // currentPlaylist.onPlaylistUpdated = updateCompleted;
}

void updateLed(Stock stock)
{
  if (stock.isAlertTriggered()) // This should be moved to the alert class
  {
    log_i("Alert triggered");
    stock.alertConfig.lightBarColor.toLowerCase(); // convert to lowercase
    log_i("color for alert: %s", stock.alertConfig.lightBarColor.c_str());
    
    if ((powerManager.brightnessPcent * brightness) ==0){
      setLedBrightness(max(50,brightness));//in case it was turned to 0 by the power manager or by setting
    }
    glowLed(stock.alertConfig.lightBarColor); // will set the color of the light bar to the color of the alert
    if (stock.alertConfig.flashLightbar)
    {                     // if flashLightbar is true, start the blink timer
      blinkTimer.start(); // start the blink timer
    }
    else
    {
      blinkTimer.stop(); // if flashLightbar is false, stop the blink timer
    }
  }
  else if (stock.ledColor != "" )// if the stock has a color, set it
  {
    log_i("Stock has a color: %s", stock.ledColor.c_str());
    glowLed(stock.ledColor);
    blinkTimer.stop(); // stop the blink timer
  }
  else
  {
    log_i("Alert not triggered");
    blinkTimer.stop(); // No alert, stop the blink timer
                       // if percent change contains + , turn green, if -, turn red
    setLedBrightness(powerManager.brightnessPcent * brightness / 100);//in case it was turned to 100 by an alert
    log_d("Percent change: %s", stock.percent.c_str());
    if (stock.percent.indexOf("+") >= 0)
    {
      log_d("Percent change contains +");
      glowLed("green");
    }
    else if (stock.percent.indexOf("-") >= 0)
    {
      log_d("Percent change contains -");
      glowLed("red");
    }
    else // if no + or -, turn white
    {
      log_i("Percent change contains neither + or -");
      glowLed();
    }
  }
}

void updateDisplay()
{
  log_i("Updating display");
  if (onPlaylist)
  {
    if (currentPlaylist.stockCount > 0)
    {
      log_i("Stock symbol: %s", currentPlaylist.getStock().symbol.c_str());
      if (currentPlaylist.getStock().symbol != "")
      {
        displayStock(currentPlaylist.getStock(), currentPlaylist.index, currentPlaylist.stockCount);
        updateLed(currentPlaylist.getStock());
      }
      else
      {
        log_e("Stock symbol is empty!!");
      }
    }
  }
  else
  {
    if (currentStock.symbol != "")
    {
      displayStock(currentStock);
      // check is alert is triggered
      updateLed(currentStock);
    }
  }
}

void callback(char *topic, byte *message, unsigned int length)
{
  log_i("Message arrived on topic: %s", topic);

  DynamicJsonDocument parsed(1024);
  DeserializationError error = deserializeJson(parsed, message, length);

  if (error) // Check for errors in parsing
  {
    log_e("Parsing failed: %s", error.f_str());
    // print mqtt message to serial monitor
    Serial.print("Message: ");
    for (int i = 0; i < length; i++)
    {
      Serial.print((char)message[i]);
    }
    return;
  }
  
  // print mqtt JSON message to serial monitor
  serializeJsonPretty(parsed, Serial);

  if (String(topic) == deviceID) // A new message arrived for us.
  {
    gotBootMsg = true;
    unsigned int StringLength;

    String type1 = parsed["type"];
    onPlaylist = parsed["isPlaylist"];
    String symbol = parsed["symbol"];
    String symbols = parsed["symbols"];
    brightness = parsed["ledBrightness"];

    // manage brightness
    // debugging, no light it's late!
    // setLedBrightness(0);
    //check if LedBrightness is set in the message
    if (parsed.containsKey("ledBrightness"))
    {
      setLedBrightness(powerManager.brightnessPcent * brightness / 100);
      log_i("Setting brightness to %d pc *%d", powerManager.brightnessPcent, brightness);
    }

    // check if we have a force refresh
    if (parsed.containsKey("forceRefresh"))
    {
      if (parsed["forceRefresh"] != 0)
      {
        log_i("Force refresh requested");
        fullrefreshIfNeeded(true);
      }
    }

    if (!onPlaylist)
    {
      log_d("cycleInterval: %d", parsed["cycleInterval"].as<int>());
    }

    if (parsed["mode"] == "page")
    {
      if (!pageMode){
        fullrefreshIfNeeded(true);
        pageMode = true;
      }
      //ex of message:
      //{"mode":"page","page":[{"id":1,"ledColor":"green"}],"updateInterval":"300","ttl":3091}
      device_configured = true;

      //stop all timers
      updateTimer.stop();
      cycleTimer.stop();
      timeoutTimer.stop();

      log_i("Page mode received");
      
      uint interval = min(parsed["updateInterval"].as<int>(), parsed["ttl"].as<int>() + (int) random(0,10))  * 1000;
      if (interval == 0)//if interval is 0, set it to 10 seconds
      {
        log_i("Interval is 0, setting it to 10 seconds");
        interval = 10000;
      }
      updateTimer.interval(interval);
      log_i("Starting update timer, Update interval set to %d", interval);
      updateTimer.start();

      //clear pages if different from previous
      if ( parsed["type"] == "NEW" || //if it's a new page
         isPageSetDifferent(parsed["page"].as<JsonArray>()))
      {
        log_i("Page set is different, clearing pages");
        JsonArray page = parsed["page"].as<JsonArray>();
        // if it a new id, full refresh
        if (parsed["type"] == "NEW" || page[0]["id"] != pages[0].id)
        {
          // fullrefreshIfNeeded(true); NO: we don't want to refresh the display only every 50 pages
        }
        clearPages();
        // store page data from page[]
        for (int i = 0; i < page.size(); i++)
        {
          uint16_t id = page[i]["id"];
          uint16_t ttl = page[i]["ttl"];
          String ledColor = page[i]["ledColor"];
          bool blink = page[i]["blink"];
          setPage(page[i]);
        }
        displayPage(0);//TODO: Change this to support multiple pages
      }
      //display first page
      updateCompleted();
      return;
    }

    //stock mode
    if ((type1 == "NEW") || (type1 == "UPDATE")) // new entry or update
    {
      if (pageMode){
        clearPages();
        fullrefreshIfNeeded(true);
        pageMode = false;
      }
      log_i("New/Update message received: type %s", type1.c_str());
      device_configured = true;

      int interval = parsed["updateInterval"].as<int>() + parsed["interval"].as<int>(); // Interval is not named the same in the playlist and single stock!

      int updateInterval = min(1000*60*30, int(interval * 1000 * powerManager.updateFactor));// Max 30 minutes
      updateTimer.interval(updateInterval);

      // DEBUG
      // int interval = 30; // Interval is not named the same in the playlist and single stock!
      // updateTimer.interval(interval * 1000);
      // END DEBUG

      log_d("updatefactor: %g", powerManager.updateFactor);

      // cycleTimer.interval(30 * 1000);

      log_i("Update interval set to %d", updateTimer.interval());

      if (updateTimer.state() != RUNNING)
      {
        updateTimer.start();
        log_i("Starting update timer, Update interval set to %d", updateTimer.interval());
      }

      // if it's a playlist we update the playlist slot
      if (onPlaylist)
      {
        bool playlistChanged = false;

        cycleTimer.interval(parsed["cycleInterval"].as<int>() * 1000);
        log_i("Cycle interval set to %d", cycleTimer.interval());
        log_d("Next cycle in %d", cycleTimer.remaining());

        if (cycleTimer.state() != RUNNING && currentPlaylist.updateCount == 0)
        {
          cycleTimer.resume();
          log_i("Starting cycle timer, Cycle interval set to %d", cycleTimer.interval());
          log_d("Next cycle in %d", cycleTimer.remaining());
        }
        if (currentPlaylist.symbols != symbols) // we have a new playlist!
        {
          log_i("New playlist received");
          playlistChanged = true;
          log_d("Playlist changed, doing a full refresh");
          fullrefreshIfNeeded(true); // if the playlist changed, we need to do a full refresh. Boss said so. :p
          PlaylistConfig newPlaylist(parsed);
          currentPlaylist = newPlaylist;
        }

        log_d("Updating playlist stock slot. Free memory: %d", ESP.getFreeHeap());

        bool changed = currentPlaylist.updateStock(parsed); // update the stock in the playlist message
                                                            // it is calling updateCompleted() inside!
        log_d("Playlist stock slot updated");

        if (currentPlaylist.getStock().symbol == symbol && changed && cycleTimer.remaining() > 300) // if the stock that was updated is the current stock and it changed, update the display unless we are less than 300ms from the next cycle
        {
          log_i("Current stock updated and changed");
          updateDisplay();
        }

        if (playlistChanged)
        {
          log_i("Playlist changed, doing a full refresh");
          currentPlaylist.index = currentPlaylist.getStockIndex(symbol); // set the index to the stock that was updated
          requestUpdate();// it will start timeout timer and call requestPlaylistUpdate()
          return;
        }

        if (currentPlaylist.updateCount == 0)
        {
          log_i("All stocks updated");
          updateCompleted();
        }
        else
        {
          log_i("Still waiting for %d stocks to update", currentPlaylist.updateCount);
        }
      }
      else // it's a single stock
      {
        if (cycleTimer.state() == RUNNING || (currentStock.symbol != symbol))
        { // if we were running a playlist, stop the cycle timer
          // log the 2 symbols
          log_d("New single stock received");
          log_d("Cycle timer state: %d", cycleTimer.state());
          log_d("currentStock.symbol: %s vs symbol: %s", currentStock.symbol.c_str(), symbol.c_str());
          fullrefreshIfNeeded(true); // if the mode changed, we need to do a full refresh. Boss said so. :p
          cycleTimer.stop();         // stop the cycle timer it case it was running from a playlist
        }

        log_i("Updating single stock");
        currentStock.update(parsed); // update the stock
        updateDisplay();             // update the display with the new stock info
        updateCompleted();
      }

    } // END : Type is new or update

    // Continue other types for eg DEVICE_REG, REG_SUCCESSFUL, etc
    else if (type1 == "DEVICE_REG")
    {
      String key = parsed["key"];
      String valid = parsed["valid"];
      display_regkey(key, valid, String(deviceID));
      log_i("Device registration key displayed");
      // set registration timeout to 15 minutes
      registrationTimer.start(); // start the registration timer
      log_i("Registration timer started, timeout in 15 minutes");
    }

    else if (type1 == "REG_SUCCESSFUL")
    {
      log_i("Device Successfully Registered");
      // reset registration timeout to 0
      registrationTimer.stop(); 
      sendHeartBeatMsg(true);
      // device_configured = true;
    }
    else if (type1 == "DEVICE_ASSIGNED")
    {
      Serial.println("Device is Assigned to a user");
      // device_configured = true;
    }
    else if (type1 == "NO_CONFIG")
    {
      // display_message(parsed["message"]);
      device_configured = false;
      setCandleMessage("Ready\nSelect ticker on tickrmeter.io");
      log_i("No config received: %s", parsed["message"].as<String>().c_str());
    }
    else if (type1 == "STOCK_ERROR")
    {
      display_message(parsed["message"]);
      log_i("Stock error: %s", parsed["message"].as<String>().c_str());
    }

    else if (type1 == "DEVICE_REG_FAILURE")
    {
      display_message(parsed["message"]);
      log_i("Device registration failed: %s", parsed["message"].as<String>().c_str());
    }

    else if (type1 == "DEVICE_UNASSIGNED")
    {
      log_i("Device is not Assigned to a user"); // RBE Should we display something?
      delay(1000);
      ESP.restart();
    }

    else if (type1 == "SUCCESS")
    {
      log_i("Device is Added successfully");
      // device_configured = true;
    }
  }

  if (String(topic) == "DEVICESTATUS")
  {
    String action = parsed["action"];
    log_i("Device status action: %s", action.c_str());
    if (action == "status")
    {
      sendHeartBeatMsg();// RBE we should stop doing that, it's not needed anymore, the device is sending a heartbeat when connected
    }
  }

  if (String(topic) == ota_topic) // RBE This means that any message sent to FIRMWAREUPDATE topic will be used BY EVERY DEVICES
  {
    if (firmware_version == parsed["version"])
    {
      log_i("Firmware is already up to date");
      return;
    }
    else
    {
      log_i("Firmware update available");
    }
    processUpdateMsg(parsed["url"].as<String>(), deviceID);
  }
}

void reconnectMqtt() // would need some cleanup and refactoring
{
  mqttClient.setCallback(callback);
  mqttClient.setBufferSize(1024);
  mqttClient.setServer(MQTT_IP, 1883);
  // WiFi.setAutoReconnect(true);
  getmacaddress();

  int tries = 0;
  
  while (!mqttClient.connected())
  {
    connectWifi();
    log_i("Attempting MQTT connection...");
    if (mqttClient.connect(deviceID, MQTT_USER, MQTT_PASS))
    {
      log_i("connected to MQTT");
      sub_mqtt();
    }
    else
    {
      log_i("connection to MQTT FAILED");
      log_i("failed, rc=%d, trying again", mqttClient.state());
      if (tries == 4)
      {
        ledOff(); // turn off the led, this can be long...
        // check if wifi is connected
        drawServerNotConnected();
      }

      if (tries > 10)
      {
        log_i("Wifi or MQTT connection failed, sleeping for 1m before retrying");
        Serial.flush();
        //disconnect wifi
        turnOffWifi();
        //ligth sleep for 1 minute
        esp_sleep_enable_timer_wakeup(60000000L);
        esp_light_sleep_start();
        log_i("Woke up from light sleep");
        tries = 4;
        powerManager.updateBattery();
      }
      tries++;
      // Wait 2 seconds before retrying
      delay(2000);
    }
  }
}

// TOPIC LIST

// const ON_DEVICE_START = "TICKRMETERBOOT"; //Topic for device start
// const MAIN_TOPIC = "STOCKPRICEUPDATE"; //Topic for stock price update
// Can be either for playlist or single stock

// const ALERT_TOPIC = "ALERT"; //Not needed, can be deduced from STOCKPRICEUPDATE
// const FIRMWARE_TOPIC = "FIRMWAREUPDATE";
// const DEVICE_STATUS_TOPIC = "DEVICESTATUS";
// const DEVICE_STATUS_RES_TOPIC = "DEVICESTATUS_RES";//Response topic for device status

bool loopClient()
{
  reconnectMqtt();
  return mqttClient.loop();
}