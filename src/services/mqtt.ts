import mqtt, { IClientPublishOptions, MqttClient, QoS } from "mqtt";
import conf from "../conf";

let client: MqttClient = null;

export function connectMQTT(callback) {
  console.log(conf.app.mqttUser, conf.app.mqttPass, conf.app.mqttServer);
  client = mqtt.connect(conf.app.mqttServer, {
    username: conf.app.mqttUser,
    password: conf.app.mqttPass,
    //clientId: "TickrmeterBackend",
  });

  client.on("connect", callback);
}

export function subscribe(topic: string) {
  client.subscribe(topic);
}

export function publishData(topic: string, data: string, _qos: QoS = 1, _retain: boolean = false) {
  //console.log("Publishing to Topic: " + topic);
  //console.log("Publishing Data: " + data);

  const options: IClientPublishOptions = {
    qos: _qos,
    retain: _retain,
    properties: {
      messageExpiryInterval: 600,
    },
  };

  client.publish(topic, data, options);
  //console.log("=======================================");
}

export function onSubscriptionData(callback) {
  client.on("message", callback);
}

export function unsubscribeTopic(topic: string) {
  client.unsubscribe(topic);
}
