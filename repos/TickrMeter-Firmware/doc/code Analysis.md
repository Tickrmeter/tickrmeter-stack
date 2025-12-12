# Code analysis

## OTA process

Seems to use a custom TickrMeter_OTA.cpp vs standard HTTPUpdate.cpp.
However, there is no difference except a commented header: 

```c
    // http.addHeader("Origin", "esp://M8MFzVKM*********************9OcHyj");
```

This header is added in `mqtt.cpp:109` and there is therefore no need to rely on a custom lib for this.

## Refactoring

### Global objects

### Use of ArduinoJson 5

### Beats in playlist

I would think it could be much easier to get a step increase from a ticker. This would loop on the playlist and just display the prices.

### Price list and not prices

Why not just sending all prices at once?

From this:
```json
  //  symbol	:	TSLA
  //  price	:	$120.69
  //  p	:	120.69
  //  percent	:	1 day + 0.77%
  //  date	:	11:31PM 09 Jan 2023
  //  name	:	test playlist
  //  isPlaylist	:	true
  //  type	:	NEW
  //  cycleInterval	:	120
  //  updateInterval	:	60
  //  symbols	:	TSLA,GOOGL
  //  ledBrightness	:	50
```

to:

```json
{
    isplaylist:"true",
    type: "NEW",

}
```
