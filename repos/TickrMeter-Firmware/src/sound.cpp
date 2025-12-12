// #include "sound.h"
// bool playsoundonce;
// bool playsoundcontinous = false;
// int8_t audio1[] = {

// NOTE_E5, NOTE_F5
// };
// XT_DAC_Audio_Class DacAudio(25,0);
// XT_MusicScore_Class Music(audio1,TEMPO_ALLEGRO,INSTRUMENT_SAXOPHONE);


// void playAudio(){
//   digitalWrite(17, HIGH);
//   delay(100);
//   DacAudio.Play(&Music);
//   while (Music.Playing) {
//     yield();
//   }
//   digitalWrite(17, LOW);
// }


// void initSoundTask(){

// }


// // void play_sound(void * parameter)
// // {
// //   for (;;){
// //   DacAudio.FillBuffer();          // This needs only be in your main loop once, suggest here at the top.
// // //  int state = digitalRead(17);
// // //  Serial.print("STATE OF SPEAKER PIN : ");
// // //  Serial.println(state);
// //   if (playsoundcontinous)
// //   {
// //    DacAudio.Play(&Music);
// //    delay(500);
// //    Serial.println("PLAYING SOUND");
// //   }
// //   else{
// // //    Serial.println("NO SOUND");
// //     delay(500);
// //   }

// //   }
// // }