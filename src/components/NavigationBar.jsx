import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import mqtt from "mqtt";

const NavigationBar = () => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);

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
      // console.log("✅ Connected to MQTT broker");

      setClient(mqttClient);
      setConnected(true); // Update connected state to true
    });

    mqttClient.on("error", (err) => {
      console.error("❌ MQTT Connection Error:", err);
      setConnected(false); // Update connected state to false in case of error
    });

    return () => {
      if (mqttClient.connected) {
        mqttClient.end();
      }
    };
  }, []);

  // Function to handle starting the test
  const handleStartTest = () => {
    if (client && connected) {
      const topic = "123/data";
      // const topic = "123";

      // Adding timestamp to the message
      const message = JSON.stringify({
        command: "start_test",
        timestamp: new Date().toISOString(), // Adding timestamp to the message
      });

      client.publish(topic, message, { qos: 1, retain: false }, (err) => {
        if (err) {
          console.error("❌ Publish error:", err);
        } else {
          console.log("📤 Message published successfully");
        }
      });

      // 10-second delay for "RUN_SELFTEST" message
      const timeout = setTimeout(() => {
        if (client.connected) {
          const testTopic = "project/maintenance/command";
          const testMessage = "RUN_SELFTEST";

          client.publish(
            testTopic,
            testMessage,
            { qos: 1, retain: false },
            (err) => {
              if (err) {
                console.error("❌ Publish error:", err);
              } else {
                console.log("📤 Published after 10s:", testMessage);
              }
            }
          );
        }
      }, 10000); // 10-second delay

      // Cleanup timeout when the component unmounts
      return () => clearTimeout(timeout);
    } else {
      console.error("⚠️ Cannot publish: MQTT not connected.");
    }
  };

  return (
    <div className="flex flex-col items-center text-white p-2 ">
      {/* <div>MQTT Publisher Running...</div> */}
      {/* <h1 className="text-lg font-bold">Dashboard</h1> */}

      {/* Start Test Button */}
      <button
        onClick={handleStartTest}
        className="px-6 py-2 bg-green-500 font-semibold text-white rounded-lg"
        disabled={!connected}
      >
        {connected ? "Start Test" : "Connecting..."}
      </button>



      {/* Navigation Buttons */}
      <div className="flex flex-row mt-4 gap-2">
        <Link
          to="/part-one"
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg text-center"
        >
          Go to Page One
        </Link>
        <Link
          to="/part-two"
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg text-center"
        >
          Go to Page Two
        </Link>
      </div>
    </div>
  );
};

export default NavigationBar;
