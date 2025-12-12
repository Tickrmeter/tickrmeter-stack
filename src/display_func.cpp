#include "display_func.h"
#include "glyphs.h"

GxEPD2_BW<GxEPD2_290_T94, GxEPD2_290_T94::HEIGHT> display(GxEPD2_290_T94(/*CS=*/15, /*DC=*/27, /*RST=*/26, /*BUSY=*/18));
// GxEPD2_BW<GxEPD2_290_T94, GxEPD2_290_T94::HEIGHT>* pdisplay = &display;
//display size is 128x296

Stock lastStock;

extern bool pageMode;
extern void displayPage(uint16_t page);

bool isBgBlack = false;
u8_t screenDrawn = 0;
bool forceNextFullRefresh = false;
void fullrefreshIfNeeded(bool forceNext = false)
{
  if (forceNext)
  {
    log_i("Display - next Full refresh forced");
    forceNextFullRefresh = true;
    return;
  }
  if (forceNextFullRefresh || screenDrawn++ > SCREEN_DRAWN_MAX)
  { // flash screen every 50 draws
    log_i("Display - Full refresh: screenDrawn: %d, forceNextFullRefresh: %d", screenDrawn, forceNextFullRefresh);
    forceNextFullRefresh = false;
    display.setFullWindow();
    screenDrawn = 0;
  }
}

void centerText(String text, int x, int y, const GFXfont font, uint16_t color = GxEPD_BLACK, bool alignLeft = false)
{
  int16_t x1, y1;
  uint16_t w, h;
  if (x == -1)
  {
    x = display.width() / 2;
  }
  if (y == -1)
  {
    y = display.height() / 2;
  }
  display.setFont(&font);
  display.setTextColor(color);
  display.getTextBounds(text, 0, 100, &x1, &y1, &w, &h);
  if (alignLeft)
  {
    display.setCursor(x, y + h / 2);
  }
  else
  {
    display.setCursor(x - w / 2, y + h / 2);
  }
  log_d("Cursor at %d, %d for text: %s", display.getCursorX(), display.getCursorY(), text.c_str());
  display.println(text);
}

void init_display()
{
  display.init(115200);
  SPI.end(); // release standard SPI pins, e.g. SCK(18), MISO(19), MOSI(23), SS(5)
  // SPI: void begin(int8_t sck=-1, int8_t miso=-1, int8_t mosi=-1, int8_t ss=-1);
  SPI.begin(13, 12, 14, 15); // map and init SPI pins SCK(13), MISO(12), MOSI(14), SS(15)
  display.setRotation(3);    // Set orientation. Goes from 0, 1, 2 or 3
}

void display_sleep()
{
  log_d("Display - Going to sleep");
  display.setFullWindow();
  display.firstPage();
  do
  {
    display.fillScreen(GxEPD_BLACK); // Clear previous graphics to start over to print new things.

    // draw battery icon
    int startX = 93;
    int startY = 34;
    display.fillRect(startX, startY, 90, 53, GxEPD_WHITE);
    display.fillRect(startX + 5, startY + 3, 80, 47, GxEPD_BLACK);
    display.fillRect(startX + 8, startY + 8, 74, 37, GxEPD_WHITE);
    display.fillRect(startX + 13, startY + 11, 64, 31, GxEPD_BLACK);
    display.fillRect(startX + 90, startY + 13, 14, 28, GxEPD_WHITE);
    display.fillRect(startX + 90, startY + 16, 10, 20, GxEPD_BLACK);
    for (int i = 0; i < 5; i++)
    {
      display.drawLine(110 + i, 19, 180 + i, 102, GxEPD_WHITE);
    }
    // display_text(GxEPD_BLACK, FreeSansBold12pt7b, 10, 45, "Battery very low!");
    // display_text(GxEPD_BLACK, FreeSansBold12pt7b, 10, 85, "Going to Sleep!");
  } while (display.nextPage()); // Print everything we set previously
  display.hibernate();
}

void drawCandleStick(int candleHeight, int upperWickHeight, int lowerWickHeight, int centerX, int centerY)
{
  int candleWidth = 8;
  int candleX = centerX - candleWidth / 2;
  int candleY = centerY - candleHeight / 2;
  int upperWickY = centerY - candleHeight / 2 - upperWickHeight;
  display.fillRect(candleX, candleY, candleWidth, candleHeight, GxEPD_BLACK);
  display.drawFastVLine(centerX, upperWickY, candleHeight + upperWickHeight + lowerWickHeight, GxEPD_BLACK);
}

uint8_t indexCandle = 0;
void addCandleSticks(int count, bool atOnce)
{
#ifdef FASTSTART
  return;
#endif
  if (indexCandle > display.width())
    indexCandle = 0;
  if (indexCandle == 0)
  {
    // clear screen
    display.setPartialWindow(0, 0, display.width(), display.height());
    do
    {
      display.fillScreen(GxEPD_WHITE);
    } while (display.nextPage());
    indexCandle = 30;
  }
  while (count-- > 0)
  {
    indexCandle += 10;
    int candleHeight = random(10, 25);
    int upperWickHeight = random(0, 20);
    int lowerWickHeight = random(0, 20);
    int centerX = indexCandle;
    int centerY = random(0, 20);
    if (atOnce)
    { // draw all candles at once
      drawCandleStick(candleHeight, upperWickHeight, lowerWickHeight, centerX, centerY + 15);
      continue;
    }
    display.setPartialWindow(centerX - 4, 0, 8, candleHeight + upperWickHeight + lowerWickHeight);
    display.firstPage();
    do
    {
      // fill screen with random candlesticks
      drawCandleStick(candleHeight, upperWickHeight, lowerWickHeight, centerX, centerY + 15);
    } while (display.nextPage());
  }
  do
  {
  } while (display.nextPage());
}

void setCandleMessage(String message)
{
  display.setPartialWindow(0, 70, display.width(), display.height() - 70);
  display.firstPage();
  do
  {
    // split on new line
    int index = message.indexOf("\n");
    if (index > 0)
    {
      String line1 = message.substring(0, index);
      String line2 = message.substring(index + 1);
      centerText(line1, display.width() / 2, 70, FreeSansBold9pt7b);
      centerText(line2, display.width() / 2, 90, FreeSansBold9pt7b);
    }
    else
    {
      centerText(message, display.width() / 2, 70, FreeSansBold9pt7b);
    }
    // fill screen with random candlesticks
  } while (display.nextPage());
}

void drawlogo()
{
  display.setFullWindow();
  do
  {
    display.fillScreen(GxEPD_BLACK);
    display.drawBitmap((display.width() - 192) / 2, (display.height() - 27) / 2, epd_bitmap_logo_sml, 192, 27, GxEPD_BLACK, GxEPD_WHITE);
  } while (display.nextPage());
  display.hibernate();
}

void display_wifi(WiFiManager *myWiFiManager)
{
  display.setPartialWindow(0, 0, display.width(), display.height()); // Set full window mode, meaning is going to update the entire screen
  // fullrefreshIfNeeded();
  do
  {
    setCandleMessage("Connect to TickrMeter WiFi");
    display.drawBitmap(display.width() / 2 - 25, display.height() - 40, epd_bitmap_wifi, 31, 31, GxEPD_WHITE, GxEPD_BLACK);

    // display.fillScreen(GxEPD_WHITE); // Clear previous graphics to start over to print new things.
    // centerText("WiFi HOTSPOT", display.width() / 2, 25, FreeSansBold18pt7b);
    // centerText("Connect to the TickrMeter WiFi", display.width() / 2, 49, FreeSansBold9pt7b);
    // centerText("Open 192.168.4.1 in a browser", display.width() / 2, 71, FreeSansBold9pt7b);
    // centerText("For further instructions GO TO", display.width() / 2, 95, FreeSansBold9pt7b);
    // centerText("tickrmeter.com/setup", display.width() / 2, 114, FreeSansBold9pt7b);
  } while (display.nextPage()); // Print everything we set previously
  display.hibernate();
  // delay(90);
}

void displayMessage(String message, int y = -1, const GFXfont font = FreeSansBold12pt7b)
{
  isBgBlack = false;
  display.setPartialWindow(0, 0, display.width(), display.height());
  fullrefreshIfNeeded();
  if (y == -1)
  {
    y = display.height() / 2;
  }
  do
  {
    display.fillScreen(GxEPD_WHITE); // Clear previous graphics to start over to print new things.
    centerText(message, display.width() / 2, y, font);
  } while (display.nextPage()); // Print everything we set previously
  display.hibernate();
}


void drawServerNotConnected()
{
  isBgBlack = false;
  display.setPartialWindow(0, 0, display.width(), display.height());
  fullrefreshIfNeeded(true);
  do
  {
    display.fillScreen(GxEPD_WHITE); // Clear previous graphics to start over to print new things.
    display.drawBitmap(display.width() / 2 - 25, 10, epd_bitmap_server_lost, 50, 50, GxEPD_WHITE, GxEPD_BLACK);
    centerText("Server Connection Lost", display.width() / 2, 90, FreeSansBold9pt7b);
    centerText("Reconnecting to Server...", display.width() / 2, 110, FreeSansBold9pt7b);
  } while (display.nextPage()); // Print everything we set previously
  display.hibernate();
}

void display_text(int color, const GFXfont font, int x_pos, int y_pos, String text)
{
  display.setTextColor(color);     // Set color for text
  display.setFont(&font);          // Set font
  display.setCursor(x_pos, y_pos); // Set the position to start printing text (x,y)
  display.println(text);           // Print some text
}

void displayWiFiLost(bool lost)
{
  u16_t fgColor = GxEPD_BLACK;
  u16_t bgColor = GxEPD_WHITE;
  if (isBgBlack){
    fgColor = GxEPD_WHITE;
    bgColor = GxEPD_BLACK;
  }

  int x;
  if (powerManager.powerSavingMode != PowerSavingMode::PS_HIGH)
    x = 3;
  else
    x = 31;
  display.setPartialWindow(x, 2, 21, 17);
  display.fillScreen(bgColor);
  if (!lost)
  {
    // if in page mode, we redisplay the whole screen
    if (pageMode)
    {
      displayPage(0);
      return;
    }
    do
    {
      display.fillRect(x, 2, 21, 17, bgColor);
    } while (display.nextPage());
    return;
  }

  log_d("displayWiFiLost");
  do
  {
      display.fillRect(x, 2, 21, 17, bgColor);
    display.drawBitmap(x, 2, epd_bitmap_nowifi, 21, 17, bgColor, fgColor);
  } while (display.nextPage());
}

void displayBattery()
{

  if (pageMode){
    return;
  }

  u16_t fgColor = GxEPD_BLACK;
  u16_t bgColor = GxEPD_WHITE;
  if (isBgBlack){
    fgColor = GxEPD_WHITE;
    bgColor = GxEPD_BLACK;
  }
  
  if (powerManager.powerSavingMode != PowerSavingMode::PS_HIGH)
  {
    display.fillRect(3, 2, 26, 15, bgColor);
    return;
  }
  // Only show battery in high power saving mode
  if (powerManager.batteryLevel > 75)
    display.drawBitmap(3, 2, epd_bitmap_rb80, 26, 15, bgColor, fgColor);
  else if (powerManager.batteryLevel > 45)
    display.drawBitmap(3, 2, epd_bitmap_rb60, 26, 15, bgColor, fgColor);
  else if (powerManager.batteryLevel > 20)
    display.drawBitmap(3, 2, epd_bitmap_rb40, 26, 15, bgColor, fgColor);
  else if (powerManager.batteryLevel > 10)
    display.drawBitmap(3, 2, epd_bitmap_rb20, 26, 15, bgColor, fgColor);
  else
    display.drawBitmap(3, 2, epd_bitmap_rb20, 26, 15, bgColor, fgColor);//For the lowest level it should have one bar instead of empty
    // display.drawBitmap(3, 2, epd_bitmap_rb0, 26, 15, bgColor, fgColor);

  log_d("Display Battery: %d", powerManager.batteryLevel);
  // if (powerManager.powerSavingMode != PowerSavingMode::PS_NONE)
  // {
  //   // display.drawBitmap(22, 4, epd_bitmap_leaf, 25, 23, GxEPD_BLACK, GxEPD_WHITE);
  //   display.setCursor(14, 12);
  //   display.setTextColor(GxEPD_WHITE);
  //   display.setFont(&FreeSansBold9pt7b);
  //   display.print("+");
  // }
}


void drawPage(unsigned char bitmap[4662])
{
  log_d("Display - Drawing page");
  display.setPartialWindow(0, 0, display.width(), display.height());
  fullrefreshIfNeeded();
  isBgBlack=true;
  do
  {
    display.drawBitmap(0, 0, bitmap, display.width(), display.height(), GxEPD_WHITE, GxEPD_BLACK);
    displayBattery();
  } while (display.nextPage());
  display.hibernate();
}


int stopAtWidth(String text, int width, const GFXfont font)
{
  int16_t tbx, tby;
  uint16_t tbw, tbh;
  display.setFont(&font);
  int i = 0;
  do
  {
    i++;
    String subsymbol = text.substring(0, text.length() - i);
    display.getTextBounds(subsymbol, 0, 0, &tbx, &tby, &tbw, &tbh);
  } while (tbw > width);
  return text.length() - i;
}

void displaySymbol(String symbol, int y = -1)
{
  // Note: centerText also supports y = -1 to center vertically
  // trim symbol if too long
  // adapt font size to fit
  if (symbol.length() > 7) // wrap symbol if too long
  {
    // get size of textbox
    //
    display.setFont(&FreeSansBold9pt7b);
    int16_t tbx, tby;
    uint16_t tbw, tbh;

    int l1 = stopAtWidth(symbol, 95, FreeSansBold9pt7b);
    int l2 = stopAtWidth(symbol.substring(l1), 95, FreeSansBold9pt7b);
    centerText(symbol.substring(0, l1), 50, display.height() / 2 - 10, FreeSansBold9pt7b, GxEPD_WHITE);
    centerText(symbol.substring(l1, l1 + l2), 50, display.height() / 2 + 10, FreeSansBold9pt7b, GxEPD_WHITE);
  }
  else if (symbol.length() > 5)
  {
    centerText(symbol, 50, y, FreeSansBold9pt7b, GxEPD_WHITE);
  }
  else if (symbol.length() > 3)
  {
    centerText(symbol, 50, y, FreeSansBold12pt7b, GxEPD_WHITE);
  }
  else
  {
    centerText(symbol, 50, y, FreeSansBold18pt7b, GxEPD_WHITE);
  }
}

// Display position in playlist with clear dots and filled dots
void displayPosition(uint pos, uint total)
{
  log_d("Display Position: %d/%d", pos, total);

  int space = 100 / (total + 1);

  // draw clear dots separated by space
  for (int i = 0; i < total; i++)
  {
    display.drawCircle(space * (i + 1), 115, 5, GxEPD_WHITE);
  }

  display.fillCircle(space * (pos + 1), 115, 5, GxEPD_WHITE);
}

void displayStock(Stock stock, uint pos, uint total)
{
  isBgBlack = true;
  log_i("Displaying stock %s", stock.logText().c_str());

  // if it's a new stock, do a update full screen partially
  int x = (stock.symbol != lastStock.symbol) ? 0 : 100;
  display.setPartialWindow(x, 0, display.width(), display.height());
  if (forceNextFullRefresh || total > 1 && stock.symbol != lastStock.symbol) // full refresh if 50 playlist symbols are displayed
    fullrefreshIfNeeded();

  do
  {
    display.fillScreen(GxEPD_WHITE);                            // Clear previous graphics to start over to print new things.
    display.fillRect(0, 0, 100, display.height(), GxEPD_BLACK); // Draw a black rectangle

    // check if we need to split at '/' ie we have one or two lines of text in the symbol
    int y = 64;
    if (stock.symbol.indexOf("/") > 0)
    {
      String line1 = stock.symbol.substring(0, stock.symbol.indexOf("/"));
      String line2 = stock.symbol.substring(stock.symbol.indexOf("/") + 1);
      line1.trim();
      line2.trim();
      displaySymbol(line1, 42);
      displaySymbol(line2, 86);
    }
    else
    {
      displaySymbol(stock.symbol);
    }

    // Display the price
    if (stock.price.startsWith("€"))
    {
      log_d("Price starts with €");
      stock.price = char(0x80) + stock.price.substring(1);
    }
    // centerText(stock.price, 106, 82 , FreeSansBold24pt7b, GxEPD_BLACK, true);
    display_text(GxEPD_BLACK, FreeSansBold24pt7b, 106, 80, stock.price);
    // display_text(GxEPD_BLACK, FreeSansBold24pt7b, 106, 73, stock.price);
    // Display the last updated time and date
    display_text(GxEPD_BLACK, FreeSansBold9pt7b, 105, 20, stock.lastUpdated);


    display_text(GxEPD_BLACK, FreeSansBold12pt7b, 105, 121, stock.percent);


    if (total > 1 && total < 6) // only display position if we have less than 6 stocks
    {
      displayPosition(pos, total);
    }

    displayBattery();
  } while (display.nextPage()); // Print everything we set previously
  display.hibernate();
}

void display_regkey(String key, String valid, String mac)
{
  mac.replace(":", "");
  display.setPartialWindow(0, 0, display.width(), display.height()); // Set full window mode, meaning is going to update the entire screen
  fullrefreshIfNeeded();

  do
  {
    display.fillScreen(GxEPD_WHITE); // Clear previous graphics to start over to print new things.
    centerText(key, display.width() / 2, 25, FreeSansBold18pt7b, GxEPD_BLACK);
    display_text(GxEPD_BLACK, FreeSansBold9pt7b, 65, 55, "Go to tickrmeter.io");
    display_text(GxEPD_BLACK, FreeSansBold9pt7b, 45, 75, "and register your device");
    display_text(GxEPD_BLACK, FreeSansBold9pt7b, 60, 103, "Key Validity: 10 mins");
    display_text(GxEPD_BLACK, FreeSansBold9pt7b, 80, 125, mac);
  } while (display.nextPage()); // Print everything we set previously
  display.hibernate();
  delay(90);
}

void display_message(String message, String message2)
{
  isBgBlack = false;
  display.setPartialWindow(0, 0, display.width(), display.height()); // Set full window mode, meaning is going to update the entire screen
  fullrefreshIfNeeded();
  do
  {
    if (message2 == "")
    {
      display.fillScreen(GxEPD_WHITE); // Clear previous graphics to start over to print new things.
      centerText(message, display.width() / 2, display.height() / 2, FreeSansBold12pt7b);
    }
    else
    {
      display.fillScreen(GxEPD_WHITE); // Clear previous graphics to start over to print new things.
      
      centerText(message, display.width() / 2, display.height() / 2 - 20, FreeSansBold12pt7b);

      // display each line of the message2 split with \n
      int i = 0;
      int j = 0;
      int l = 0;
      int size = message2.length();
      while (i < size)
      {

        j = message2.indexOf("\n", i);
        if (j == -1)
          j = size;
        centerText(message2.substring(i, j), display.width() / 2, display.height() / 2 + 8 + l * 18, FreeSansBold9pt7b);
        i = j + 1;
        l++;
      }
    }
  } while (display.nextPage()); // Print everything we set previously
  display.hibernate();
  delay(90); // why?
}
