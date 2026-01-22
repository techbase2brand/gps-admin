import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";
import admin from "./firebase-admin.js";

// Configuration for MQTT and Supabase
const MQTT_CONFIG = {
    host: "ws://sensecap-openstream.seeed.cc:8083/mqtt",
    username: "org-449810146246400",
    password: "9B1C6913197A4C56B5EC31F1CEBAECF9E7C7235B015B456DB0EC577BD7C167F3", // Updated Password
    protocolVersion: 4,
};

// NOTE: Using a public ANON key here for simplicity, but a backend worker
// should ideally use a service role key with restricted policies.
const SUPABASE_URL = "https://vhjetkdfxqbogbegboic.supabase.co";
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoamV0a2RmeHFib2diZWdib2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1ODU4MzgsImV4cCI6MjA3NjE2MTgzOH0.r4GY5UgwRjhicFnnmcRxBySjN7PMJKhImSDHwxqKcyg'; // Updated Key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("FATAL: Supabase URL or Service Key not configured.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const notificationDelay = 3600;


async function getFacilityPolygons() {
    try {
        const { data, error } = await supabase
            .from('facility_polygons')
            .select('id, facility_id, slot_number, coordinates') // ADDED 'id' FIELD FOR CACHE MATCHING

        if (error) {
            console.error("ERROR fetching facility polygons:", error.message);
            return [];
        }

        console.log(`Loaded ${data?.length || 0} facility polygons from database`);
        return data || [];
    } catch (error) {
        console.error("Exception fetching facility polygons:", error);
        return [];
    }
}

async function getFacilityName(facilityId) {
    if (!facilityId) return 'Unknown Facility';

    try {
        const { data, error } = await supabase
            .from('facility')
            .select('name',)
            .eq('id', facilityId)
            .single();

        if (error || !data) {
            return `Facility ${facilityId}`;
        }

        return data.name;
    } catch (error) {
        console.error(`Error fetching facility name:`, error);
        return `Facility ${facilityId}`;
    }
}



async function startMqttWorker() {

    // Connect to MQTT
    const client = mqtt.connect(MQTT_CONFIG.host, {
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        protocolVersion: 4,
        clientId: `org-449810146246400-backend-worker-${Date.now()}`,
    });

    client.on("connect", () => {
        console.log("Worker Connected to MQTT.");

        const latitudeTopicAll = `/device_sensor_data/449810146246400/+/+/vs/4198`;
        const longitudeTopicAll = `/device_sensor_data/449810146246400/+/+/vs/4197`;
        const sensor5003TopicAll = `/device_sensor_data/449810146246400/+/+/vs/5003`; // Movement events

        client.subscribe([latitudeTopicAll, longitudeTopicAll, sensor5003TopicAll], (err) => {
            if (err) {
                console.error("MQTT Subscribe Error:", err);
            } else {
                console.log(`Subscribed to ALL chip topics (GPS + Movement Events).`);
            }
        });
    });

    // Handle MQTT Messages
    client.on("message", async (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            const parts = topic.split("/");
            const chipId = parts[3]; // Extract chip ID from topic

            if (!chipId) {
                console.warn("Could not extract chip ID from topic:", topic);
                return;
            }

            // Initialize chip data if not exists
            if (!latestChipData[chipId]) {
                latestChipData[chipId] = {
                    latestLat: null,
                    latestLon: null,
                    is_moving: false, // Default state
                };
            }

            const chipData = latestChipData[chipId];

            // ============================================================
            // HANDLE GPS COORDINATES (Latitude 4198 / Longitude 4197)
            // ============================================================
            if (topic.includes("4198")) {
                // Latitude
                const lat = parseFloat(payload.value);
                if (!isNaN(lat)) {
                    chipData.latestLat = lat;
                    // Check if we already have the Lon from a previous message
                    if (chipData.latestLon !== null) {
                        // Trigger check only when a complete Lat/Lon pair is ready
                        // Pass the local cache's is_moving state, which will be corrected to DB state in processLocationCheck
                        await processLocationCheck(chipId, 'GPS Update', chipData.is_moving);
                    }
                }
            } else if (topic.includes("4197")) {
                // Longitude
                const lon = parseFloat(payload.value);
                if (!isNaN(lon)) {
                    chipData.latestLon = lon;
                    // Check if we already have the Lat from a previous message
                    if (chipData.latestLat !== null) {
                        // Trigger check only when a complete Lat/Lon pair is ready
                        // Pass the local cache's is_moving state, which will be corrected to DB state in processLocationCheck
                        await processLocationCheck(chipId, 'GPS Update', chipData.is_moving);
                    }
                }
            }

            // ============================================================
            // HANDLE MOVEMENT EVENTS (Sensor 5003) - Triggers immediate check
            // ============================================================
            else if (topic.includes("5003")) {
                const sensorValue = payload.value;
                if (!Array.isArray(sensorValue) || sensorValue.length === 0) {
                    console.warn(`[${chipId}] Invalid sensor 5003 value format`);
                    return;
                }

                const eventName = sensorValue[0].eventName || "";
                const eventLower = eventName.toLowerCase();

                // Check if it's a movement event
                const isStartMoving = eventLower.includes("start") &&
                    (eventLower.includes("moving") || eventLower.includes("movement"));
                const isEndMoving = eventLower.includes("end") &&
                    (eventLower.includes("moving") || eventLower.includes("movement"));

                if (!isStartMoving && !isEndMoving) {
                    console.log(`[${chipId}] Ignoring non-movement event: ${eventName}`);
                    return;
                }

                const isMoving = isStartMoving;

                // Update the cached moving state for subsequent GPS messages
                chipData.is_moving = isMoving;

                // The location check (geofencing) is deliberately executed immediately here on the MQTT event.
                await processLocationCheck(chipId, eventName, isMoving);

                return;
            }
        } catch (err) {
            console.error("Error processing MQTT message:", err.message);
            console.error("Error stack:", err.stack);
        }
    });

    client.on("error", (e) => {
        console.error("MQTT Error:", e.message);
    });

    client.on("close", () => {
        console.log("MQTT disconnected. Attempting to reconnect...");
    });

    client.on("offline", () => {
        console.log("MQTT client went offline");
    });
}
