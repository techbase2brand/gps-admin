import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";
import admin from "./firebase-admin.js";

// Configuration for MQTT and Supabase
const MQTT_CONFIG = {
  host: "ws://sensecap-openstream.seeed.cc:8083/mqtt",
  username: "org-449810146246400",
  password: "9B1C6913197A4C56B5EC31F1CEBAECF9E7C7235B015B456DB0EC577BD7C167F3",
  protocolVersion: 4,
};

// NOTE: Using a public ANON key here for simplicity, but a backend worker
// should ideally use a service role key with restricted policies.
const SUPABASE_URL = "https://vhjetkdfxqbogbegboic.supabase.co";
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoamV0a2RmeHFib2diZWdib2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1ODU4MzgsImV4cCI6MjA3NjE2MTgzOH0.r4GY5UgwRjhicFnnmcRxBySjN7PMJKhImSDHwxqKcyg';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("FATAL: Supabase URL or Service Key not configured.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Global state
const latestChipData = {}; // State to track latest GPS values from MQTT topics
let facilityPolygonsCache = []; // Cache of all facility polygons from the DB

// GLOBAL DUMMY FCM TOKEN (Used based on user request to avoid DB column dependency)
const DUMMY_FCM_TOKEN = "c57PQdJtuUbIqU0K23Urpr:APA91bGd_jYaaGQQLVR87pyka7YtAbpCZryBl4XXy1v-ZSkm_-ecg5UV-hRLdobEtz_eSq-RqBrAMQPlgNNHS5R0eZkV02DrhPm3ZVtvYxQoZFj0ddOmBCY"; 


// =========================================================================
// DATABASE UTILITIES
// =========================================================================

/**
 * Fetches all Facility Polygons from the database and caches them.
 */
async function getFacilityPolygons() {
  try {
    const { data, error } = await supabase
      .from('facility_polygons')
      .select('facility_id, slot_number, coordinates')

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

/**
 * Fetches the human-readable facility name from its ID.
 */
async function getFacilityName(facilityId) {
  if (!facilityId) return 'Unknown Facility';

  try {
    const { data, error } = await supabase
      .from('facility')
      .select('name')
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

// =========================================================================
// GEOSPATIAL UTILITIES
// =========================================================================

/**
 * Closes a polygon ring by adding the first coordinate to the end if necessary.
 */
function closePolygon(coords) {
  if (!coords || coords.length < 3) return coords;

  const first = coords[0];
  const last = coords[coords.length - 1];

  // Check if the last point is different from the first
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([...first]);
  }

  return coords;
}

/**
 * Filters the global polygon cache to get only the polygons for a specific facility,
 * and transforms them into an array of coordinate arrays, ready for Turf.js.
 */
function getFacilityPolygonsForCar(facilityId) {
  if (!facilityId) return [];
  
  // Ensure the comparison works regardless of whether the ID is stored as number or string
  const facilityIdString = String(facilityId);

  const carFacilityPolygons = facilityPolygonsCache.filter(
    (e) => String(e.facility_id) === facilityIdString
  );

  return carFacilityPolygons.map((row) => {
    // row.coordinates is typically an array of objects: [{lat: X, lng: Y}, ...]
    // We convert it to an array of [lat, lng] tuples.
    return row.coordinates.map((c) => [c.lat, c.lng]);
  });
}

/**
 * Checks if a given point is inside any of the provided facility polygons.
 */
function checkCarInsideFacility(currentLat, currentLng, facilityPolygons, facilityId) {

  currentLat = parseFloat(currentLat);
  currentLng = parseFloat(currentLng);

  if (isNaN(currentLat) || isNaN(currentLng)) {
    console.error("Invalid car coordinates:", currentLat, currentLng);
    return { inside: false, facilityIdCheck: null };
  }

  // Turf.js requires [longitude, latitude]
  const carPoint = point([currentLng, currentLat]);
  let polygonCount = 0;

  for (let poly of facilityPolygons) {
    polygonCount++;
    try {
      // 1. Convert DB format [lat, lng] to GeoJSON format [lng, lat]
      const fixed = poly.map(([lat, lng]) => [lng, lat]);

      // 2. Ensure the polygon is closed (first point == last point)
      const closedPolygon = closePolygon(fixed);
      const turfPolygon = polygon([closedPolygon]);

      if (booleanPointInPolygon(carPoint, turfPolygon)) {
        // Only log when inside, reducing log spam
        console.log(`   Location: [Lng: ${currentLng}, Lat: ${currentLat}]`);
        console.log(`   INSIDE Polygon (Slot ${polygonCount}):`, fixed);
        return { inside: true, facilityIdCheck: facilityId };
      }
    } catch (err) {
      console.error("Polygon check error:", err);
    }
  }
  
  // Log only if it checked polygons but found nothing inside
  if (facilityPolygons.length > 0) {
    console.log(`   Location: [Lng: ${currentLng}, Lat: ${currentLat}]`);
    console.log(`   OUTSIDE all ${facilityPolygons.length} polygons for facility ${facilityId}`);
  }

  return { inside: false, facilityIdCheck: null };
}

// =========================================================================
// NOTIFICATION & STATE UPDATE UTILITIES
// =========================================================================

/**
 * Sends FCM notification and updates the car's notification status in the DB.
 */
async function sendNotification(chipId, facilityName, carData) {
  try {
    const message = `Car with VIN ${carData?.vin} has left ${facilityName}`;
    
    // Using the DUMMY_FCM_TOKEN defined globally as per user request
    const targetToken = DUMMY_FCM_TOKEN; 

    if (targetToken && targetToken !== "your-single-global-fcm-token-here") {
      await admin.messaging().send({
        token: targetToken,
        notification: {
          title: "Car Left Facility",
          body: message
        },
        data: {
          chip_id: chipId.toString(),
          facility: facilityName
        }
      });

      console.log("FCM Push Sent to DUMMY TOKEN:", message);
    } else {
      console.log("No valid FCM token available. Using global dummy token, but it's not configured.");
    }

    // Update DB status to prevent repeat notification until next End Moving event
    await supabase
      .from("cars")
      .update({
        notification_sent_check: true
      })
      .eq("id", carData.id);

    console.log("DB updated after notification was sent.");

  } catch (error) {
    console.error("Notification Error:", error);
  }
}

/**
 * Centralized function to handle the core facility check and DB update logic.
 */
async function handleFacilityStateUpdate(carRow, lat, lon, isMoving, eventName = 'Location Update') {
  const chipId = carRow.chip;
  const facilityIdCheck = carRow.facilityId;

  console.log(`\n--- [${chipId}] Processing Location Update: ${eventName} ---`);

  // Ensure isMoving is explicitly boolean
  if (isMoving === null || isMoving === undefined) {
    isMoving = false;
  }

  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    console.warn(`[${chipId}] No valid GPS coordinates available. Skipping facility check.`);
    return;
  }

  // 1. Get facility polygons specific to this car's assigned facility
  const validPolygons = getFacilityPolygonsForCar(facilityIdCheck);
  if (validPolygons.length === 0) {
    console.warn(`[${chipId}] No facility polygons found for Facility ID ${facilityIdCheck}. Skipping check.`);
    return; 
  }

  // 2. Perform the geospatial check
  const checkResult = checkCarInsideFacility(lat, lon, validPolygons, facilityIdCheck);
  const currentInside = checkResult.inside ?? false;
  const detectedFacilityId = currentInside ? facilityIdCheck : null;

  // 3. Get previous state
  const previousInside = carRow.previousIsInsideFacility ?? carRow.is_inside_facility ?? false;
  const notificationSent = carRow.notification_sent_check ?? false;
  let notificationTriggered = false;
  let facilityName = null;

  // 4. Notification Logic: If previously inside, but now outside, AND notification hasn't been sent yet
  if (previousInside && !currentInside && !notificationSent) {
    console.log(`\n ALERT: Car ${chipId} LEFT the facility!`);

    if (carRow.facilityId) {
      facilityName = await getFacilityName(carRow.facilityId);
    }
    
    // Send notification and set notification_sent_check to true
    await sendNotification(chipId, facilityName, carRow);
    notificationTriggered = true;
  }

  // 5. Build update object
  const updateObj = {
    last_location_update: new Date().toISOString(),
    eventName: eventName,
    is_moving: isMoving, // Now guaranteed to be a boolean (true/false)
    is_inside_facility: currentInside,
    carParkedFacilityId: detectedFacilityId,
    previousIsInsideFacility: carRow.is_inside_facility, // Store current DB state as previous
    latitude: lat,
    longitude: lon,
  };

  // Special handling for END MOVING event
  if (eventName.toLowerCase().includes("end") && (eventName.toLowerCase().includes("moving") || eventName.toLowerCase().includes("movement"))) {
    updateObj.is_moving = false;
    updateObj.notification_sent_check = false; // Reset notification flag on parking event
    console.log(`[${chipId}] END MOVEMENT -> is_moving = FALSE. Notification flag reset.`);
  }

  // 6. Write to database
  const { error: updateError } = await supabase
    .from("cars")
    .update(updateObj)
    .eq("chip", chipId);

  if (updateError) {
    console.error(`Update failed for chip ${chipId}:`, updateError.message);
  } else {
    console.log(`UPDATED chip ${chipId} | Moving: ${updateObj.is_moving} | PrevInside: ${previousInside} | CurrentInside: ${currentInside} | NotifTriggered: ${notificationTriggered}`);
  }
}

// =========================================================================
// GPS UPDATE PROCESSING FUNCTION (Triggers Check)
// =========================================================================

/**
 * Fetches car data, determines the final coordinates (MQTT cache or DB), 
 * triggers the geofence check, and cleans up the MQTT cache.
 * @param {string} chipId 
 * @param {string} eventName - Describes the trigger (e.g., 'GPS Update' or 'Start moving event')
 * @param {boolean} isMoving - Boolean status to save to the DB (only applicable for 5003 events)
 */
async function processLocationCheck(chipId, eventName, isMoving) {
    // 1. Fetch current car data from database
    const { data: carRow, error: fetchErr } = await supabase
        .from("cars")
        .select("id, chip, latitude, longitude, facilityId, is_inside_facility, previousIsInsideFacility, vin, is_moving, notification_sent_check")
        .eq("chip", chipId)
        .single();

    if (fetchErr || !carRow) {
        console.error(`Failed to fetch car row for chip ${chipId}:`, fetchErr?.message || "Car not found");
        return;
    }

    // ====================================================================
    // OPTIMIZATION: SKIP CHECK FOR PARKED CARS (User Request)
    // If the event is just a routine GPS update (not a movement event)
    // AND the car is currently marked as NOT moving in the DB, skip processing.
    // Movement events (Start/End) MUST always be processed.
    // ====================================================================
    if (eventName === 'GPS Update' && !carRow.is_moving) {
        console.log(`[${chipId}] Skipping GPS check: Car is currently parked (is_moving: ${carRow.is_moving}).`);
        return;
    }

    const chipData = latestChipData[chipId];
    
    // 2. Determine final coordinates: Prioritize fresh MQTT cache, fallback to database
    let lat = chipData?.latestLat || parseFloat(carRow.latitude || null);
    let lon = chipData?.latestLon || parseFloat(carRow.longitude || null);

    // 3. Run centralized update logic
    await handleFacilityStateUpdate(carRow, lat, lon, isMoving, eventName);

    // 4. Clear the MQTT cache after processing the complete location
    if (chipData) {
        chipData.latestLat = null;
        chipData.latestLon = null;
    }
}


// =========================================================================
// MAIN MQTT WORKER
// =========================================================================

/**
 * Main MQTT Worker Function to connect and listen to topics.
 */
async function startMqttWorker() {

  // Load facility polygons at startup
  facilityPolygonsCache = await getFacilityPolygons();
  if (facilityPolygonsCache.length === 0) {
    console.warn("Facility checking will be limited until polygons are loaded.");
  }

  console.log("Periodic position check is DISABLED. Checks rely only on MQTT events (4197, 4198, 5003).");

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
      // TRIGGERS CHECK ONLY WHEN A COMPLETE PAIR IS AVAILABLE.
      // ============================================================
      if (topic.includes("4198")) {
        // Latitude
        const lat = parseFloat(payload.value);
        if (!isNaN(lat)) {
          chipData.latestLat = lat;
          // Check if we already have the Lon from a previous message
          if (chipData.latestLon !== null) {
            // Trigger check only when a complete Lat/Lon pair is ready
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

// -------------------- START WORKER --------------------
startMqttWorker().catch((error) => {
  console.error("Fatal error starting worker:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n Worker stopped by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n Worker stopped by system");
  process.exit(0);
});

export default supabase;