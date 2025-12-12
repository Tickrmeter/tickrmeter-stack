import mqtt, { MqttClient } from "mqtt";
import workerpool from "workerpool";
import conf from "../conf";

let client: MqttClient | null = null;
let connected = false;

const GetClient = (): Promise<MqttClient> => {
  if (client && connected) return Promise.resolve(client);

  client = mqtt.connect(conf.app.mqttServer, {
    username: conf.app.mqttUser,
    password: conf.app.mqttPass,
    keepalive: 30,
    reconnectPeriod: 200,
    clean: true,
    resubscribe: false,
    connectTimeout: 10_000,
    // @ts-ignore
    maxInflightMessages: 1000,
    queueQoSZero: false, // for pure fire-and-forget QoS 0
  });

  return new Promise((resolve, reject) => {
    client!.once("connect", () => {
      connected = true;
      resolve(client!);
    });
    client!.once("error", (err) => reject(err));
  });
};

const publish = async (topic, data, requestId) => {
  const c = await GetClient();

  return new Promise<void>((resolve, reject) => {
    c.publish(topic, data, { qos: 0 }, (err?: Error) => {
      if (err) reject(new Error(`[Worker] Publish error for ${requestId ?? ""}: ${err.message}`));
      else resolve();
    });
  });

  // const client = mqtt.connect(conf.app.mqttServer, {
  //   password: conf.app.mqttPass,
  //   username: conf.app.mqttUser,
  // });

  // return new Promise((resolve, reject) => {

  //   client.on("connect", () => {
  //     client.publish(topic, data, {}, (err) => {
  //       if (err) {
  //         reject(new Error(`[Worker] Publish error for ${requestId}: ${err.message}`));
  //       } else {
  //         resolve(`[Worker] Successfully published ${requestId}`);
  //       }
  //       client.end();
  //     });
  //   });

  //   client.on("error", (err) => {
  //     reject(new Error(`[Worker] MQTT client error: ${err.message}`));
  //     client.end();
  //   });
  // });
};

// Expose the publish function to the thread pool
process.on("SIGINT", () => {
  try {
    client?.end(true);
  } catch {}
});

workerpool.worker({ publish });

// workerpool.worker({
//   publish,
// });
