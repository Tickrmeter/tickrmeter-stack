/**
 * wm_strings_en.h
 * engligh strings for
 * WiFiManager, a library for the ESP8266/Arduino platform
 * for configuration of WiFi credentials using a Captive Portal
 *
 * @author Creator tzapu
 * @author tablatronix
 * @version 0.0.0
 * @license MIT
 */

#ifndef _WM_STRINGS_EN_H_
#define _WM_STRINGS_EN_H_


// #ifndef WIFI_MANAGER_OVERRIDE_STRINGS
// !!! ABOVE WILL NOT WORK if you define in your sketch, must be build flag, if anyone one knows how to order includes to be able to do this it would be neat.. I have seen it done..

// strings files must include a consts file!
#include "wm_consts_en.h" // include constants, tokens, routes

const char WM_LANGUAGE[] PROGMEM = "en-US"; // i18n lang code

const char HTTP_HEAD_START[]       PROGMEM = "<!DOCTYPE html>"
"<html lang='en'><head>"
"<meta name='format-detection' content='telephone=no'>"
"<meta charset='UTF-8'>"
"<meta  name='viewport' content='width=device-width,initial-scale=1,user-scalable=no'/>"
"<title>{v}</title>";

const char HTTP_SCRIPT[]           PROGMEM = "<script>function c(l){"
"document.getElementById('s').value=l.getAttribute('data-ssid')||l.innerText||l.textContent;"
"p = l.nextElementSibling.classList.contains('l');"
"document.getElementById('p').disabled = !p;"
"if(p)document.getElementById('p').focus();};"
"function f() {var x = document.getElementById('p');x.type==='password'?x.type='text':x.type='password';}"
"function showSpinner(btn) {btn.innerHTML='<span class=\"spinner\"></span>Scanning...';btn.disabled=true;setTimeout(function(){window.location.href='/wifi';},200);return false;}"
"</script>"; // @todo add button states, disable on click , show ack , spinner etc

const char HTTP_HEAD_END[]         PROGMEM = "</head><body class='{c}'><div class='wrap'>"; // {c} = _bodyclass
// example of embedded logo, base64 encoded inline, No styling here
// const char HTTP_ROOT_MAIN[]        PROGMEM = "<img title=' alt=' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAADQElEQVRoQ+2YjW0VQQyE7Q6gAkgFkAogFUAqgFQAVACpAKiAUAFQAaECQgWECggVGH1PPrRvn3dv9/YkFOksoUhhfzwz9ngvKrc89JbnLxuA/63gpsCmwCADWwkNEji8fVNgotDM7osI/x777x5l9F6JyB8R4eeVql4P0y8yNsjM7KGIPBORp558T04A+CwiH1UVUItiUQmZ2XMReSEiAFgjAPBeVS96D+sCYGaUx4cFbLfmhSpnqnrZuqEJgJnd8cQplVLciAgX//Cf0ToIeOB9wpmloLQAwpnVmAXgdf6pwjpJIz+XNoeZQQZlODV9vhc1Tuf6owrAk/8qIhFbJH7eI3eEzsvydQEICqBEkZwiALfF70HyHPpqScPV5HFjeFu476SkRA0AzOfy4hYwstj2ZkDgaphE7m6XqnoS7Q0BOPs/sw0kDROzjdXcCMFCNwzIy0EcRcOvBACfh4k0wgOmBX4xjfmk4DKTS31hgNWIKBCI8gdzogTgjYjQWFMw+o9LzJoZ63GUmjWm2wGDc7EvDDOj/1IVMIyD9SUAL0WEhpriRlXv5je5S+U1i2N88zdPuoVkeB+ls4SyxCoP3kVm9jsjpEsBLoOBNC5U9SwpGdakFkviuFP1keblATkTENTYcxkzgxTKOI3jyDxqLkQT87pMA++H3XvJBYtsNbBN6vuXq5S737WqHkW1VgMQNXJ0RshMqbbT33sJ5kpHWymzcJjNTeJIymJZtSQd9NHQHS1vodoFoTMkfbJzpRnLzB2vi6BZAJxWaCr+62BC+jzAxVJb3dmmiLzLwZhZNPE5e880Suo2AZgB8e8idxherqUPnT3brBDTlPxO3Z66rVwIwySXugdNd+5ejhqp/+NmgIwGX3Py3QBmlEi54KlwmjkOytQ+iJrLJj23S4GkOeecg8G091no737qvRRdzE+HLALQoMTBbJgBsCj5RSWUlUVJiZ4SOljb05eLFWgoJ5oY6yTyJp62D39jDANoKKcSocPJD5dQYzlFAFZJflUArgTPZKZwLXAnHmerfJquUkKZEgyzqOb5TuDt1P3nwxobqwPocZA11m4A1mBx5IxNgRH21ti7KbAGiyNn3HoF/gJ0w05A8xclpwAAAABJRU5ErkJggg==' /><h1>{v}</h1><h3>WiFiManager</h3>";
// const char HTTP_ROOT_MAIN[]        PROGMEM = "<h1>{t}</h1><h3>{v}</h3>";
const char HTTP_ROOT_MAIN[]        PROGMEM = " <div style='text-align:center'> <img title=' alt=' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAjCAYAAADR20XfAAABC2lDQ1BpY2MAABiVY2BgXJGTnFvMJMDAkJtXUhTk7qQQERmlwH6HgZFBkoGZQZPBMjG5uMAxIMCHASf4do2BEURf1gWZxUAa4ExJLU5mYGD4wMDAEJ9cUFTCwMAIsounvKQAxI5gYGAQKYqIjGJgYMwBsdMh7AYQOwnCngJWExLkzMDAyMPAwOCQjsROQmJD7QIB1mSj5ExkhySXFpVBmVIMDAynGU8yJ7NO4sjm/iZgLxoobaL4UXOCkYT1JDfWwPLYt9kFVaydG2fVrMncX3v58EuD//9LUitKQJqdnQ0YQGGIHjYIsfxFDAwWXxkYmCcgxJJmMjBsb2VgkLiFEFNZwMDA38LAsO08APD9TdvF8UZ0AAAACXBIWXMAAAsSAAALEgHS3X78AAAVSklEQVR42u1caZClZXV+nrt09yzOMCwOwkwgKjI9qGwqiVhU3BeiFqWJxBEwgluVGjUaKdBySQgmmoqiVBSTkCiLkuhotERl1FDiEnCLWD2jAgFkJrPvW3ff+z35Mc9pTr/z3b49MM1oar6qrnu7+1ve97xnec5zzvsRM3gsXbp0v79JmvQ7SYyMjODwcfj4TTz4CBkHJZFk5d8b/qwkHTaSw8dv7NGa6QdIIgCRlKQhkgSwx/9rhNEMDw9j5cqVMxq9phjjQX324eP/kYEciCI9xAglAMcDuJLk2QAakn4M4FKSv3I0qfbZzYwZaf3g/MyZfPaBGG5E0/KYKrr2ut9Dudfho38EaR4khaxIypFjlqSvAzglFJXkiQDOAnCGpPX7/kTNmJU+ggZwgM6j0WOcAlAdoLE1MmQu5lz5no+U4U8ai41V1ovfKkNthNL6syvpYf9YGGF8LwZwCoBRL1QFYK+k4yWdX+QkB31+/rxS0lpJKwH80j93Azhthp/fE3Zq39EtZe7fK+dtfSOjz6HlOnG/4lPTud/DjdLpp8rzSnOaMqL/RkaQ5GkeBeDDJGdb0A/F7VYA5ki6muStFsYCP6PBfZYT3wHgyJkUWMAMSYtILpS0sIAesw6FUyJZSXoxyQsB7CTZSPKbS/IGAMv992rp0qW1Hjfk6uteDuB8ANtJNv3/LoB5JD8BYEXcbyYjtaQWyXMlzfPzA6lsA/AfRhW/VRArkujZAF53kAR1K4Bb03dIagPo+JQB/20FScwUvEo5xqg/xyQ1E5ysDoWBOOd6qpW6FrEAWB5et06hhoeHJ+Csz7kCwBN63O8HAFYkY5oJWUe+OQTgkyQXFqeslfQVAN3fNgPJ3n+LpPkkOzURpG5WpWJ37JX3YF9UGACwSuRFIK8GMNcXjQF4F4HbIFENVqi0H6ZNOUvdGDRVAlpcy+S9GwXDBpKYSbKiiFox7t3+3GtjpfZx4bKBPBfALY4G3ZLl8/2a9tIvsHGMmhkMZe1KGgrWsE4xe8x72nKuuV4AdgBYKGncz237b7XXlSziDIypL3nTi9BoFQMYsAIN9DAG+sZivRtoFp+VmmRjT/fT1ezWClQ6C0AT5I8au8b/Z/QJR2D2D9drcNMO7Fq6cMIzOlTHwJspaVUBnZoeRjcL5uEkgEFLTyfZT+OYCk4xxlcsdMP3aFnRQ6QRZV8D4BbLetKzkwIonRvyaKU1muQg8jjjHknODRtptyaiM0UfZTn3cGKNtHb7EUBWH5XXlrWz/Mw4OeQdehGJf92YpgkJGdBT6cIYUyt5N0naQ3LAi5S1oe0JqginY7EQvk8XwBwAHZEAoS3nL9Hayz+P49/xgjVDq7Yuh4CxE+fi11evAHCFUd3nAL55UtTw8yLpj2h3lI14l6TNgXGTvaqMPtOFYSnZVY0QS+VWQW7U3bcZhuFnzHbUmGpgCkVyjnKCpPtiXJGLPKgrrACcKOlcG0MzO7Jex/DwcFZs2ilk6DUPwDzLfrOk0QSNmk68J2BeIZPxHhFUJLvxvS6S5bX32oZjGSR5pGWzg+S2GIOVW6GHeUx9nNdEPpjWaZbH34nrWjExkpsAnOoQLQuNAEZJfg7AH1iIAVHGATwLwK8cxsPKGyQ3zRt5AL+69tzurDs3t+cvf/V1O8457pSdz3jMKACCaM5f/up1s+7c/Mdq37G1mtPG0V60lHh2AQyRPB/ASwE8GcB8L9A4gPXG1p8luSIb1TSFM8k47Hk7AF4B4FJJE8mzIecCAN+U9DYrYwPAP0t6Isk9llXbhvsyG8PJkt5A8lwAay2vqleNIkNVknMAvJLklUke2cvG317p/LET63mAdGxQ8k8FcD7JcwAstiMSgF0kVwH4GoDrAaxj8qgkG86DnkjyX+w0j4vIleZ6PIDvWZbzAHyV5GU5YidU0gXwaEmvIvl8AMN2vMQ+eP4Aye8AuAHAHX7GRD3N6x66cBGAd5LcZAKhkjSb5LsB3AxglqRLvGZLJZ0H4Ltxv1ZSkgrAmh7ec3eN5QvA/SQ3lIooCfdf9gwO3rVdajYaajeeombjsfksVtpdzWoNqt1ANdDIdZCY6LkArgLw2BLH+/MY08cXS/o6yUsAPFAayTSPpqRxksMA/tUeqzxnJ4Crk7xI8iySS4qx7bVxXCLpHxLk4TQKkyw+L5T0IRtMCWe6XvBXZdgyVfTIzzUc69rwPw7glSVsDKZR0mKSz5X0bgDvJfkx/z8/az6AM9NzlHQ+kvffT+evLtBIjt5vlvR+j63uWCjpTJJvtdG+CcDWWPsMK0k+1npS6s8sAMdJ+hbJk5OMhurqBLBXDCAcuKxhYTVqFpWeNBKGngDSu84+VhpoAISgfQkppXFKHa/QTkgVBPDBBD2w4FsAfMXGMW4FiVDYSfWUjv/2fAA/BLDEvzemmaDFg8dJNiXdAGDQXqqb4EJEy7uC2IhpWlHGU+6wFsClAD5l45hg0Ppg4RiPUnRYQvKFKSFHgjnwvIetFI2cl0zlHCTF/RcDuN3GUVkOXct7PGQfsiC5gORVAD4RESQZfsChsai7pPnE946JBEjaXdROAqL9I4Cr/KzxtObjRg4dz3fcY15G8nZJx+e1TxB41OMaTTUZGC3dRvJkSWOx1rleAwCtIqFVwqm9EvFJdQ8/rBoZGZkURhZsPiOj4cb+FdYH2aRqdit7tJeQ/GhixdqRpEdSHkVNK6CsfAvNs58OYFc/HF6wW7AXPc2RZCAW1gbwpwDucM7WSfdoJEgY81kE4MoEFVo5KtQktSUJomItLpb05TJ6+/qLM/5Pc1KfuVcmYr4C4PE24oEEuZsF/Ox6HSrnJa8nuRrAX6aIzUzhF/ILQ2ql2lu7SOC7AD4g6WIrf9PndAunFIxrKyn+SQC+5O6MbpHMlwwmbSSXO2fLOrYf6/iIVpBrAQWBubetpRO4uZI+loyjlQTdJLkBwN0kq5wEG/uPAjgJwGX9quMJErb8/SIAb7AitBJF2gDwAYfxZkCdKWYj31M50Stpyrp7BK0T1HOKEi8k+QR7toar8JUV+0WBt1Oy3RNmJWwOAJdJerKj5WBmjkj+EMA/AbiJ5PpUM2o40gLA+w1dxtJ6jQII8mSiSdXT6wLYAmCjz91e5FKnA3iPz296rpW/rwZwo6RrAfx3yCEl8GMkz5R0acmY1a0RyWZBoqio5+wPsQ7J4WEN/HpnJMMXAPgdh7tW4YXeaQh1qsPj96J+4HnFIr/OFfpuEmKvmsQ2kotIfnKyye4zTpKfJfne8Dr9UdtE53J4uGZipfrSajb8kZRTdAAMSLqgoCQBYJmVo5MWftVUhcCgnCUdaYeALGef9non7JeYsFgC4MtJkRv28DQUjmT8Z5IeJ+npkV8kiAUAqyWdIek0SY+X9LYMrSS9NQwtQcDGPooTS0xGvMbtQW8t6koRYV7vjpDuVHU7P69rJ9QKZJOXKL4fWgMBoAbRPWIw9OdlCbIg4cUrJH0YwGbDp5+7Cv2ApD32RjvcznAUgN9LFOBUyfA8ADfag3bS4rcNqV71EM2+Kek7JC/yWE4l+VJHoF7evfJ1n3Mek8e5DMAsR9kuyQFJy3KxE8CvAXy+T4dAyOOZhqSdzJA5KlxTXLNF0ksSAVJJatrRPAfAbOOnUQCrSd4TBcJifuMk77Xx3Edyk1PWLskjSD4nRcOuP3/m9pmdRb/XR50H0Yoehr8YwNnRztSrzmUH1gSwgeTlzi9PI/kkAP+VYOjM7wfpd4wvmoOjblrV3b300QskLSnhihmhawrmpQngfwGcSXJuoRANAJsSVu3F5OyV9PcAnpqgVWDttZJeGs9KnHu/bouAhV8EcF4f49wvepgMudMV9AuteF0Av+umz5s8hheRPMnjCrd3M4BVZVG3LnKSPCt5SwUBYOU93ZRqN/XrbbeBLHKkCuU7AcCJjnqxNkOJBs7PpGXTMURSYrBOAnCclZIpp7oTwJMkHUEy4G0TwHZJ64NYShEUAM4wJd1rjQIqbgFwTpJZLdvXmnEI1QdY7B1egNGF8wDgGBeDkLpTm+66XW2Bx6J1jbnXux6CIjHr2ZKQjG/I/VBVKoI2jaPPswG2Iu8IMmOKNgYl7PvBwMeJCVNqJZmqHaUD4DoAF4YCpYT8pkQaoKB1rzcrVTvvBNFgpS6LhQJwTR8nUCX5hVM5uuacXp0HMZdqZGQEw8PDQXIsLgy76bktM0vVi2TpJl2JOS+aYg6KXI7kZyStMq07ltag6tWLNTNJeJ+jO38AaDLYj4EapmePYcVErSQo0eQ9SsFVfcw2vFQ3tUPEgv8FgB+QHAyKcJr1lKBntwK4y9eMxcL1M7D0jLlmrdYCODY6CSQ9D8BJhjJ/mCTcBHAfgO/0azZNxjknG02uWUzBsuX2mAxfhw6CpsybRg9b3diaNfBxdp8Oh7j4Z/4adHHtrtKZh1h9dIt7OnCjYvDdzUIo7cL75Aq4HkIncGZ6WskrhoBfDeDTALYeaHt4UKJu2UFpHNM8oki5HMAbPb+OKdI/kbTb4+qka75QUKz9miazx1SCHlujHaTGMEoWTpJmuQNjP+Xtpdw1BV9EM2URaUhyh//XKNrkWZNjRNHzgWl2Uuzp1ez4yBpIn2Porm1obhtDZ8HgFifbxxTQYRHJowFsTCwRe+0rCO47G1RdBJG0F8CIdzV2TV92AJxO8t8lPSdj4l57MnpEAfYTfH9uDzcCeGPugUvM06Tai6Qbk9JiKrkUVezScZwv6Q7v6akS5TpqMqSR4Zuj766c1PaCV1FwDlg0PDycAfiaPL6UE35S0vtILki0eSCJnWWzqB3HeNTJpuu6p1qjQ24gg3dvx8bXDjfmrVi9FsC9biGZqCaTPMYJ6rUJDkUyvFzSY+wR6RaVRwF4u/uzahkdC3ZQ0tsB/C3Jp4WXNgPzbBMDr0stHNNuo67JhXAAUSj6ib7resRTkrI+Jnn9UK7vkryjFynRw/h+lPOPJM+TSd5imJjbTo6yjMZSBG7aof20bq49Ish4jqzJoO920rwgRXQAeJobU3fVyPbs1E6SH/2TogG1Nyc/jfU55AbC0QpDq7YGlLnZHHxQnuFU/s5NkbelSX08sHjNRO+ZIknPsGKTawy/CLhlI+kAeK0Jgr9xz1NnmhCrX7/VdNtfKkeRp6SIGpCykRb4huk8t1DMb5HcbbyuBFf+yq0nt6dr5pP8pqRTa+59HYALiqJtB8DeomcNJBcDeB6Abxg2R1W+4R7A77vwGUXgyizT5SSvKHrEPgjgXTVy32xGbNdUxdJy+8BUxyGvg4BAd/5ALNy1xoZtK2v0Zi0AcCvJb5rJucsFrW5qi95rBbsWwD3eOdjPox5B8pcA/ixaZmw4waJ8kOTLw8OmPeAzI4q0cP78vBe7lQqNESlb9uBfnO5ip8r0fS7ARZIacp7vnaCfAvBmG8xPbRzdtC8njOEjhSOi4diakGfqEGi7tWUlyXtIfiLXvCRd3QOm/pW3C78DwJ+TXCHpXakgq+h3A3CNpM12rgdloQ69gQDY/rzFUXy61/09SE2J0bPfcEHnjwA8LlVam174IZI7JL0v9f/0e3THi3MVyS84ikSVOIzrBpJnpkT5kToGrMjfSLicyZCj9rGmX3Leg+F7N4DNkgbCSCznIVfRrwJwuaQTU+0JxvhNR/Af5W28zjFA8tv29rEdOGBq21XxRdGlnZzSV220rdS+Ej14zwbwIQAfBvDslO/QkHgQwL2S/jruebC29TamCRsyZqzSmyumG64ebMBj0YwngOMVUpvylZKu86Iz1REmunm9YNGrM+YtnZD0CpL3pxCNYmOTiupMblC72AxI2xCr4We3AXxJ0rGZZbMCZLlMwtXTME4V+YR6JJHX5xpDwdpdXzynHI+KjtkYc9OG9TKzVm3PValLejzJmpZJZZbtG5LeUkDCnKhf4yr1gLt7u44iVXh7SXtqxvYaw7vBeDOK79uxIeSu6crjGyC5C8B5JHeknYZlHqIEUR++gRShPjxn2/ADnvx0zbQ9kfMoPJHa+6xrgoTPSnGBO2LpaxvFWKP/qulepQcAPIvkzeV+kNwqXnOv8HgDJLcCuCg2Tzn5iXEfT/JrjlLdlOC2U7U5Oo3b/SruweEXY4p7NQoW5mtmnVpp7C0TGrcUUaGZ1qnhTU+56zgX2JoA/lPS052Dxa7RRqJ1g05tOHo2rfwvynlRTS1ooze5rfUYmtFNK2kwyTzWKKrzu90Gc4OviTk3UydujC+6fX8C4GkAflq3FygROwNJdhPR7iEbSOGZttjy15tu3SJpXaps96ukbzSW3uDv2wFsgFBFRSJ5t1Cgy9w2cK17rmJRQ2h7AfzcbcunAPh22qZbjn+7Pc96t6FsMlMzVrBi3yL5njTXTZI2eaGfJOkjBTuzyYu6wXLZ7u9TMSQxsF32iDGm9R7PnhSdgkb9tD34Op/Xca1mb0ED7/Y94p7rrDCTNrwlA2ySvN27Nd8E4HZJO2ykrdQMug7Av0k6J3K/3BJSUKUBh78P4IkA3uPC6xpJm9wdPGqdKvOjMJJlfmnFcs8lCqItK/ZO3/+1ks40Xd8s9DHmutPf11kmGyzjvdNJU3quYt7Ubx56VvJU4Tk2RKW35JIXfGYZBn+xDY1d49j5zOOOVrvRZi6Bd9Sd9fPNG9VuVtXsJo752J0lVMvMyBxvXz3GXnu3u0N/UbPFcr8o6De1zCmSdlqpx8vilqRje+zXGJK0OsK86zPtIkmtvKi1RcJEFc/xLryyj2xLTeFswM/KL//emAw8xj4bwBE199wab1EZGRkp3xjTKODoCSRPcHW7a2bol0mhg0FT+eLxcjtvfpMigEdJmhssnDsktpSUbHRHJAh/pFv7j7QT2w7gfuerE3OY4hVJcz2X/OI6mlbe+7DqIMnCtoSASn67b/6x7/8b+1nqypUry4373RRWdwH4MerfOdvMzEosWGHg29zpO1VxL4fltf24fY9z41T/71Wwiwhi7Dzl+XhwN+KaqeoM/r47RYuesi6MpCq6aO/zT/msRvQqZbiWlSvf1+cxdQvvcGW8J+2a88T0AorNkm7v0Y8VTnHSK00LQ92Zi4pTVfsfTh2EPVoJ1Dc+eUz1aSiVY1j2RHnx8psZi6YylTvI4h41463rNFfNHuxJLTv5PkUtAXWv00GfvR811evpNFiiZkei+qGCNLf9IF+Wtc/pFquWA/5+7wru5XXj7367SLk+rNOf/F6stPZ5b3nuucvJdrfXeMrNanmN07xw+Dh8HD4OH4ePw8fMHP8Hl6+35dUl8lgAAAAASUVORK5CYII=' /><h3>TickrMeter Wifi Setup</h3>";

const char * const HTTP_PORTAL_MENU[] PROGMEM = {
// "<form action='/wifi' method='get'><button onclick='showSpinner(this)'>Find WiFi!</button></form><br/>\n", // MENU_WIFI
// "<form action='/0wifi' method='get'><button>Find WiFi (No scan)</button></form><br/>\n", // MENU_WIFINOSCAN
"", // MENU_INFO
"",//MENU_PARAM
"", // MENU_CLOSE
"",// MENU_RESTART
"",  // MENU_EXIT
"", // MENU_ERASE
"",// MENU_UPDATE
// "<form action='/param'   method='get'><button>Setup</button></form><br/>\n",//MENU_PARAM
// "<form action='/close'   method='get'><button>Close</button></form><br/>\n", // MENU_CLOSE
// "<form action='/restart' method='get'><button>Restart</button></form><br/>\n",// MENU_RESTART
// "<form action='/exit'    method='get'><button>Exit</button></form><br/>\n",  // MENU_EXIT
// "<form action='/erase'   method='get'><button class='D'>Reset</button></form><br/>\n", // MENU_ERASE
// "<form action='/update'  method='get'><button>Manual Firmware</button></form><br/>\n",// MENU_UPDATE
// "<hr><br/>" // MENU_SEP
};

// const char HTTP_PORTAL_OPTIONS[]   PROGMEM = strcat(HTTP_PORTAL_MENU[0] , HTTP_PORTAL_MENU[3] , HTTP_PORTAL_MENU[7]);
const char HTTP_PORTAL_OPTIONS[]   PROGMEM = "<a href='/wifi' style='text-decoration:none' onclick='return false'><button onclick='showSpinner(this)'>Setup WiFi</button></a><br/>\n"; // MENU_WIFI;
const char HTTP_ITEM_QI[]          PROGMEM = "<div role='img' aria-label='{r}%' title='{r}%' class='q q-{q} {i} {h}'></div>"; // rssi icons
const char HTTP_ITEM_QP[]          PROGMEM = "<div class='q {h}'>{r}%</div>"; // rssi percentage {h} = hidden showperc pref
const char HTTP_ITEM[]             PROGMEM = "<div><a href='#p' onclick='c(this)' data-ssid='{V}'>{v}</a>{qi}{qp}</div>"; // {q} = HTTP_ITEM_QI, {r} = HTTP_ITEM_QP
// const char HTTP_ITEM[]            PROGMEM = "<div><a href='#p' onclick='c(this)'>{v}</a> {R} {r}% {q} {e}</div>"; // test all tokens

const char HTTP_FORM_START[]       PROGMEM = "<form method='POST' action='{v}'>";
const char HTTP_FORM_WIFI[]        PROGMEM = "<label for='s'>SSID</label><input id='s' name='s' maxlength='32' autocorrect='off' autocapitalize='none' placeholder='{v}'><br/><label for='p'>Password</label><input id='p' name='p' maxlength='64' type='password' placeholder='{p}'><input type='checkbox' onclick='f()'> Show Password";
const char HTTP_FORM_WIFI_END[]    PROGMEM = "";
const char HTTP_FORM_STATIC_HEAD[] PROGMEM = "<hr><br/>";
const char HTTP_FORM_END[]         PROGMEM = "<br/><br/><button type='submit'>Save</button></form>";
const char HTTP_FORM_LABEL[]       PROGMEM = "<label for='{i}'>{t}</label>";
const char HTTP_FORM_PARAM_HEAD[]  PROGMEM = "<hr><br/>";
const char HTTP_FORM_PARAM[]       PROGMEM = "<br/><input id='{i}' name='{n}' maxlength='{l}' value='{v}' {c}>\n"; // do not remove newline!

const char HTTP_SCAN_LINK[]        PROGMEM = "<br/><form action='/wifi?refresh=1' method='POST'><button name='refresh' value='1'>Refresh</button></form>";
const char HTTP_SAVED[]            PROGMEM = "<div class='msg'>Device will now connect to the WiFi network. You can close this page.</div>";
const char HTTP_PARAMSAVED[]       PROGMEM = "<div class='msg S'>Saved<br/></div>";
const char HTTP_END[]              PROGMEM = "</div></body></html>";
const char HTTP_ERASEBTN[]         PROGMEM = "<br/><form action='/erase' method='get'><button class='D'>Erase WiFi config</button></form>";
const char HTTP_UPDATEBTN[]        PROGMEM = "<br/><form action='/update' method='get'><button>Update</button></form>";
const char HTTP_BACKBTN[]          PROGMEM = "<hr><br/><form action='/' method='get'><button>Back</button></form>";

const char HTTP_STATUS_ON[]        PROGMEM = "<div class='msg S'><strong>Connected</strong> to {v}<br/><em><small>with IP {i}</small></em></div>";
const char HTTP_STATUS_OFF[]       PROGMEM = "<div class='msg {c}'><strong>Not connected</strong> to {v}{r}</div>"; // {c=class} {v=ssid} {r=status_off}
const char HTTP_STATUS_OFFPW[]     PROGMEM = "<br/>Authentication failure"; // STATION_WRONG_PASSWORD,  no eps32
const char HTTP_STATUS_OFFNOAP[]   PROGMEM = "<br/>AP not found";   // WL_NO_SSID_AVAIL
const char HTTP_STATUS_OFFFAIL[]   PROGMEM = "<br/>Could not connect"; // WL_CONNECT_FAILED
const char HTTP_STATUS_NONE[]      PROGMEM = "<div class='msg'>No AP set</div>";
const char HTTP_BR[]               PROGMEM = "<br/>";

const char HTTP_STYLE[]            PROGMEM = "<style>"
".c,body{text-align:center;font-family:verdana}div,input,select{padding:5px;font-size:1em;margin:5px 0;box-sizing:border-box}"
"input,button,select,.msg{border-radius:.3rem;width: 100%}input[type=radio],input[type=checkbox]{width:auto}"
"button,input[type='button'],input[type='submit']{cursor:pointer;border:0;background-color:#0eb663;color:#fff;line-height:2.4rem;font-size:1.2rem;width:100%}"
"input[type='file']{border:1px solid #1fa3ec}"
".wrap {text-align:left;display:inline-block;min-width:260px;max-width:500px}"
// links
"a{color:#000;font-weight:700;text-decoration:none}a:hover{color:#1fa3ec;text-decoration:underline}"
// quality icons
".q{height:16px;margin:0;padding:0 5px;text-align:right;min-width:38px;float:right}.q.q-0:after{background-position-x:0}.q.q-1:after{background-position-x:-16px}.q.q-2:after{background-position-x:-32px}.q.q-3:after{background-position-x:-48px}.q.q-4:after{background-position-x:-64px}.q.l:before{background-position-x:-80px;padding-right:5px}.ql .q{float:left}.q:after,.q:before{content:'';width:16px;height:16px;display:inline-block;background-repeat:no-repeat;background-position: 16px 0;"
"background-image:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAAQCAMAAADeZIrLAAAAJFBMVEX///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADHJj5lAAAAC3RSTlMAIjN3iJmqu8zd7vF8pzcAAABsSURBVHja7Y1BCsAwCASNSVo3/v+/BUEiXnIoXkoX5jAQMxTHzK9cVSnvDxwD8bFx8PhZ9q8FmghXBhqA1faxk92PsxvRc2CCCFdhQCbRkLoAQ3q/wWUBqG35ZxtVzW4Ed6LngPyBU2CobdIDQ5oPWI5nCUwAAAAASUVORK5CYII=');}"
// icons @2x media query (32px rescaled)
"@media (-webkit-min-device-pixel-ratio: 2),(min-resolution: 192dpi){.q:before,.q:after {"
"background-image:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALwAAAAgCAMAAACfM+KhAAAALVBMVEX///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAOrOgAAAADnRSTlMAESIzRGZ3iJmqu8zd7gKjCLQAAACmSURBVHgB7dDBCoMwEEXRmKlVY3L//3NLhyzqIqSUggy8uxnhCR5Mo8xLt+14aZ7wwgsvvPA/ofv9+44334UXXngvb6XsFhO/VoC2RsSv9J7x8BnYLW+AjT56ud/uePMdb7IP8Bsc/e7h8Cfk912ghsNXWPpDC4hvN+D1560A1QPORyh84VKLjjdvfPFm++i9EWq0348XXnjhhT+4dIbCW+WjZim9AKk4UZMnnCEuAAAAAElFTkSuQmCC');"
"background-size: 95px 16px;}}"
// msg callouts
".msg{padding:20px;margin:20px 0;border:1px solid #eee;border-left-width:5px;border-left-color:#777}.msg h4{margin-top:0;margin-bottom:5px}.msg.P{border-left-color:#1fa3ec}.msg.P h4{color:#1fa3ec}.msg.D{border-left-color:#dc3630}.msg.D h4{color:#dc3630}.msg.S{border-left-color: #5cb85c}.msg.S h4{color: #5cb85c}"
// lists
"dt{font-weight:bold}dd{margin:0;padding:0 0 0.5em 0;min-height:12px}"
"td{vertical-align: top;}"
".h{display:none}"
"button{transition: 0s opacity;transition-delay: 3s;transition-duration: 0s;cursor: pointer}"
"button.D{background-color:#dc3630}"
"button:active{opacity:50% !important;cursor:wait;transition-delay: 0s}"
// invert
"body.invert,body.invert a,body.invert h1 {background-color:#060606;color:#fff;}"
"body.invert .msg{color:#fff;background-color:#282828;border-top:1px solid #555;border-right:1px solid #555;border-bottom:1px solid #555;}"
"body.invert .q[role=img]{-webkit-filter:invert(1);filter:invert(1);}"
":disabled {opacity: 0.5;}"
".spinner{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-radius:50%;border-top-color:#fff;animation:spin 1s ease-in-out infinite;margin-right:8px}"
"@keyframes spin{to{transform:rotate(360deg)}}"
"</style>";

const char HTTP_HELP[]             PROGMEM = "";

const char HTTP_UPDATE[] PROGMEM = "Upload new firmware<br/><form method='POST' action='u' enctype='multipart/form-data' onchange=\"(function(el){document.getElementById('uploadbin').style.display = el.value=='' ? 'none' : 'initial';})(this)\"><input type='file' name='update' accept='.bin,application/octet-stream'><button id='uploadbin' type='submit' class='h D'>Update</button></form><small><a href='http://192.168.4.1/update' target='_blank'>* May not function inside captive portal, open in browser http://192.168.4.1</a><small>";
const char HTTP_UPDATE_FAIL[] PROGMEM = "<div class='msg D'><strong>Update failed!</strong><Br/>Reboot device and try again</div>";
const char HTTP_UPDATE_SUCCESS[] PROGMEM = "<div class='msg S'><strong>Update successful.  </strong> <br/> Device rebooting now...</div>";


// Info html
// @todo remove html elements from progmem, repetetive strings
#ifdef ESP32
	const char HTTP_INFO_esphead[]    PROGMEM = "<h3>esp32</h3><hr><dl>";
	const char HTTP_INFO_chiprev[]    PROGMEM = "<dt>Chip rev</dt><dd>{1}</dd>";
  	const char HTTP_INFO_lastreset[]  PROGMEM = "<dt>Last reset reason</dt><dd>CPU0: {1}<br/>CPU1: {2}</dd>";
  	const char HTTP_INFO_aphost[]     PROGMEM = "<dt>Access point hostname</dt><dd>{1}</dd>";
    const char HTTP_INFO_psrsize[]    PROGMEM = "<dt>PSRAM Size</dt><dd>{1} bytes</dd>";
	const char HTTP_INFO_temp[]       PROGMEM = "<dt>Temperature</dt><dd>{1} C&deg; / {2} F&deg;</dd>";
    const char HTTP_INFO_hall[]       PROGMEM = "<dt>Hall</dt><dd>{1}</dd>";
#else
	const char HTTP_INFO_esphead[]    PROGMEM = "<h3>esp8266</h3><hr><dl>";
	const char HTTP_INFO_fchipid[]    PROGMEM = "<dt>Flash chip ID</dt><dd>{1}</dd>";
	const char HTTP_INFO_corever[]    PROGMEM = "<dt>Core version</dt><dd>{1}</dd>";
	const char HTTP_INFO_bootver[]    PROGMEM = "<dt>Boot version</dt><dd>{1}</dd>";
	const char HTTP_INFO_lastreset[]  PROGMEM = "<dt>Last reset reason</dt><dd>{1}</dd>";
	const char HTTP_INFO_flashsize[]  PROGMEM = "<dt>Real flash size</dt><dd>{1} bytes</dd>";
#endif

const char HTTP_INFO_memsmeter[]  PROGMEM = "<br/><progress value='{1}' max='{2}'></progress></dd>";
const char HTTP_INFO_memsketch[]  PROGMEM = "<dt>Memory - Sketch size</dt><dd>Used / Total bytes<br/>{1} / {2}";
const char HTTP_INFO_freeheap[]   PROGMEM = "<dt>Memory - Free heap</dt><dd>{1} bytes available</dd>";
const char HTTP_INFO_wifihead[]   PROGMEM = "<br/><h3>WiFi</h3><hr>";
const char HTTP_INFO_uptime[]     PROGMEM = "<dt>Uptime</dt><dd>{1} mins {2} secs</dd>";
const char HTTP_INFO_chipid[]     PROGMEM = "<dt>Chip ID</dt><dd>{1}</dd>";
const char HTTP_INFO_idesize[]    PROGMEM = "<dt>Flash size</dt><dd>{1} bytes</dd>";
const char HTTP_INFO_sdkver[]     PROGMEM = "<dt>SDK version</dt><dd>{1}</dd>";
const char HTTP_INFO_cpufreq[]    PROGMEM = "<dt>CPU frequency</dt><dd>{1}MHz</dd>";
const char HTTP_INFO_apip[]       PROGMEM = "<dt>Access point IP</dt><dd>{1}</dd>";
const char HTTP_INFO_apmac[]      PROGMEM = "<dt>Access point MAC</dt><dd>{1}</dd>";
const char HTTP_INFO_apssid[]     PROGMEM = "<dt>Access point SSID</dt><dd>{1}</dd>";
const char HTTP_INFO_apbssid[]    PROGMEM = "<dt>BSSID</dt><dd>{1}</dd>";
const char HTTP_INFO_stassid[]    PROGMEM = "<dt>Station SSID</dt><dd>{1}</dd>";
const char HTTP_INFO_staip[]      PROGMEM = "<dt>Station IP</dt><dd>{1}</dd>";
const char HTTP_INFO_stagw[]      PROGMEM = "<dt>Station gateway</dt><dd>{1}</dd>";
const char HTTP_INFO_stasub[]     PROGMEM = "<dt>Station subnet</dt><dd>{1}</dd>";
const char HTTP_INFO_dnss[]       PROGMEM = "<dt>DNS Server</dt><dd>{1}</dd>";
const char HTTP_INFO_host[]       PROGMEM = "<dt>Hostname</dt><dd>{1}</dd>";
const char HTTP_INFO_stamac[]     PROGMEM = "<dt>Station MAC</dt><dd>{1}</dd>";
const char HTTP_INFO_conx[]       PROGMEM = "<dt>Connected</dt><dd>{1}</dd>";
const char HTTP_INFO_autoconx[]   PROGMEM = "<dt>Autoconnect</dt><dd>{1}</dd>";

const char HTTP_INFO_aboutver[]     PROGMEM = "<dt>WiFiManager</dt><dd>{1}</dd>";
const char HTTP_INFO_aboutarduino[] PROGMEM = "<dt>Arduino</dt><dd>{1}</dd>";
const char HTTP_INFO_aboutsdk[]     PROGMEM = "<dt>ESP-SDK/IDF</dt><dd>{1}</dd>";
const char HTTP_INFO_aboutdate[]    PROGMEM = "<dt>Build date</dt><dd>{1}</dd>";

const char S_brand[]              PROGMEM = "WiFiManager";
const char S_debugPrefix[]        PROGMEM = "*wm:";
const char S_y[]                  PROGMEM = "Yes";
const char S_n[]                  PROGMEM = "No";
const char S_enable[]             PROGMEM = "Enabled";
const char S_disable[]            PROGMEM = "Disabled";
const char S_GET[]                PROGMEM = "GET";
const char S_POST[]               PROGMEM = "POST";
const char S_NA[]                 PROGMEM = "Unknown";
const char S_passph[]             PROGMEM = "********";
const char S_titlewifisaved[]     PROGMEM = "Credentials saved";
const char S_titlewifisettings[]  PROGMEM = "Settings saved";
const char S_titlewifi[]          PROGMEM = "Config ESP";
const char S_titleinfo[]          PROGMEM = "Info";
const char S_titleparam[]         PROGMEM = "Setup";
const char S_titleparamsaved[]    PROGMEM = "Setup saved";
const char S_titleexit[]          PROGMEM = "Exit";
const char S_titlereset[]         PROGMEM = "Reset";
const char S_titleerase[]         PROGMEM = "Erase";
const char S_titleclose[]         PROGMEM = "Close";
const char S_options[]            PROGMEM = "options";
const char S_nonetworks[]         PROGMEM = "No networks found. Refresh to scan again.";
const char S_staticip[]           PROGMEM = "Static IP";
const char S_staticgw[]           PROGMEM = "Static gateway";
const char S_staticdns[]          PROGMEM = "Static DNS";
const char S_subnet[]             PROGMEM = "Subnet";
const char S_exiting[]            PROGMEM = "Exiting";
const char S_resetting[]          PROGMEM = "Module will reset in a few seconds.";
const char S_closing[]            PROGMEM = "You can close the page, portal will continue to run";
const char S_error[]              PROGMEM = "An error occured";
const char S_notfound[]           PROGMEM = "File not found\n\n";
const char S_uri[]                PROGMEM = "URI: ";
const char S_method[]             PROGMEM = "\nMethod: ";
const char S_args[]               PROGMEM = "\nArguments: ";
const char S_parampre[]           PROGMEM = "param_";

// debug strings
const char D_HR[]                 PROGMEM = "--------------------";


// softap ssid default prefix
#ifdef ESP8266
    const char S_ssidpre[]        PROGMEM = "ESP";
#elif defined(ESP32)
    const char S_ssidpre[]        PROGMEM = "ESP32";
#else
    const char S_ssidpre[]        PROGMEM = "WM";
#endif

// END WIFI_MANAGER_OVERRIDE_STRINGS
// #endif

#endif
