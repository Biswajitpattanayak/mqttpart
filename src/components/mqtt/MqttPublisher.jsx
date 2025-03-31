import { useEffect } from "react";
import React from "react";
import mqtt from "mqtt";

const MqttPublisher = () => {
  useEffect(() => {
    // Connect to the MQTT broker
    const mqttClient = mqtt.connect({
      hostname: "mqttbroker.bc-pl.com",
      port: 443,
      protocol: "wss",
      path: "/mqtt",
      username: "mqttuser",
      password: "Bfl@2025",
    });

    mqttClient.on("connect", () => {
      console.log("✅ Connected to MQTT broker");

      const topic = "123";

      // Publish random numbers every second
      const interval = setInterval(() => {
        if (mqttClient.connected) {
          const message = JSON.stringify({
            value: Math.floor(Math.random() * 10), // Random number between 0-999
            timestamp: new Date().toISOString(),
          });``

          mqttClient.publish(topic, message, { qos: 1, retain: false }, (err) => {
            if (err) {
              console.error("❌ Publish error:", err);
            } else {
              console.log("📤 Published:", message);
            }
          });
        }
      }, 1000);

      // Cleanup function when the component unmounts
      return () => {
        clearInterval(interval);
        mqttClient.end(true, () => console.log("❌ MQTT connection closed."));
      };
    });

    mqttClient.on("error", (err) => {
      console.error("❌ MQTT Connection Error:", err);
    });

    return () => {
      if (mqttClient.connected) {
        mqttClient.end();
      }
    };
  }, []);

  return <div>📡 MQTT Publisher Running...</div>;
};

export default MqttPublisher;
