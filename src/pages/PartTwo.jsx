import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const PartTwo = () => {
  const [messages, setMessages] = useState([]);

  // Load stored messages from localStorage on component mount
  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem("mqttMessages")) || [];
    setMessages(storedMessages);
  }, []);

  useEffect(() => {
    const client = mqtt.connect({
      hostname: "mqttbroker.bc-pl.com",
      port: 443,
      protocol: "wss",
      path: "/mqtt",
      username: "mqttuser",
      password: "Bfl@2025",
    });

    client.on("connect", () => {
      console.log("MQTT Connected");
      client.subscribe("project/maintenance/test");
    });

    client.on("message", (topic, message) => {
      let data = message.toString();
      console.log("Raw Data Received:", data);

      // Update messages state and save to localStorage
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, data];

        // Save updated messages to local storage
        localStorage.setItem("mqttMessages", JSON.stringify(updatedMessages));

        return updatedMessages;
      });
    });

    return () => client.end();
  }, []);

  return (
    <div className="p-4 flex justify-center bg-gray-100">
      <div className="w-full max-w-2xl border-4 border-blue-500 rounded-lg shadow-lg bg-white p-6">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-600">MQTT Data</h1>
        <div className="p-4 border border-gray-300 rounded bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">Waiting for data...</p>
          ) : (
            <ul className="pl-5">
              {messages.map((msg, index) => (
                <li key={index} className="mb-2 p-2 bg-blue-100 border border-blue-300 rounded">{msg}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartTwo;
