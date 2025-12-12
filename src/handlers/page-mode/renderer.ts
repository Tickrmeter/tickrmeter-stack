import fs from "fs";
import { Resvg, ResvgRenderOptions } from "@resvg/resvg-js";
import { Buffer } from "buffer";
import { DOMParser } from "xmldom";
import { Mapping, Graph } from "./interfaces";
import path from "path";

import { renderPaths } from "../../constants";

const { templateDirectory, pageDirectory, fontDirectory } = renderPaths;

const fontsFile = path.join(fontDirectory, "sfpro.ttf");
const defaultFontFamily = "SF Pro Display";

//create a graph type

// const opts: ResvgRenderOptions = {
//   background: "rgba(255, 255, 255, 1)",
//   font: {
//     fontDirs: [fontDirectory],
//     fontFiles: [fontsFile],
//     defaultFontFamily,
//     loadSystemFonts: false,
//   },
//   logLevel: "warn", // Default Value: error
// };

//we need to return options as per the type, for elec we are only using SF Pro Display option, however for humbl3 we are using 3 files, OpenSans-SemiBold, OpenSans-Bold, OpenSans-ExtraBold
const getOptions = (type: "elec" | "humbl3") => {
  //we need to assign common options first
  const opts: ResvgRenderOptions = {
    background: "rgba(255, 255, 255, 1)",
    font: {
      fontDirs: [fontDirectory],
      fontFiles: [fontsFile],
      defaultFontFamily,
      loadSystemFonts: false,
    },
    logLevel: "warn", // Default Value: error
  };

  //if type is humbl3, we need to add replace fonts with 3 fonts
  if (type === "humbl3") {
    const humbl3FontFiles = [
      path.join(fontDirectory, "OpenSans-SemiBold.ttf"),
      path.join(fontDirectory, "OpenSans-Bold.ttf"),
      path.join(fontDirectory, "OpenSans-ExtraBold.ttf"),
    ];

    opts.font.fontFiles = humbl3FontFiles;
    opts.textRendering = 0;
    opts.shapeRendering = 0;
  }

  return opts;
};

export function render(mapping: Mapping, template: string, pageNumber: number, type: "elec" | "humbl3" = "elec") {
  //Options for the resvg renderer

  const svgFile = fs.readFileSync(templateDirectory + "/" + template, "utf8");

  const doc = new DOMParser().parseFromString(svgFile, "image/svg+xml");

  //resize svg to 296x128
  doc.documentElement.setAttribute("width", "296");
  doc.documentElement.setAttribute("height", "128");

  for (const [key, value] of Object.entries(mapping)) {
    if (key === "graph") {
      continue;
    }

    if (key === "isUp") {
      //check if the value is true, then hide the element with id="down"
      console.log("isUp:", value);
      if (value === true) {
        const element = doc.getElementById("down");
        if (element) {
          element.setAttribute("display", "none");
        }
      } else {
        const element = doc.getElementById("up");
        if (element) {
          //remove the element
          doc.documentElement.removeChild(element);
        }
      }
      continue;
    }

    // if (key.toLowerCase() === "subtitle" && value === "") {
    //   console.log("subTitle is empty");
    //   const element = doc.getElementById("subTitle");

    //   if (element) {
    //     //remove the element
    //     const subTitleY = element?.getAttribute("y");
    //     doc.documentElement.removeChild(element);

    //     const title = doc.getElementById("title");
    //     // move title to subTitle position
    //     if (title) {
    //       title.setAttribute("y", subTitleY);
    //     }
    //   }

    //   continue;
    // }

    //find the object with id="key"
    const element = doc.getElementById(key);
    if (!element) {
      console.warn("Element with id " + key + " not found in the svg");
      continue;
    }
    //set the text content
    element.textContent = String(value);
  }

  if (mapping["graph"]) {
    drawGraph(doc, mapping);
  }
  const svg = doc.toString();

  const opts = getOptions(type);

  const resvg = new Resvg(svg, opts);
  const pngData = resvg.render();
  const stringFromBytes = horizontal1bit(pngData.pixels, pngData.width);

  //debug save the png
  console.log(pageDirectory + "/" + pageNumber + ".png");
  fs.writeFile(pageDirectory + "/" + pageNumber + ".png", pngData.asPng(), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    //file written successfully
  });

  sendBinaryPage(pageNumber, stringFromBytes);
}

//if mapping has a graph, draw it
function drawGraph(doc: Document, mappingJson: Mapping) {
  // function drawGraph(doc: Document) {
  console.log("draw graph");
  //find the object with id="graph"
  const graph = doc.getElementById("graph");

  if (!graph) {
    console.warn("Graph element not found in the svg");
    return;
  }

  //Graph type is 1
  if ((mappingJson["graph"] as Graph).type == 1) {
    //get the width and height of the graph
    let graphWidth = parseFloat(graph.getAttribute("width")!);
    console.log(graphWidth);
    graphWidth = Math.round(graphWidth);
    console.log(graphWidth + " after");
    let graphHeight = parseFloat(graph.getAttribute("height")!);
    graphHeight = Math.round(graphHeight);
    //and x y position
    let graphX = parseFloat(graph.getAttribute("x")!);
    graphX = Math.round(graphX);
    let graphY = parseFloat(graph.getAttribute("y")!);
    graphY = Math.round(graphY);
    //get the values from the json
    const values = (mappingJson["graph"] as { values: number[] }).values;
    let barStep = graphWidth / values.length;
    barStep = Math.round(barStep);

    //bar width is 60% of the step
    const barWidth = Math.round(barStep * 0.5);

    //calculate the max value scaled to the height of the graph
    const maxValue = Math.max(...values);
    const maxValueScaled = graphHeight / maxValue;

    //calculate the x position of the first bar
    let barX = Math.round(graphX);

    //for each value
    for (let i = 0; i < values.length; i++) {
      //calculate the height of the bar
      const barHeight = Math.round(values[i] * maxValueScaled);
      //calculate the y position of the bar
      const barY = (graphY ?? 0) + graphHeight - barHeight;
      //create a new rect element
      const rect = doc.createElement("rect");
      //round corners
      // rect.setAttribute('rx', '0.52916664');
      rect.setAttribute("ry", "2");
      //set the attributes
      rect.setAttribute("x", barX.toString());
      rect.setAttribute("y", barY.toString());
      rect.setAttribute("width", barWidth.toString());
      // rect.setAttribute('width', (6).toString());
      rect.setAttribute("height", barHeight.toString());
      rect.setAttribute("fill", "#000000");
      //add the rect to the graph
      graph.parentNode?.insertBefore(rect, graph);

      //if the mark is set for this bar, add an arrow on top
      if ((mappingJson["graph"] as { values: number[]; mark: number }).mark == i) {
        const arrow = doc.createElement("path");
        //set the attributes
        arrow.setAttribute(
          "d",
          "m " +
            Math.round(barX + barWidth / 2 - 1) +
            "," +
            (barY - 3) +
            " l -5 -6 l 0 -1 l 2 0 l 3 4 l 0 -10 l 2 0 l 0 13 l 5 -6 l 0 -1 l -2 0 l -3 4 l 0 3 z"
        );
        // arrow.setAttribute('fill', 'none');
        // arrow.setAttribute('stroke', '#000000');
        // arrow.setAttribute('stroke-width', '1');
        //add the arrow to the group
        graph.parentNode?.insertBefore(arrow, graph);
        //set the attributes
        // group.setAttribute('transform', `translate(${barX + barWidth80 / 2 - 8} ${barY - 20})`);
      }

      //move the x position to the next bar
      barX += barStep;
    }
  }
  //remove the graph element
  graph.parentNode?.removeChild(graph);
}

function horizontal1bit(data: Buffer, canvasWidth: number) {
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
    if ((index !== 0 && (index / 4 + 1) % canvasWidth === 0) || index === data.length - 4) {
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
function sendBinaryPage(pageNumber: number, byteArray: number[]) {
  const buffer = Buffer.from(byteArray);
  fs.writeFile(pageDirectory + "/" + pageNumber + ".bin", buffer, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    //file written successfully
  });
}

// //If page is called directly, render the page
// if (require.main === module) {
//   const mappingJson: { [key: string]: string | Graph } = {
//     field1: "Nu",
//     field2: "4,27",
//     field3: "Kr",
//     field4: "03:33",
//     field5: "16:00",
//     graph: { type: 1, values: [12, 32, 1, 2, 90, 23, 12, 32, 23, 12, 32], mark: 3 },
//   };

//   render(mappingJson, "elec.svg", 1);
// }
