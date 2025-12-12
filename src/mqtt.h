#ifndef MQTT_H
#define MQTT_H
// #include <TickrMeter_OTA.h> //RBE Not needed, let's use HTTPUpdate.h
#include "TickTwo.h"
#include "ArduinoJson.h"
#include <WiFi.h>

// #include <memory.h>
#include "battery.h"
#include <PubSubClient.h>

extern TickTwo updateTimer;
extern TickTwo cycleTimer;
extern TickTwo blinkTimer;
extern TickTwo timeoutTimer;
extern TickTwo registrationTimer;

extern PowerManager powerManager;

extern String firmware_version;

extern bool device_configured;
extern int lockres;
extern bool pageMode;

void log_mqtt(const char *format, ...);
void reconnectMqtt();
bool loopClient();
void callback(char *topic, byte *payload, unsigned int length);
void reconnectMqtt();
void create_json_objects();
void updateDisplay();
void cyclePlaylist();
void timeoutUpdate();
void requestUpdate();
void updateCompleted();
void requestPlaylistUpdate();
void registrationTimeoutCallback();


String asString(ArduinoJson::JsonVariant variant);

//"alertConfig":{"triggerType":"Greater than","triggerValue":1000,"flashLightbar":false,"playSound":false,"soundType":"bell","soundDur":"Once","changeLightBarColor":true,"lightBarColor":"Blue"}}
class AlertConfig
{
public:
    String triggerType;
    float triggerValue;
    bool flashLightbar;
    bool playSound;
    String soundType;
    String soundDur;
    bool changeLightBarColor;
    String lightBarColor;

    // constructor
    AlertConfig(String triggerType, float triggerValue, bool flashLightbar, bool playSound, String soundType, String soundDur, bool changeLightBarColor, String lightBarColor)
        : triggerType(triggerType), triggerValue(triggerValue), flashLightbar(flashLightbar), playSound(playSound), soundType(soundType), soundDur(soundDur), changeLightBarColor(changeLightBarColor), lightBarColor(lightBarColor)
    {
    }

    AlertConfig(DynamicJsonDocument doc)
        : triggerType(asString(doc["triggerType"])), triggerValue(doc["triggerValue"]), flashLightbar(doc["flashLightbar"]), playSound(doc["playSound"]), soundType(asString(doc["soundType"])), soundDur(asString(doc["soundDur"])), changeLightBarColor(doc["changeLightBarColor"]), lightBarColor(asString(doc["lightBarColor"]))
    {
        log_i("Creating AlertConfig: triggerType: %s, triggerValue: %f, flashLightbar: %d, playSound: %d, soundType: %s, soundDur: %s, changeLightBarColor: %d, lightBarColor: %s", triggerType.c_str(), triggerValue, flashLightbar, playSound, soundType.c_str(), soundDur.c_str(), changeLightBarColor, lightBarColor.c_str());
    }

    // default constructor
    AlertConfig() : triggerType(""), triggerValue(0), flashLightbar(false), playSound(false), soundType(""), soundDur(""), changeLightBarColor(false), lightBarColor("") {}

    // copy constructor
    AlertConfig(const AlertConfig &other)
        : triggerType(other.triggerType), triggerValue(other.triggerValue), flashLightbar(other.flashLightbar), playSound(other.playSound), soundType(other.soundType), soundDur(other.soundDur), changeLightBarColor(other.changeLightBarColor), lightBarColor(other.lightBarColor) {}

    // assignment operator
    AlertConfig &operator=(const AlertConfig &other)
    {
        triggerType = other.triggerType;
        triggerValue = other.triggerValue;
        flashLightbar = other.flashLightbar;
        playSound = other.playSound;
        soundType = other.soundType;
        soundDur = other.soundDur;
        changeLightBarColor = other.changeLightBarColor;
        lightBarColor = other.lightBarColor;
        return *this;
    }
    String logText()
    {
        String logText = "AlertConfig: triggerType: " + triggerType + ", triggerValue: " + String(triggerValue) + ", flashLightbar: " + String(flashLightbar) + ", playSound: " + String(playSound) + ", soundType: " + soundType + ", soundDur: " + soundDur + ", changeLightBarColor: " + String(changeLightBarColor) + ", lightBarColor: " + lightBarColor;
        return logText;
    }
};

class Stock
{
public:
    String name;
    String symbol;
    String price;
    float priceNum;
    String percent;
    String lastUpdated;
    String currency;
    bool isPlaylist;
    AlertConfig alertConfig;
    bool alertEnabled;
    String ledColor;

    // constructor
    Stock(String name, String symbol, String price, float priceNum, String percent, String lastUpdated, String currency, bool isPlaylist, bool alertEnabled, AlertConfig alertConfig, String ledColor)
        : name(name), symbol(symbol), price(price), priceNum(priceNum), percent(percent), lastUpdated(lastUpdated), currency(currency), isPlaylist(isPlaylist), alertConfig(alertConfig), alertEnabled(alertEnabled), ledColor(ledColor)
    {
        log_d("Creating Stock: name: %s, symbol: %s, price: %s, priceNum: %f, percent: %s, lastUpdated: %s, currency: %s, isPlaylist: %d, alertEnabled: %d, alertConfig: %s", name.c_str(), symbol.c_str(), price.c_str(), priceNum, percent.c_str(), lastUpdated.c_str(), currency.c_str(), isPlaylist, alertEnabled, alertConfig.logText().c_str());
    }

    Stock(DynamicJsonDocument doc)
        : symbol(asString(doc["symbol"])), price(asString(doc["price"])), priceNum(doc["priceNum"]), percent(asString(doc["percent"])), lastUpdated(asString(doc["date"])), currency(asString(doc["currency"])), isPlaylist(doc["isPlaylist"]), alertConfig(doc["alertConfig"].as<JsonObject>()), alertEnabled(doc["alertEnabled"].as<bool>()), ledColor(asString(doc["ledColor"]))
    {
        log_i("Creating Stock WITH NO NAME: symbol: %s, price: %s, priceNum: %f, percent: %s, lastUpdated: %s, currency: %s, isPlaylist: %d, alertEnabled: %d, alertConfig: %s, ledColor: %s", symbol.c_str(), price.c_str(), priceNum, percent.c_str(), lastUpdated.c_str(), currency.c_str(), isPlaylist, alertEnabled, alertConfig.logText().c_str(), ledColor.c_str());
    }

    // default constructor
    Stock() : name(""), symbol(""), price(""), priceNum(0), percent(""), lastUpdated(""), currency(""), isPlaylist(false), alertConfig(), alertEnabled(false), ledColor("") {}

    // copy constructor
    Stock(const Stock &other)
        : name(other.name), symbol(other.symbol), price(other.price), priceNum(other.priceNum), percent(other.percent), lastUpdated(other.lastUpdated), currency(other.currency), isPlaylist(other.isPlaylist), alertConfig(other.alertConfig), alertEnabled(other.alertEnabled), ledColor(other.ledColor) {}

    // assignment operator
    Stock &operator=(const Stock &other)
    {
        name = other.name;
        symbol = other.symbol;
        price = other.price;
        priceNum = other.priceNum;
        percent = other.percent;
        lastUpdated = other.lastUpdated;
        currency = other.currency;
        isPlaylist = other.isPlaylist;
        alertConfig = other.alertConfig;
        alertEnabled = other.alertEnabled;
        ledColor = other.ledColor;
        return *this;
    }

    String logText()
    {
        return "Symbol: " + symbol + ", Price: " + price + ", Percent: " + percent + ", Last Updated: " + lastUpdated + ", Currency: " + currency + ", Is Playlist: " + isPlaylist + ", Alert Enabled: " + alertEnabled + ", Alert Config: " + alertConfig.logText();
    }

    void clear()
    {
        symbol = "";
        price = "";
        priceNum = 0;
        percent = "";
        lastUpdated = "";
        currency = "";
        isPlaylist = false;
        alertEnabled = false;
        alertConfig = AlertConfig();
        ledColor = "";
    }
    bool update(DynamicJsonDocument doc)
    {
        log_i("Updating stock: %s with price %s", asString(doc["symbol"]).c_str(), asString(doc["price"]).c_str());
        bool changed = false;
        if (asString(doc["symbol"]) != symbol)
        {
            symbol = asString(doc["symbol"]);
            changed = true;
        }
        if (asString(doc["price"]) != price)
        {
            price = asString(doc["price"]);
            changed = true;
        }
        if (doc["p"].as<float>() != priceNum)
        {
            priceNum = doc["p"].as<float>();
            changed = true;
        }
        if (asString(doc["percent"]) != percent)
        {
            percent = asString(doc["percent"]);
            changed = true;
        }
        if (asString(doc["date"]) != lastUpdated)
        {
            lastUpdated = asString(doc["date"]);
            changed = true;
        }
        if (asString(doc["currency"]) != currency)
        {
            currency = asString(doc["currency"]);
            changed = true;
        }
        if (doc["isPlaylist"].as<bool>() != isPlaylist)
        {
            isPlaylist = doc["isPlaylist"].as<bool>();
            changed = true;
        }
        if (doc["alertEnabled"].as<bool>() != alertEnabled)
        {
            alertEnabled = doc["alertEnabled"].as<bool>();
            changed = true;
        }
        if (asString(doc["ledColor"]) != ledColor)
        {
            ledColor = asString(doc["ledColor"]);
            changed = true;
        }

        alertConfig = AlertConfig(doc["alertConfig"].as<JsonObject>());
        return changed;
    }

    bool isAlertTriggered()
    {
        if (alertEnabled == false)
        {
            return false;
        }
        else if (alertConfig.triggerType == "Less than")
        {
            return priceNum <= alertConfig.triggerValue;
        }
        else if (alertConfig.triggerType == "Greater than")
        {
            return priceNum >= alertConfig.triggerValue;
        }
        return false;
    }

    void requestUpdate();
};

//,"cycleInterval":"120","updateInterval":"60","symbols":"TSLA,AAPL,QID,SPY,META,QQQ,BX","ledBrightness":100,"alertEnabled":false}
class PlaylistConfig
{
public:
    int cycleInterval;
    int updateInterval;
    String symbols;
    int ledBrightness;
    bool alertEnabled;
    uint8_t index;
    uint8_t stockCount;
    uint8_t updateCount;
    // events callback
    std::function<void()> onStockUpdate;
    std::function<void()> onPlaylistUpdated;

    Stock stocks[15];

    // AlertConfig alert; //RBE: Alerts are not implemented in playlist yet

    // constructor
    PlaylistConfig(int cycleInterval, int updateInterval, String symbols, int ledBrightness, bool alertEnabled, AlertConfig alert)
        : cycleInterval(cycleInterval), updateInterval(updateInterval), symbols(symbols), ledBrightness(ledBrightness), alertEnabled(alertEnabled) {}

    PlaylistConfig(DynamicJsonDocument doc)
        : cycleInterval(doc["cycleInterval"]), updateInterval(doc["updateInterval"]), symbols(asString(doc["symbols"])), ledBrightness(doc["ledBrightness"]), alertEnabled(doc["alertEnabled"])
    {
        extractNames();
        doc.clear();
    }

    // default constructor
    PlaylistConfig() : cycleInterval(0), updateInterval(0), symbols(""), ledBrightness(0), alertEnabled(false) {}

    // copy constructor
    PlaylistConfig(const PlaylistConfig &other)
        : cycleInterval(other.cycleInterval), updateInterval(other.updateInterval), symbols(other.symbols), ledBrightness(other.ledBrightness), alertEnabled(other.alertEnabled) {}

    // assignment operator
    PlaylistConfig &operator=(const PlaylistConfig &other)
    {
        cycleInterval = other.cycleInterval;
        updateInterval = other.updateInterval;
        symbols = other.symbols;
        ledBrightness = other.ledBrightness;
        alertEnabled = other.alertEnabled;
        clearStocks();
        extractNames();
        return *this;
    }

    void extractNames()
    {
        this->stockCount = 0;
        index = 0;
        updateCount = 0;
        int start = 0;
        int end = 0;
        while (symbols.indexOf(',', start) != -1 || start < symbols.length())
        {
            end = symbols.indexOf(',', start);
            if (end == -1)
            {
                end = symbols.length();
            }
            String name = symbols.substring(start, end);
            start = end + 1;

            Stock stock(name, "", "", 0, "", "", "", false, false, AlertConfig(), "");
            log_d("Adding stock: %s name: %s", stock.name.c_str(), name.c_str());
            addStock(stock);
        }
        log_i("Total Stock Count: %d", stockCount);
    }

    void addStock(Stock stock)
    {
        log_d("Adding stock: %s", stock.name.c_str());
        if (stockCount >= 10)
        {
            log_e("Stock count is full");
            return;
        }
        // if Sock exists, update it
        for (int i = 0; i < stockCount; i++)
        {
            if (stocks[i].name == stock.name)
            {
                log_i("Stock already exists, updating it");
                stocks[i] = stock;
                return;
            }
        }
        stocks[stockCount++] = stock;
    }

    void nextStock()
    {
        index++;
        if (index >= stockCount)
        {
            index = 0;
        }
    }

    void removeStock(int index)
    {
        for (int i = index; i < stockCount; i++)
        {
            stocks[i] = stocks[i + 1];
        }
        stockCount--;
    }

    void removeStock(String name)
    {
        for (int i = 0; i < stockCount; i++)
        {
            if (stocks[i].name == name)
            {
                removeStock(i);
                break;
            }
        }
    }
    void clearStocks()
    {
        stockCount = 0;
    }

    void removeStock(Stock stock)
    {
        for (int i = 0; i < stockCount; i++)
        {
            if (stocks[i].name == stock.name)
            {
                removeStock(i);
                break;
            }
        }
    }
    bool containsStock(Stock stock)
    {
        for (int i = 0; i < stockCount; i++)
        {
            if (stocks[i].name == stock.name)
            {
                return true;
            }
        }
        return false;
    }
    bool containsStock(String name)
    {
        for (int i = 0; i < stockCount; i++)
        {
            if (stocks[i].name == name)
            {
                return true;
            }
        }
        return false;
    }
    Stock &getStock(int pindex = -1)
    {
        if (pindex == -1)
        {
            pindex = index;
        }
        return stocks[pindex];
    }

    int getStockIndex(String name)
    {
        for (int i = 0; i < stockCount; i++)
        {
            if (stocks[i].name == name)
            {
                return i;
            }
        }
        return -1;
    }

    Stock &getStock(String name)
    {
        for (int i = 0; i < stockCount; i++)
        {
            if (stocks[i].name.startsWith(name)) // RBE: should be ok with == but some symbols have a suffix like /USD
            {
                log_d("Stock found: %s", name.c_str());
                return stocks[i];
            }
        }
        log_e("Stock not found: %s", name.c_str());

        // return null
        static Stock nullStock = Stock();
        nullStock.symbol = "null";
        return nullStock;
    }

    bool updateStock(DynamicJsonDocument doc)
    {
        bool changed = false;
        String symbol = asString(doc["symbol"]);
        int indexSymbol = doc["symbolIndex"];
        if (doc.containsKey("symbolIndex") && indexSymbol != -1)
        {
            int indexSymbol = doc["symbolIndex"];
            changed = getStock(indexSymbol).update(doc);
        }
        else
        {
            changed = getStock(symbol).update(doc);
        }
        log_d("Updating Stock: %s at index %d", symbol.c_str(), indexSymbol);
        if (updateCount > 0)
            updateCount--;
        else
            log_w("Update Count is already 0 and we were not expecting an update");
        log_i("Remaining to Update Count: %d", updateCount);
        if (updateCount == 0)
        {
            if (onPlaylistUpdated != NULL)
                onPlaylistUpdated();
        }
        return changed;
    }
};
#endif