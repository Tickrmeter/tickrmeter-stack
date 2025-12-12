// void flashLightBar()
// {
//         delay(1000);
//         // blinkledcontinous = 1;
// }

// void playSoundAlert(String soundType, String soundDur)
// {
//       if (soundDur == "Continuous")
//       {
//         Serial.println("inside play sound true check");
//         delay(1000);
//         // playsoundcontinous = 1;
//         Serial.println("Play sound continous from inside");
//         Serial.println(playsoundcontinous);
//         digitalWrite(17, HIGH);
//         //    play_sound(soundType);
//       }

//       else if (soundDur == "Once")
//       {
//         // playsoundcontinous = false;
//         digitalWrite(17, HIGH);
//         Serial.println("PLAY SOUND ONCE");
//         playAudio();
//         delay(1000);
//         digitalWrite(17, LOW);
//       }
// }

// //Set alert with parameters: "flashLightbar":false,"playSound":false,"soundType":"bell","soundDur":"Once","changeLightBarColor":true,"lightBarColor":"Blue"}
// void alertOn(bool flashLightbar, bool PlaySound, String soundType, String soundDur, bool changeLightBarColor, String lightBarColor){
//   if (flashLightbar)
//   {
//     flashLightBar();
//   }
//   if (PlaySound)
//   {
//     playSoundAlert(soundType, soundDur);
//   }else{
//     // playsoundcontinous = false;
//     digitalWrite(17, LOW);
//   }

//   if (changeLightBarColor)
//   {

//       if (!flashLightbar )
//       {
//         lightBarColor.toLowerCase();
//         glowLed(lightBarColor);
//       }
//       else if (flashLightbar)
//       {
//         // Serial.println("inside play sound true check");
//         // delay(1000);
//         Serial.println("flashLightbar continous from inside");
//         // Serial.println(playsoundcontinous);
//       }
//   }
// }

