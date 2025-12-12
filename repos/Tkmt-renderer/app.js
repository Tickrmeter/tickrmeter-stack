"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const resvg_js_1 = require("@resvg/resvg-js");
const fs_2 = require("fs");
// import mqtt from 'mqtt';
// import jp from 'jsonpath';
const xmldom_1 = require("xmldom");
const path_1 = require("path");
//$..name[(@.length-1)] will return the index of the current element
// const mappingJson: { [key: string]: string } = { "field1": "$.artist", "field2": "$..name", "field3": "$..name", "field4": "$.tracks[0].name", "field5": "$.tracks[0].streamCount" };
const mappingJson = { "field1": "Blabla", "field2": "new value", "field3": "Text", "graph": { "values": [12, 32, 1, 2, 90, 23, 12, 32], "mark": 4 } };
//load the svg file
let svg = fs_1.default.readFileSync(__dirname + '/elec.svg', 'utf8');
for (const [key, value] of Object.entries(mappingJson)) {
    if (key === 'graph') {
        continue;
    }
    svg = svg.replace(new RegExp('{{' + key + '}}', 'g'), String(value));
}
const doc = new xmldom_1.DOMParser().parseFromString(svg, 'image/svg+xml');
//resize svg to 296x126
doc.documentElement.setAttribute('width', '296');
doc.documentElement.setAttribute('height', '126');
//if mapping has a graph, draw it
if (mappingJson['graph']) {
    // drawGraph(doc);
    // }
    // function drawGraph(doc: Document) {
    console.log('draw graph');
    //find the object with id="graph"
    const graph = doc.getElementById('graph');
    if (!graph) {
        throw new Error('Graph element in the json data but not found in the svg');
    }
    //get the width and height of the graph
    const graphWidth = parseInt(graph.getAttribute('width'));
    const graphHeight = parseInt(graph.getAttribute('height'));
    //and x y position
    const graphX = parseInt(graph.getAttribute('x'));
    const graphY = graph.getAttribute('y');
    //get the values from the json
    const values = mappingJson['graph'].values;
    //calculate the step of each bar
    const barWidth = graphWidth / values.length;
    //bar width is 80% of the step
    const barWidth80 = barWidth * 0.8;
    //calculate the max value scaled to the height of the graph
    const maxValue = Math.max(...values);
    const maxValueScaled = graphHeight / maxValue;
    //calculate the x position of the first bar
    let barX = graphX + barWidth * 0.1;
    //for each value
    for (let i = 0; i < values.length; i++) {
        //calculate the height of the bar
        const barHeight = values[i] * maxValueScaled;
        //calculate the y position of the bar
        const barY = (parseFloat(graphY ?? '0')) + graphHeight - barHeight;
        //create a new rect element
        const rect = doc.createElement('rect');
        //set the attributes
        rect.setAttribute('x', barX.toString());
        rect.setAttribute('y', barY.toString());
        rect.setAttribute('width', barWidth80.toString());
        rect.setAttribute('height', barHeight.toString());
        rect.setAttribute('fill', '#000000');
        //add the rect to the graph
        graph.appendChild(rect);
        //if the mark is set for this bar, add an arrow on top
        if (mappingJson['graph'].mark == i) {
            //create a new polygon element
            const polygon = doc.createElement('polygon');
            //calculate the points of the arrow
            const points = (barX + barWidth80 / 2).toString() + ',' + barY.toString() + ' ' + (barX + barWidth80).toString() + ',' + (barY + barHeight / 2).toString() + ' ' + (barX + barWidth80 / 2).toString() + ',' + (barY + barHeight).toString() + ' ' + barX.toString() + ',' + (barY + barHeight / 2).toString();
            //set the attributes
            polygon.setAttribute('points', points);
            polygon.setAttribute('fill', '#000000');
            //add the polygon to the graph
            graph.appendChild(polygon);
        }
        //move the x position to the next bar
        barX += barWidth;
    }
}
svg = doc.toString();
// write the svg to a file
fs_1.default.writeFileSync(__dirname + '/text-out.svg', svg);
function horizontal1bit(data, canvasWidth) {
    let byteIndex = 7;
    let number = 0;
    const byteArray = [];
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
const opts = {
    background: 'rgba(255, 255, 255, 1)',
    font: {
        fontFiles: ['OpenSans-Regular.ttf'],
        defaultFontFamily: 'Open Sans',
    },
    logLevel: 'warn', // Default Value: error
};
//loadSystemFonts: true, // It will be faster to disable loading system fonts.
//run this 100 times to get a feeling for the performance
for (let i = 0; i < 100; i++) {
    const resvg = new resvg_js_1.Resvg(svg, { ...opts, logLevel: "error" });
    //save as png 
    const pngData = resvg.render();
    //write to file
    (0, fs_2.writeFile)((0, path_1.join)(__dirname, './text-out.png'), pngData.asPng(), (err) => {
        if (err)
            throw err;
        console.log('The file has been saved!');
    });
    const stringFromBytes = horizontal1bit(pngData.pixels, pngData.width);
    console.log(stringFromBytes[120]);
}
// const resvg = new Resvg(svg, opts)
// const pngData = resvg.render()
// const stringFromBytes = horizontal1bit(pngData.pixels, pngData.width);
// // console.log(stringFromBytes);
// sendBinaryPage(42, stringFromBytes);
