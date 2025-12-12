import { connectMQTT } from "./services/mqtt";
import { subscribeToTopics } from "./handlers";

connectMQTT(() => console.log("MQTT Connected"));
subscribeToTopics();
