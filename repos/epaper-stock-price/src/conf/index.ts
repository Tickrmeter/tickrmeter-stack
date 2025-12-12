"use strict";

import { readFileSync } from "fs";
import { parse } from "ini";
import path from "path";

const configFolder =
  process.env.NODE_ENV === "development" ? path.join(__dirname, "../configs").replace("/src", "") : __dirname;

console.log(configFolder);

const config = parse(readFileSync(`${configFolder}/config.ini`, "utf-8"));
export default config;
