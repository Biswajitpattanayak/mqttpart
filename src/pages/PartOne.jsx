import React, { useState, useEffect } from "react";
import mqtt from "mqtt";

const Sensor = ({ name, status }) => (
  <div className="flex justify-between items-center py-2 px-4">
    <span className="text-gray-700 font-medium">{name}</span>
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
      status === "Working" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    }`}>
      {status}
    </span>
  </div>
);

const SensorGroup = ({ title, sensors }) => (
  <div className="bg-white rounded-lg shadow-md p-4 mb-4">
    <h3 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">{title}</h3>
    <div className="space-y-2">
      {Object.entries(sensors).map(([name, status]) => (
        <Sensor key={name} name={name} status={status} />
      ))}
    </div>
  </div>
);

const MaintenanceStatus = () => {
  // Initial state
  const initialState = {
    currentSensors: {
      mainOne: { R: "Not Working", Y: "Not Working", B: "Not Working" },
      mainTwo: { R: "Not Working", Y: "Not Working", B: "Not Working" }
    },
    adc: {
      mainOne: "Not Working",
      mainTwo: "Not Working"
    },
    relays: {
      starter1: "Not Working",
      starter2: "Not Working"
    },
    leds: {
      R: "Not Working",
      Y: "Not Working",
      B: "Not Working"
    },
    mqtt: "Not Working",
    lastUpdated: null // Add timestamp to track freshness
  };

  // Load data from localStorage on initial render
  const loadState = () => {
    try {
      const savedState = localStorage.getItem('sensorData');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Only use saved state if it's not too old (e.g., 5 minutes)
        if (parsed.lastUpdated && (Date.now() - parsed.lastUpdated < 300000)) {
          return parsed;
        }
      }
      return initialState;
    } catch (error) {
      console.error("Failed to load state from localStorage:", error);
      return initialState;
    }
  };

  const [sensorData, setSensorData] = useState(loadState());
  const [isConnected, setIsConnected] = useState(false);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sensorData', JSON.stringify({
      ...sensorData,
      lastUpdated: Date.now() // Update timestamp when saving
    }));
  }, [sensorData]);

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
      setIsConnected(true);
      // client.subscribe("project/maintenance/status");
      client.subscribe("123/data");
    });

    client.on("disconnect", () => {
      setIsConnected(false);
    });

    client.on("message", (topic, message) => {
      let data = message.toString();
     
      // Remove double quotes if they exist
      if (data.startsWith('"') && data.endsWith('"')) {
        data = data.substring(1, data.length - 1);
      }
   
      // Extract only the sensor data portion
      const startIndex = data.indexOf("CurrentSensor");
      const endIndex = data.indexOf("MQTT:") + "MQTT: Working".length;
     
      if (startIndex !== -1 && endIndex !== -1) {
        data = data.substring(startIndex, endIndex);
      } else {
        console.log("Invalid message format - couldn't find sensor data");
        return;
      }
   
      console.log("Processing sensor data:", data);
   
      // Initialize parsed data with defaults
      const parsed = {
        currentMainOne: { R: "Not Working", Y: "Not Working", B: "Not Working" },
        currentMainTwo: { R: "Not Working", Y: "Not Working", B: "Not Working" },
        adcMainOne: "Not Working",
        adcMainTwo: "Not Working",
        relayStarter1: "Not Working",
        relayStarter2: "Not Working",
        ledR: "Not Working",
        ledY: "Not Working",
        ledB: "Not Working",
        mqttStatus: "Not Working"
      };
   
      // Split the message into sections
      const sections = data.split(';').map(s => s.trim()).filter(s => s);
     
      sections.forEach(section => {
        if (section.startsWith("CurrentSensor MainOne")) {
          // Handle format: R=Working, Y=Working, B=Working
          const parts = section.substring("CurrentSensor MainOne:".length).split(',').map(p => p.trim());
          parts.forEach(part => {
            const [key, value] = part.split('=').map(p => p.trim());
            if (key && value) {
              parsed.currentMainOne[key] = value;
            }
          });
        }
        else if (section.startsWith("CurrentSensor MainTwo")) {
          // Handle format: R=Working, Y=Working, B=Working
          const parts = section.substring("CurrentSensor MainTwo:".length).split(',').map(p => p.trim());
          parts.forEach(part => {
            const [key, value] = part.split('=').map(p => p.trim());
            if (key && value) {
              parsed.currentMainTwo[key] = value;
            }
          });
        }
        else {
          // Handle other sections that use the original format (key: value)
          const [key, value] = section.split(':').map(s => s.trim());
          if (!key || !value) return;
   
          if (key === "ADC MainOne") {
            parsed.adcMainOne = value;
          } else if (key === "ADC MainTwo") {
            parsed.adcMainTwo = value;
          } else if (key === "Relay (Starter 1)") {
            parsed.relayStarter1 = value;
          } else if (key === "Relay (Starter 2)") {
            parsed.relayStarter2 = value;
          } else if (key === "Led_R") {
            parsed.ledR = value;
          } else if (key === "Led_Y") {
            parsed.ledY = value;
          } else if (key === "Led_B") {
            parsed.ledB = value;
          } else if (key === "MQTT") {
            parsed.mqttStatus = value;
          }
        }
      });
   
      // Update state with fresh data
      setSensorData(prev => ({
        ...prev,
        currentSensors: {
          mainOne: parsed.currentMainOne,
          mainTwo: parsed.currentMainTwo
        },
        adc: {
          mainOne: parsed.adcMainOne,
          mainTwo: parsed.adcMainTwo
        },
        relays: {
          starter1: parsed.relayStarter1,
          starter2: parsed.relayStarter2
        },
        leds: {
          R: parsed.ledR,
          Y: parsed.ledY,
          B: parsed.ledB
        },
        mqtt: parsed.mqttStatus,
        lastUpdated: Date.now() // Mark as fresh data
      }));
    });

    return () => {
      client.end();
      setIsConnected(false);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Maintenance Dashboard</h1>
        <div className="mb-4 flex justify-between items-center">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            MQTT: {isConnected ? "Connected" : "Disconnected"}
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {sensorData.lastUpdated ? new Date(sensorData.lastUpdated).toLocaleTimeString() : "Never"}
          </div>
        </div>
       
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SensorGroup
            title="Current Sensor - Main One"
            sensors={sensorData.currentSensors.mainOne}
          />
          <SensorGroup
            title="Current Sensor - Main Two"
            sensors={sensorData.currentSensors.mainTwo}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <SensorGroup
            title="ADC Sensors"
            sensors={{
              "Main One": sensorData.adc.mainOne,
              "Main Two": sensorData.adc.mainTwo
            }}
          />
          <SensorGroup
            title="Relays"
            sensors={{
              "Starter 1": sensorData.relays.starter1,
              "Starter 2": sensorData.relays.starter2
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <SensorGroup
            title="LED Indicators"
            sensors={sensorData.leds}
          />
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">System Status</h3>
            <Sensor name="MQTT Connection" status={sensorData.mqtt} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceStatus;