import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import sensorDataJson from "../../public/data.json";

const Sensor = ({ name, status }) => (
  <div className="flex items-center space-x-4">
    <span className="text-lg font-semibold text-right flex-1">{name}</span>
    <div
      className={`w-32 px-4 py-2 text-white font-bold text-center rounded-lg flex-shrink-0 ${
        status === "Working" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {status || "Not Working"} {/* Ensures "Not Working" isn't blank */}
    </div>
  </div>
);

const SensorBlock = ({ title, sensors }) => (
  <div className="w-1/2 p-4 border-r border-gray-300 text-center">
    <h2 className="text-xl font-bold mb-4">{title}</h2>
    <div className="flex flex-col items-center space-y-4">
      {Object.entries(sensors).map(([key, status]) => (
        <Sensor key={key} name={key} status={status} />
      ))}
    </div>
  </div>
);

const MaintenanceStatus = () => {
  const [staticData, setStaticData] = useState({
    mainOne: {},
    mainTwo: {},
    bottomSensors: {},
  });

  useEffect(() => {
    setStaticData(sensorDataJson);
  }, []);

  const [sensorData, setSensorData] = useState({
    mainOne: {},
    mainTwo: {},
    bottomSensors: {},
  });

  useEffect(() => {
    const mqttClient = mqtt.connect({
      hostname: "mqttbroker.bc-pl.com",
      port: 443,
      protocol: "wss",
      path: "/mqtt",
      username: "mqttuser",
      password: "Bfl@2025",
    });

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT broker");
      mqttClient.subscribe("123/data");
    });

    mqttClient.on("message", (topic, payload) => {
      const rawData = payload.toString();
      console.log("Received MQTT Data:", rawData);

      const parsedData = {};
      rawData.split(";").forEach((item) => {
        const [key, value] = item.split(":");
        if (key && value) {
          let formattedValue = value.trim() === "NotWorking" ? "Not Working" : value.trim();
          parsedData[key.trim()] = formattedValue;
        }
      });

      console.log("Parsed Data:", parsedData);

      const formattedData = {
        Current_Sensor: {
          Main_One: {
            R: parsedData["Current Sensor (Main One) - R"] || "Not Working",
            Y: parsedData["Current Sensor (Main One) - Y"] || "Not Working",
            B: parsedData["Current Sensor (Main One) - B"] || "Not Working",
          },
          Main_Two: {
            R: parsedData["Current Sensor (Main Two) - R"] || "Not Working",
            Y: parsedData["Current Sensor (Main Two) - Y"] || "Not Working",
            B: parsedData["Current Sensor (Main Two) - B"] || "Not Working",
          },
        },
        ADC: {
          Main_One: parsedData["ADC (Main One)"] || "Not Working",
          Main_Two: parsedData["ADC (Main Two)"] || "Not Working",
        },
        Relay: {
          Starter_1: parsedData["Relay (Starter 1)"] || "Not Working",
          Starter_2: parsedData["Relay (Starter 2)"] || "Not Working",
        },
        LED: {
          R: parsedData["Led_R"] || "Not Working",
          Y: parsedData["Led_Y"] || "Not Working",
          B: parsedData["Led_B"] || "Not Working",
        },
        MQTT: parsedData["MQTT"] || "Not Working",
      };

      
console.log(formattedData);
      setSensorData({
        mainOne: formattedData.Current_Sensor.Main_One,
        mainTwo: formattedData.Current_Sensor.Main_Two,
        bottomSensors: {
          "ADC (Main One)": formattedData.ADC.Main_One,
          "ADC (Main Two)": formattedData.ADC.Main_Two,
          "Relay (Starter 1)": formattedData.Relay.Starter_1,
          "Relay (Starter 2)": formattedData.Relay.Starter_2,
          "Led R": formattedData.LED.R,
          "Led Y": formattedData.LED.Y,
          "Led B": formattedData.LED.B,
          "MQTT": formattedData.MQTT,
        },
      });
    });

    return () => {
      mqttClient.end();
    };
  }, []);
// useEffect(() => {
//   console.log("Updated Sensor Data:", sensorData);
// }, [sensorData]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Mode: Maintenance Mode Activated</h1>
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden mb-10">
        <h2 className="text-center text-lg font-semibold bg-gray-200 p-2">Static Data</h2>
        <div className="flex">
          {/* <SensorBlock title="Main One" sensors={staticData.mainOne} /> */}
          {/* <SensorBlock title="Main Two" sensors={staticData.mainTwo} /> */}
        </div>
        {/* <div className="p-4 flex flex-col items-center space-y-2">
          {Object.entries(staticData.bottomSensors).map(([key, status]) => (
            <Sensor key={key} name={key} status={status} />
          ))}
        </div> */}
      </div>
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg">
        <h2 className="text-center text-lg font-semibold bg-blue-200 p-2">Dynamic Data (MQTT)</h2>
        <div className="flex">
          <SensorBlock title="Main One" sensors={sensorData.mainOne} />
          <SensorBlock title="Main Two" sensors={sensorData.mainTwo} />
        </div>
        <div className="p-4 flex flex-col items-center space-y-2">
          {Object.entries(sensorData.bottomSensors).map(([key, status]) => (
            <Sensor key={key} name={key} status={status} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceStatus;
