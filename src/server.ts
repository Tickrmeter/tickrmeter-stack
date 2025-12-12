#!/usr/bin/env node

/**
 * Module dependencies.
 */

import http from "http";


let server: http.Server;
export const startServer = (app) => {
  const port = normalizePort(process.env.PORT || "2590");
  app.set("port", port);

  server = http.createServer(app);

  server.listen(port, () => {
    if (process.send) {
      process.send("online");
    }
  });
  server.on("listening", onListening);
};

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;

  console.log("Server started on", bind);
}
