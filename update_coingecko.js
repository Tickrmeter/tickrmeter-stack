const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

const url = "https://api.coingecko.com/api/v3/coins/list";
const osHome = os.homedir();
const fileName = "coinlists.json";
const paths = [
  path.join(osHome, "epaper-stock-price/src/handlers/search/coingecko", "coinlist.json"), //local and dev epaper-stock-price search
  path.join(osHome, "epaper-stock-price/src/handlers/quotes/jsonFiles", "coinslist.json"), //local and dev epaper-stock-price quotes
  path.join(osHome, "tickrmeter-handler/src/handlers/quotes/jsonFiles", "coinslist.json"), //local and dev tickrmeter-handler

  path.join(osHome, "tickrmeter-backend/handlers/search/coingecko", "coinlist.json"), //live epaper-stock-price build
  path.join(osHome, "tickrmeter-backend/handlers/quotes/jsonFiles", "coinslist.json"), //live epaper-stock-price build
  path.join(osHome, "handler-tickrmeter/src/handlers/quotes/jsonFiles", "coinslist.json"), //live tickrmeter-handler
];

console.log(osHome);

https
  .get(url, (res) => {
    let data = "";

    // A chunk of data has been received.
    res.on("data", (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Check directories and save the file.
    res.on("end", () => {
      paths.forEach((filePath) => {
        // Check if the directory exists
        const dir = path.dirname(filePath);
        if (fs.existsSync(dir)) {
          fs.writeFile(filePath, data, (err) => {
            if (err) throw err;
            console.log(`Data saved to ${filePath}`);
          });
        } else {
          console.log(`Directory does not exist: ${dir}`);
        }
      });
    });
  })
  .on("error", (err) => {
    console.log("Error: " + err.message);
  });
