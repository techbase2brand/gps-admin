// scripts/mqttWorker.js

const mqtt = require("mqtt"); // Ensure 'mqtt' is installed: npm install mqtt
const { createClient } = require("@supabase/supabase-js");

const MQTT_CONFIG = {
  host: "ws://sensecap-openstream.seeed.cc:8083/mqtt", // browser WS endpoint
  username: "org-449810146246400",
  password: "9B1C6913197A4C56B5EC31F1CEBAECF9E7C7235B015B456DB0EC577BD7C167F3",
  clientId:
    "org-449810146246400-react-" + Math.random().toString(16).substr(2, 8),
  protocolVersion: 4,
};
// --- Configuration and Initialization ---

// Supabase Client Initialization (replace with your actual URL and Key)
// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use Service Key for security!
const SUPABASE_URL = "https://vhjetkdfxqbogbegboic.supabase.co";
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoamV0a2RmeHFib2diZWdib2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1ODU4MzgsImV4cCI6MjA3NjE2MTgzOH0.r4GY5UgwRjhicFnnmcRxBySjN7PMJKhImSDHwxqKcyg';
 
 

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("FATAL: Supabase URL or Service Key not configured.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);




// State to track latest Lats/Lons for *each* chip
// Key: chipId, Value: { latestLat: number | null, latestLon: number | null }
const latestChipData = {};

async function startMqttWorker() {
  console.log(" Starting MQTT Backend Worker...");

  const client = mqtt.connect(MQTT_CONFIG.host, {
    username: MQTT_CONFIG.username,
    password: MQTT_CONFIG.password,
    protocolVersion: MQTT_CONFIG.protocolVersion,
    clientId: `org-449810146246400-backend-worker`,
  });

  client.on("connect", () => {
    console.log(" Worker Connected to MQTT.");

    // --- Wildcard Topics for ALL chips location data ---
    const latitudeTopicAll = `/device_sensor_data/449810146246400/+/+/vs/4198`;
    const longitudeTopicAll = `/device_sensor_data/449810146246400/+/+/vs/4197`;

    client.subscribe([latitudeTopicAll, longitudeTopicAll], (err) => {
      if (err) {
        console.error(" MQTT Subscribe Error:", err);
      } else {
        console.log(
          `Subscribed to ALL chip topics: ${latitudeTopicAll} & ${longitudeTopicAll}`
        );
      }
    });
  });

  client.on("message", async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());

      // --- 1. Extract Chip ID ---
      const topicParts = topic.split("/");
      const chipId = topicParts[3];

      if (!chipId) return; // Basic check

      if (!latestChipData[chipId]) {
        latestChipData[chipId] = { latestLat: null, latestLon: null };
      }

      const chipData = latestChipData[chipId];

      // --- 2. Update Specific Coordinate ---
      if (topic.includes("4197")) {
        chipData.latestLon = payload.value;
      } else if (topic.includes("4198")) {
        chipData.latestLat = payload.value;
      }

      // --- 3. Check for Complete Pair and Update Supabase ---
      if (chipData.latestLat !== null && chipData.latestLon !== null) {
        const latitude = parseFloat(chipData.latestLat);
        const longitude = parseFloat(chipData.latestLon);

        // Reset coordinates for the next update
        chipData.latestLat = null;
        chipData.latestLon = null;

        if (!isNaN(latitude) && !isNaN(longitude)) {
          const currentTimestampISO = new Date().toISOString();

          console.log(
            ` [${chipId}] Data received: Lat=${latitude}, Lon=${longitude}`
          );

          // ⭐ Supabase DATABASE UPDATE: Back-end logic
          const { error: updateError } = await supabase
            .from("cars")
            .update({
              latitude: latitude,
              longitude: longitude,
              last_location_update: currentTimestampISO,
            })
            .eq("chip", chipId); // 🔑 Use the extracted 'chipId'

          if (updateError) {
            console.error(
              ` DB Update Error for ${chipId}:`,
              updateError.message
            );
          } else {
            console.log(` DB updated successfully for ${chipId}`);
          }
        }
      }
    } catch (error) {
      console.error(" Error processing MQTT message:", error.message);
    }
  });

  client.on("error", (error) => console.error(" MQTT Error:", error.message));
  client.on("close", () =>
    console.log(" MQTT Connection closed. Attempting reconnect...")
  );
}

startMqttWorker();

// Handle graceful exit
process.on("SIGINT", () => {
  console.log("\nWorker shutting down...");
  process.exit();
});
