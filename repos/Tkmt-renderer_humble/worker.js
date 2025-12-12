const { parentPort, workerData } = require('worker_threads');
const { join } = require('path');
const { writeFile } = require('fs');
const Resvg = require('resvg');
const { createCanvas } = require('canvas');

// Function to render SVG and save as PNG
function renderSvg(svg, opts, index) {
  const resvg = new Resvg(svg, opts);
  const pngData = resvg.render();
  const filePath = join(__dirname, './text-out'+index+'.png');
  writeFile(filePath, pngData.asPng(), (err) => {
    if (err) throw err;
    console.log(`The file ${filePath} has been saved!`);
  });
  const stringFromBytes = horizontal1bit(pngData.pixels, pngData.width);
  return stringFromBytes;
}

// Function to generate horizontal 1-bit representation of PNG data
function horizontal1bit(data, canvasWidth) {
    let byteIndex = 7;
    let number = 0;
    let byteArray = [];
    // format is RGBA, so move 4 steps per pixel
    for (let index = 0; index < data.length; index += 4) {
      // Get the average of the RGB (we ignore A)
      const avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
      if (avg > 128) {
        number += 2 ** byteIndex;
      }
      byteIndex--;
  
      // if this was the last pixel of a row or the last pixel of the
      // image, fill up the rest of our byte with zeros so it always contains 8 bits
      if ((index !== 0 && (((index / 4) + 1) % (canvasWidth)) === 0) || (index === data.length - 4)) {
        // for(var i=byteIndex;i>-1;i--){
        // number += Math.pow(2, i);
        // }
        byteIndex = -1;
      }
  
      // When we have the complete 8 bits, combine them into a hex value
      if (byteIndex < 0) {
        byteArray.push(number);
        number = 0;
        byteIndex = 7;
      }
    }
    return byteArray;
  }

// Worker thread
const { index } = workerData;
const { svg, opts } = workerData;
const result = renderSvg(svg, opts);
parentPort.postMessage(`Worker ${index}: Done`);