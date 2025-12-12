"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var resvg_js_1 = require("@resvg/resvg-js");
var buffer_1 = require("buffer");
var xmldom_1 = require("xmldom");
var templateDirectory = __dirname + '/../templates';
var pageDirectory = __dirname + '/../pages';
var opts = {
    background: 'rgba(255, 255, 255, 1)',
    font: {
        fontDirs: [__dirname + '/../fonts'],
        defaultFontFamily: 'SF Pro Display',
        loadSystemFonts: false
    },
    shapeRendering: 1,
    logLevel: "warn", // Default Value: error
};
// 
function render(mapping, template, pageNumber) {
    //Options for the resvg renderer
    var svgFile = fs_1.default.readFileSync(templateDirectory + '/' + template, 'utf8');
    var doc = new xmldom_1.DOMParser().parseFromString(svgFile, 'image/svg+xml');
    //resize svg to 296x128
    doc.documentElement.setAttribute('width', '296');
    doc.documentElement.setAttribute('height', '128');
    for (var _i = 0, _a = Object.entries(mapping); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (key === 'graph') {
            continue;
        }
        //find the object with id="key"
        var element = doc.getElementById(key);
        if (!element) {
            console.warn('Element with id ' + key + ' not found in the svg');
            continue;
        }
        //set the text content
        element.textContent = String(value);
    }
    if (mapping['graph']) {
        drawGraph(doc, mapping);
    }
    var svg = doc.toString();
    var resvg = new resvg_js_1.Resvg(svg, opts);
    var pngData = resvg.render();
    var stringFromBytes = horizontal1bit(pngData.pixels, pngData.width);
    //debug save the png
    fs_1.default.writeFile(pageDirectory + '/' + pageNumber + '.png', pngData.asPng(), function (err) {
        if (err) {
            console.error(err);
            return;
        }
        //file written successfully
    });
    sendBinaryPage(pageNumber, stringFromBytes);
}
//if mapping has a graph, draw it
function drawGraph(doc, mappingJson) {
    var _a, _b, _c;
    // function drawGraph(doc: Document) {
    console.log('draw graph');
    //find the object with id="graph"
    var graph = doc.getElementById('graph');
    if (!graph) {
        console.warn('Graph element not found in the svg');
        return;
    }
    //Graph type is 1
    if (mappingJson['graph'].type == 1) {
        //get the width and height of the graph
        var graphWidth = parseFloat(graph.getAttribute('width'));
        console.log(graphWidth);
        graphWidth = Math.round(graphWidth);
        console.log(graphWidth + " after");
        var graphHeight = parseFloat(graph.getAttribute('height'));
        graphHeight = Math.round(graphHeight);
        //and x y position
        var graphX = parseFloat(graph.getAttribute('x'));
        graphX = Math.round(graphX);
        var graphY = parseFloat(graph.getAttribute('y'));
        graphY = Math.round(graphY);
        //get the values from the json
        var values = mappingJson['graph'].values;
        var barStep = graphWidth / values.length;
        barStep = Math.round(barStep);
        //bar width is 60% of the step
        var barWidth = Math.round(barStep * 0.5);
        //calculate the max value scaled to the height of the graph
        var maxValue = Math.max.apply(Math, values);
        var maxValueScaled = (graphHeight / maxValue);
        //calculate the x position of the first bar
        var barX = Math.round(graphX);
        //for each value
        for (var i = 0; i < values.length; i++) {
            //calculate the height of the bar
            var barHeight = Math.round(values[i] * maxValueScaled);
            //calculate the y position of the bar
            var barY = (graphY !== null && graphY !== void 0 ? graphY : '0') + graphHeight - barHeight;
            //create a new rect element
            var rect = doc.createElement('rect');
            //round corners
            // rect.setAttribute('rx', '0.52916664');
            rect.setAttribute('ry', '2');
            //set the attributes
            rect.setAttribute('x', barX.toString());
            rect.setAttribute('y', barY.toString());
            rect.setAttribute('width', barWidth.toString());
            // rect.setAttribute('width', (6).toString());
            rect.setAttribute('height', barHeight.toString());
            rect.setAttribute('fill', '#000000');
            //add the rect to the graph
            (_a = graph.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(rect, graph);
            //if the mark is set for this bar, add an arrow on top
            if (mappingJson['graph'].mark == i) {
                var arrow = doc.createElement('path');
                //set the attributes
                arrow.setAttribute('d', 'm ' + Math.round(barX + barWidth / 2 - 1) + ',' + (barY - 3) + ' l -5 -6 l 0 -1 l 2 0 l 3 4 l 0 -10 l 2 0 l 0 13 l 5 -6 l 0 -1 l -2 0 l -3 4 l 0 3 z');
                // arrow.setAttribute('fill', 'none');
                // arrow.setAttribute('stroke', '#000000');
                // arrow.setAttribute('stroke-width', '1');
                //add the arrow to the group
                (_b = graph.parentNode) === null || _b === void 0 ? void 0 : _b.insertBefore(arrow, graph);
                //set the attributes
                // group.setAttribute('transform', `translate(${barX + barWidth80 / 2 - 8} ${barY - 20})`);
            }
            //move the x position to the next bar
            barX += barStep;
        }
    }
    //remove the graph element
    (_c = graph.parentNode) === null || _c === void 0 ? void 0 : _c.removeChild(graph);
}
function horizontal1bit(data, canvasWidth) {
    var byteIndex = 7;
    var number = 0;
    var byteArray = [];
    // format is RGBA, so move 4 steps per pixel
    for (var index = 0; index < data.length; index += 4) {
        // Get the average of the RGB (we ignore A)
        var avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
        if (avg > 128) {
            number += Math.pow(2, byteIndex);
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
//Save the page as a binary file
function sendBinaryPage(pageNumber, byteArray) {
    var buffer = buffer_1.Buffer.from(byteArray);
    fs_1.default.writeFile(pageDirectory + '/' + pageNumber + '.bin', buffer, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        //file written successfully
    });
}
//If page is called directly, render the page
if (require.main === module) {
    var mappingJson = { "Field1": "Nu", "Field2": "3,27", "Field3": "Kr", "Field4": "04:33", "Field5": "15:36", "graph": { "type": 1, "values": [52, 32, 30, 42, 90, 10, 42, 90, 23, 12, 32, 23, 12, 32, 72, 43, 62, 52], mark: 2 } };
    render(mappingJson, 'elec1.svg', 1);
    render(mappingJson, 'elec2.svg', 2);
}
//# sourceMappingURL=app.js.map