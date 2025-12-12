#ifndef PAGE_H
#define PAGE_H
#include <Arduino.h>
#include <HTTPClient.h>
#include <secrets.h>
#include <display_func.h>
#include <led.h>
#include <WiFiClientSecure.h>

// Global client declarations
#ifdef USEHTTPS
static WiFiClientSecure *globalClient = nullptr;
#else
static WiFiClient *globalClient = nullptr;
#endif

static HTTPClient *globalHttp = nullptr;

// base url for retrieving pages
typedef struct
{
  uint16_t id = UINT16_MAX;
  char lastModified[64]; // stores LastModified -- Thu, 02 Nov 2023 21:04:29 GMT
  uint16_t ttl;
  unsigned char bitmap[4736]; // screen is 128*296 pixels / 8 bits per byte = 4736 bytes
  String ledColor;
  bool blink;
  uint32_t revision;
} page_t;

page_t pages[10];

void logFreeMemory()
{
  log_i("Free memory: %d", ESP.getFreeHeap());
  log_i("Free max block: %d", heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
}

int getFreePagePosition()
{
  for (int i = 0; i < 10; i++)
  {
    if (pages[i].id == UINT16_MAX)
    {
      log_i("Free page position found: %d", i);
      return i;
    }
    log_i("Page position %d is not free, id: %d", i, pages[i].id);
  }
  log_e("No free page position found!");
  return UINT16_MAX;
}

int getPagePositionById(uint16_t id)
{
  for (int i = 0; i < 10; i++)
  {
    if (pages[i].id == id)
    {
      log_i("Page id %d found at position %d", id, i);
      return i;
    }
  }

  return getFreePagePosition();
}

// Define a struct to pass the necessary data to the task
struct TaskParams
{
  uint16_t id;
  u16_t pos;
};

void initHttpClient()
{
  if (!globalClient)
  {
#ifdef USEHTTPS
    globalClient = new WiFiClientSecure();
    globalClient->setInsecure();
#else
    globalClient = new WiFiClient();
#endif
  }
  if (!globalHttp)
  {
    globalHttp = new HTTPClient();
    globalHttp->setReuse(false);
  }
}

bool taskRunning = false;
// retrieve page from server and return true if successful/changed
bool retrievePageWorker(uint16_t id, u16_t pos = UINT16_MAX)
{
  logFreeMemory();
  if (!globalClient || !globalHttp)
  {
    log_e("HTTP clients not initialized");
    return false;
  }

  String url = PAGE_URL + String(id);
  if (pos == UINT16_MAX)
  {
    pos = getPagePositionById(id);
  }

  if (globalHttp->begin(*globalClient, url))
  {
    log_i("Retrieving page from %s", url.c_str());

    globalHttp->addHeader("Origin", HTTP_ORIGIN);
    int httpCode = globalHttp->GET();

    if (httpCode > 0)
    {
      if (httpCode == HTTP_CODE_OK)
      {
        int len = globalHttp->getSize();
        if (len != 4736)
        {
          log_e("Page %d retrieval failed: invalid size (%d)", id, len);
        }
        else
        {
          WiFiClient *stream = globalHttp->getStreamPtr();
          int bytes_read = 0;
          while (globalHttp->connected() && (len > 0 || len == UINT16_MAX))
          {
            size_t size = stream->available();
            if (size)
            {
              int c = stream->readBytes(pages[pos].bitmap + bytes_read, ((size > 128) ? 128 : size));
              bytes_read += c;
              if (len > 0)
              {
                len -= c;
              }
            }
            delay(1);
          }
          log_i("Page %d retrieved (%d bytes) in position %d", id, bytes_read, pos);
          globalHttp->end();
          return true;
        }
      }
    }
    else
    {
      log_e("Page %d retrieval failed: %s", id, globalHttp->errorToString(httpCode).c_str());
    }

    globalHttp->end();
  }
  taskRunning = false;
  return false;
}

// Define the task function
void retrievePageTask(void *parameters)
{
  TaskParams *params = (TaskParams *)parameters;
  uint16_t id = params->id;
  u16_t pos = params->pos;
  delete params; // Delete the parameters once we're done with them
  // The rest of your retrievePage function goes here...
  taskRunning = true;
  retrievePageWorker(id, pos);
  taskRunning = false;
  log_i("Page retrieval task done");
  vTaskDelete(NULL); // Delete the task when it's done
}

// retrievePage function to create the task
bool retrievePage(uint16_t id, u16_t pos = UINT16_MAX)
{
  log_i("Retrieving page %d", id);
  logFreeMemory();
  initHttpClient();
  TaskParams *params = new TaskParams;
  params->id = id;
  params->pos = pos;

  // Create the task
  TaskHandle_t retrievePageTaskHandle = NULL;

  xTaskCreate(
      retrievePageTask,       // Task function
      "RetrievePageTask",     // Name for the task
      10000,                  // Stack size (in words, not bytes)
      params,                 // Parameters to pass to the task
      1,                      // Priority
      &retrievePageTaskHandle // Task handle
  );
  taskRunning = true;
  // Get the start tick count
  TickType_t startTick = xTaskGetTickCount();

  while (true)
  {
    yield();
    delay(100);
    // check if task is still running using vTaskGetRunTimeStats
    if (taskRunning == false)
    {
      log_i("Page retrieval is done");
      break;
    }
    // Check if the timeout has been reached
    if (xTaskGetTickCount() - startTick >= pdMS_TO_TICKS(10000))
    { // Timeout of 10 seconds
      log_e("Page retrieval task timed out");
      // check if task is still running using vTaskGetRunTimeStats
      if (eTaskGetState(retrievePageTaskHandle) == eRunning)
      {
        log_e("Page retrieval task is still running. Deleting it.");
        vTaskDelete(retrievePageTaskHandle);
      }
      break;
    }
  }

  return true; // Return true immediately, the task will run in the background
}

// Set or update page from json
void setPage(ArduinoJson::JsonObject page)
{
  uint8_t pos = getPagePositionById(page["id"]);

  // print json object

  log_d("Page received to be stored in pos %d: ", pos);
  serializeJson(page, Serial);
  Serial.println();

  pages[pos].id = page["id"];
  pages[pos].ttl = page["ttl"];
  pages[pos].ledColor = page["ledColor"].as<String>();
  pages[pos].blink = page["blink"];
  pages[pos].revision = page["rev"];
  // retreive binary data into pages[id].bitmap
  retrievePage(pages[pos].id, pos);
  log_i("Page id %d set in position %d with revision %d", pages[pos].id, pos, pages[pos].revision);
}

void clearPage(uint16_t pos)
{
  // clear page
  pages[pos].id = UINT16_MAX;
  pages[pos].ttl = 0;
  pages[pos].ledColor = "";
  pages[pos].blink = false;
  pages[pos].lastModified[0] = '\0';
  memset(pages[pos].bitmap, 0, 4736);
}

void clearPages()
{
  // clear all pages
  for (int i = 0; i < 10; i++)
  {
    clearPage(i);
  }
}

void displayPage(uint16_t pos)
{
  log_i("Displaying page in pos %d", pos);
  // display page
  drawPage(pages[pos].bitmap);
  // display led color
  if (pages[pos].ledColor != "")
  {
    glowLed(pages[pos].ledColor);
    if (pages[pos].blink)
    {
      blinkTimer.start();
    }
    else
    {
      blinkTimer.stop();
    }
  }
  else
  {
    // turn off led
    ledOff();
  }
}

// Check if pageset from MQTT is different from current pageset
bool isPageSetDifferent(ArduinoJson::JsonArray pageSet)
{
  bool different = false;
  log_d("Page set received: ");
  serializeJson(pageSet, Serial);
  Serial.println();

  // Print first page id:
  log_d("First page id: %d", pageSet[0]["id"].as<uint16_t>());

  for (int i = 0; i < pageSet.size(); i++)
  {
    uint16_t id = pageSet[i]["id"];
    uint16_t ttl = pageSet[i]["ttl"];
    String ledColor = pageSet[i]["ledColor"];
    bool blink = pageSet[i]["blink"];
    uint32_t revision = pageSet[i]["rev"];
    log_d("Page %d received: id %d: ttl %d, ledColor %s, blink %d, revision %d", i, id, ttl, ledColor.c_str(), blink, revision);
    uint8_t pos = getPagePositionById(id);
    log_d("Page     in pos: id %d: ttl %d, ledColor %s, blink %d, revision %d", pages[pos].id, pages[pos].ttl, pages[pos].ledColor.c_str(), pages[pos].blink, pages[pos].revision);

    if (pages[pos].id != id || pages[pos].revision != revision || pages[pos].ledColor != ledColor || pages[pos].blink != blink)
    {

      log_i("Page set is different for page %d", id);
      different = true;
      break;
    }
  }
  if (!different)
  {
    log_i("Page set is not different");
  }
  else
  {
    log_i("Page set is different");
  }
  return different;
}

#endif // PAGE_H