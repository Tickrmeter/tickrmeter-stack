#include <Arduino.h>
#include <display_func.h>
#include <esp_wifi.h>
#include <tickrwifi.h>
#include <secrets.h>
#include <OTAUpdate.h>
#include <esp_https_ota.h>
#include <led.h>
#include <wm_custom.h>

WiFiManager wifiManager;
extern bool WifiConnected;
extern char deviceID[13];
extern PowerManager powerManager;

extern PubSubClient mqttClient;

uint16_t wifiLostCount = 0;

bool wifiLost = false;

String getmacaddress(void)
{
#ifdef DEBUGMODE
    strcpy(deviceID, "349454F07018");
    log_i("Device ID: %s", deviceID);
    return "349454F07018";
#endif
    WiFi.mode(WIFI_MODE_STA);
    String mac = WiFi.macAddress();
    mac.replace(":", "");
    // Serial.println(mac);
    strcpy(deviceID, mac.c_str());
    return mac;
}

void configPortalTimeout()
{
    log_i("Config portal timed out");

    if (!powerManager.isCharging)
    {
        display_message("Shutting down.", "Wifi AP not found.\nRestart to try again");
        // Start deep sleep now
        delay(1000);
        esp_deep_sleep_start();
    }
    else
    {
        display_message("Configuration timed out", "Restarting...");
        delay(5000);
        ESP.restart();
    }
}

// wifi disconnect callback
void wifiDisconnected(arduino_event_id_t event, arduino_event_info_t info)
{
    log_i("Disconnected from wifi");
    wifiLostCount++;
    // log_i("Event: %d, Info:
}

void gotIP(arduino_event_id_t event, arduino_event_info_t info)
{
    log_i("Wifi connected");
}

// esp_err_t do_firmware_upgrade()
// {
//     esp_http_client_config_t config = {
//         .url = "https://home.flexpertise.net/transmission/download/fw.bin",

//     };
//     esp_https_ota_config_t ota_config = {
//         .http_config = &config,
//     };
//     esp_err_t ret = esp_https_ota(&ota_config);
//     if (ret == ESP_OK) {
//         esp_restart();
//     } else {
//         return ESP_FAIL;
//     }
//     return ESP_OK;
// }

void connectRecoveryAP()
{

    WiFi.enableSTA(true);
    wifi_config_t originalConfig;
    esp_wifi_get_config(WIFI_IF_STA, &originalConfig);
    log_i("SSID before begin: %s", originalConfig.sta.ssid);
    WiFi.begin("tkrecovery", "tkrecovery");
    WiFi.waitForConnectResult(3000);
    if (WiFi.status() == WL_CONNECTED)
    {
        log_i("Connected to recovery AP");
        display_message("Recovery wifi detected", "Factory reset in 10s");
        delay(10000);
        firmwareUpdate("http://api.tickrmeter.io/recoveryfw.bin", false);//Changed in 53p: now in http not https
        wifiManager.resetSettings();
        ESP.restart();
    }
    else
    {
        display_message("Can't connect", "SSID and Pwd should be \"tkrecovery\"");
        log_i("Not connected to recovery AP");
    }
    esp_wifi_set_config(WIFI_IF_STA, &originalConfig);
    // WiFi.persistent(true);
    // Restore the original WiFi credentials
    // WiFi.disconnect(true, true);
}

// Check for recovery AP and reset AP
void checkFunctionAP()
{
    WiFi.mode(WIFI_STA);
    int numNetworks = WiFi.scanComplete();

    int retry = 0;
    while ((numNetworks < 0) && (retry++ < 5))
    {
        log_i("Wifi scan failed or not ready, retrying");
        delay(1000);
        numNetworks = WiFi.scanNetworks();
    }
    if (numNetworks == 0)
    {
        Serial.println("No networks found");
    }
    else
    {
        log_i("Found %d networks", numNetworks);
        for (int i = 0; i < numNetworks; i++)
        {
            if (WiFi.SSID(i) == "tkrecovery")
            {
                log_i("Found recovery AP");
                connectRecoveryAP();
            }
            else if (WiFi.SSID(i) == "tkreset")
            {
                log_i("Found reset AP");
                display_message("Reset wifi AP", "Clearing wifi settings");
                delay(5000);
                wifiManager.resetSettings();
                ESP.restart();
            }
        }
    }
}

void resetAndAP()
{
    log_i("Resetting wifi settings");
    fullrefreshIfNeeded(true);
    display_message("Resetting wifi settings", "Restarting...");
    delay(5000);
    wifiManager.resetSettings();
    display_wifi(NULL);
    wifiManager.startConfigPortal("TickrMeter");
    ESP.restart();
}

// WifiManager call.
void setupWifi()
{
    WiFi.disconnect();
    // RBE: Maybe display "Connecting to Wifi..."
    wifiManager.setAPCallback(display_wifi);
    wifiManager.setConfigPortalTimeout(600);
    wifiManager.setCleanConnect(true);
    wifiManager.setMinimumSignalQuality(35);
    wifiManager.setConnectRetries(3); // one by default, but we want more
    wifiManager.setSaveConnectTimeout(14);
    wifiManager.setConfigPortalTimeoutCallback(configPortalTimeout);
    wifiManager.setConnectTimeout(10); // 10 seconds to connect to the wifi
    wifiManager.setBreakAfterConfig(true); // Exit after config even if connection fails    WiFi.setHostname("PlusTicker");

    WiFi.setHostname("TickrMeter");
    WiFi.setScanMethod(WIFI_ALL_CHANNEL_SCAN);
    
    bool connected = wifiManager.autoConnect("TickrMeter");
    
    if (!connected) {
        // Check if credentials were saved but connection failed
        if (wifiManager.getWiFiIsSaved()) {
            // WiFi credentials were configured but connection failed
            log_i("WiFi configured but connection failed - bad credentials or network issues");
            display_message("Connection Failed", "WiFi configured but\ncannot connect.\nCheck credentials.");
        } else {
            // General failure (timeout, no config, etc.)
            log_i("Failed to connect to Wifi - general failure or timeout");
            display_message("Failed to connect", "Please check your settings");
        }
        
        // Reset and try again
        wifiManager.resetSettings();
        delay(5000);
        ESP.restart();
    }

    wifi_config_t originalConfig;
    esp_wifi_get_config(WIFI_IF_STA, &originalConfig);
    log_i("SSID after begin: %s", originalConfig.sta.ssid);

    getmacaddress();
    Serial.println("connected to Wifi");
    WiFi.setAutoReconnect(true);

    WiFi.onEvent(wifiDisconnected, ARDUINO_EVENT_WIFI_STA_DISCONNECTED);
    WiFi.onEvent(gotIP, ARDUINO_EVENT_WIFI_STA_GOT_IP);
}

void turnOffWifi()
{
    mqttClient.disconnect();
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    delay(1);
}

wl_status_t connectWifi()
{
    while (WiFi.status() != WL_CONNECTED)
    {
        
        if (WiFi.getMode() != WIFI_MODE_STA)
        {
            log_i("Wifi mode is not STA, switching. It is %d", WiFi.getMode());
            WiFi.disconnect();
            WiFi.mode(WIFI_STA);
        }
        
        WiFi.setScanMethod(WIFI_ALL_CHANNEL_SCAN);
        // try 3 times to connect to wifi
        int retries = 0;
        while ((WiFi.status() != WL_CONNECTED) && (retries++ < 3))
        {
            log_i("Wifi connection attempt: %d", retries);
            if (retries > 1)
            {
                WiFi.disconnect(true);
            }
            WiFi.begin();
            delay(4000);
        }

        if (WiFi.status() != WL_CONNECTED)
        {
            log_i("Wifi connection failed after %d attempts", retries);
            displayWiFiLost(true);
            // ledOff();//this might take a while, so turn off the led// No it's distracting
            wifiLost = true;
        }
        else
        {
            if (wifiLost)
            {
                displayWiFiLost(false);
                wifiLost = false;
            }
        }
    }
    return WiFi.status();
}

