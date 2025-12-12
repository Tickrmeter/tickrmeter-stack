import Redis from "ioredis";

// this is for local development, eg docker run -p 127.0.0.1:6379:6379 --name myredis redis
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redis.on("connect", () => console.log("Redis client is initiating a connection to the server."));
redis.on("ready", () => console.log("Redis client successfully initiated connection to the server."));
redis.on("reconnecting", () => console.log("Redis client is trying to reconnect to the server..."));
redis.on("error", (err) => console.log("Redis error", err));

export default redis;
