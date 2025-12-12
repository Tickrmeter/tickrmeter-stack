import mqtt, { MqttClient } from "mqtt";
import conf from "../conf";
import { print } from "../handlers/quotes";
import workerpool from "workerpool";
import path from "path";
import fs from "fs";

interface PublishTask {
  topic: string;
  data: string;
  requestId: string;
}

let client: MqttClient = null;
export function connectMQTT(callback) {
  console.log("Connecting to MQTT Server: " + conf.app.mqttServer);
  client = mqtt.connect(conf.app.mqttServer, {
    password: conf.app.mqttPass,
    username: conf.app.mqttUser,
    // clientId: "TickrmeterBackend",
  });

  client.on("connect", callback);
  client.on("error", (err) => {
    console.error("MQTT client error:", err);
  });
}

export function subscribe(topic: string) {
  client.subscribe(topic);
}

export function onSubscriptionData(callback) {
  client.on("message", callback);
}

export function unsubscribeTopic(topic: string) {
  client.unsubscribe(topic);
}

/* ----------------- Worker Pool ----------------- */

const publishQueue: PublishTask[] = [];
const maxConcurrentPublishers = 32; // Maximum number of active worker threads

console.log(" conf.app.environment", conf.app.environment);
let workerFileName = conf.app.environment === "dev" ? "mqttWorker.ts" : "mqttWorker.js";

let workerFilePath = path.join(__dirname, workerFileName);

//check file exists
if (!fs.existsSync(workerFilePath) && workerFileName === "mqttWorker.ts") {
  workerFileName = "mqttWorker.js";
  workerFilePath = path.join(__dirname, workerFileName);
}


console.log("workerFilePath", workerFilePath);

const pool = workerpool.pool(workerFilePath, {
  maxWorkers: maxConcurrentPublishers, // Limit the number of worker threads
});

// Add a message to the queue
export const publishData = (topic: string, data: string, requestId?: string): void => {
  publishQueue.push({ topic, data, requestId });
  processQueue();
};

// Function to add a message to the queue
// Process the queue
const processQueue = (): void => {
  while (publishQueue.length > 0) {
    if (pool.stats().busyWorkers >= maxConcurrentPublishers) {
      break; // Wait for a free worker
    }

    const task = publishQueue.shift() as PublishTask; // Safe cast since we check length
    const { topic, data, requestId } = task;

    // Send the task to a worker
    pool
      .exec("publish", [topic, data, requestId])
      .then((result: string) => {
        // console.log(result);
        print(topic, `${requestId} - Successfully published to topic ${topic} - ${data} - ${result}`);
        // Log success
      })
      .catch((err: Error) => {
        console.error(err.message); // Log error
        publishQueue.push(task); // Optionally retry failed messages
      })
      .finally(() => {
        processQueue(); // Continue processing
      });
  }
};

// Monitor Pool and Queue Stats
setInterval(() => {
  const stats = pool.stats();
  console.log(
    `Thread Pool Stats: Active Workers: ${stats.busyWorkers}, Pending Tasks: ${stats.pendingTasks}, Queue Length: ${publishQueue.length}`
  );
}, 5000);

// Clean up the pool on process exit
process.on("SIGINT", async () => {
  console.log("Closing thread pool...");
  await pool.terminate();
  process.exit(0);
});

// Example usage
