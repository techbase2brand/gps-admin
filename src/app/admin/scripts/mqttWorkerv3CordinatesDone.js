import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";
// import { auth } from '../lib/firebase';

import admin from "./firebase-admin.js";

const MQTT_CONFIG = {
  host: "ws://sensecap-openstream.seeed.cc:8083/mqtt",
  username: "org-449810146246400",
  password: "9B1C6913197A4C56B5EC31F1CEBAECF9E7C7235B015B456DB0EC577BD7C167F3",
  protocolVersion: 4,
};
 
const SUPABASE_URL = "https://vhjetkdfxqbogbegboic.supabase.co";
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoamV0a2RmeHFib2diZWdib2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1ODU4MzgsImV4cCI6MjA3NjE2MTgzOH0.r4GY5UgwRjhicFnnmcRxBySjN7PMJKhImSDHwxqKcyg';
 
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ FATAL: Supabase URL or Service Key not configured.");
  process.exit(1);
}
 
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
 
// State to track latest GPS values and movement events
const latestChipData = {};
let facilityPolygonsCache = [];
 
// 🔑 Fetch all Facility Polygons from Database
async function getFacilityPolygons(supabase) {
  try {
    const { data, error } = await supabase
      .from('facility_polygons')
      .select('facility_id, slot_number, coordinates')
 
    if (error) {
      console.error(" ERROR fetching facility polygons:", error.message);
      return [];
    }
 
    console.log(` Loaded ${data?.length || 0} facility polygons from database`);
    return data || [];
  } catch (error) {
    console.error(" Exception fetching facility polygons:", error);
    return [];
  }
}





async function sendNotification(chipId, facilityName, carData) {
  try {
    const message = `Car with VIN ${carData?.vin} has left ${facilityName}`;

    // SEND FCM PUSH
    if (carData?.fcm_token) {
      await admin.messaging().send({
        token: carData.fcm_token,
        notification: {
          title: "🚨 Car Left Facility",
          body: message
        },
        data: {
          chip_id: chipId.toString(),
          facility: facilityName
        }
      });

      console.log("📨 FCM Push Sent:", message);
    } else {
      console.log("⚠️ No FCM token available");
    }

    // Update DB status
    await supabase
      .from("cars")
      .update({
        notification_sent_check:true
      })
      .eq("id", carData.id);

    console.log("✅ DB updated after notification");

  } catch (error) {
    console.error("❌ Notification Error:", error);
  }
}
 
// 🔑 Get Facility Name from ID
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
    console.error(`❌ Error fetching facility name:`, error);
    return `Facility ${facilityId}`;
  }
}



function checkCarInsideFacility(currentLat, currentLng, facilityPolygons, facilityIdCheck) {

  currentLat = parseFloat(currentLat);
  currentLng = parseFloat(currentLng);

  if (isNaN(currentLat) || isNaN(currentLng)) {
    console.error("Invalid car coordinates:", currentLat, currentLng);
    return { inside: false, polygon: null };
  }
console.log("++car lng, lat",currentLng, currentLat);

  // Car point MUST be [lng, lat]
  const carPoint = point([currentLng, currentLat]);

  for (let poly of facilityPolygons) {
    try {
      // FIX: reverse each point [lat,lng] => [lng,lat]
      const fixed = poly.map(([lat, lng]) => [lng, lat]);

      const closedPolygon = closePolygon(fixed);
      const turfPolygon = polygon([closedPolygon]);

      if (booleanPointInPolygon(carPoint, turfPolygon)) {
        console.log(" INSIDE polygon:", fixed);
        return { inside: true, polygon: fixed, facilityIdCheck };
      } else {
        console.log(" OUTSIDE the polygon: ",fixed);
      }

    } catch (err) {
      console.error(" Polygon error:", err);
    }
  }

  return { inside: false, polygon: null, facilityIdCheck };
}


//close the polygen
function closePolygon(coords) {
  if (!coords || coords.length < 3) return coords;

  const first = coords[0];
  const last = coords[coords.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([...first]);
  }

  return coords;
}


 
// Main MQTT Worker Function
async function startMqttWorker() {

 
  // Load facility polygons at startup
  facilityPolygonsCache = await getFacilityPolygons(supabase);
  if (facilityPolygonsCache.length === 0) {
    console.warn("⚠️No facility polygons loaded. Facility checking will be skipped.");
  }
   if (facilityPolygonsCache.length >0) {
    console.warn("Polygens",facilityPolygonsCache);
  }
 
  // Connect to MQTT
  const client = mqtt.connect(MQTT_CONFIG.host, {
    username: MQTT_CONFIG.username,
    password: MQTT_CONFIG.password,
    protocolVersion: MQTT_CONFIG.protocolVersion,
    clientId: `org-449810146246400-backend-worker-${Date.now()}`,
  });
 
  client.on("connect", () => {
    console.log("✅ Worker Connected to MQTT.");
 
    const latitudeTopicAll = `/device_sensor_data/449810146246400/+/+/vs/4198`;
    const longitudeTopicAll = `/device_sensor_data/449810146246400/+/+/vs/4197`;
    const sensor5003TopicAll = `/device_sensor_data/449810146246400/+/+/vs/5003`; // Movement events
 
    client.subscribe([latitudeTopicAll, longitudeTopicAll, sensor5003TopicAll], (err) => {
      if (err) {
        console.error("❌ MQTT Subscribe Error:", err);
      } else {
        console.log(`✅ Subscribed to ALL chip topics (GPS + Movement Events).`);
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
          pendingEvent: null,
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
          console.log(`📍 [${chipId}] Latitude: ${lat}`);
        }
      } else if (topic.includes("4197")) {
        // Longitude
        const lon = parseFloat(payload.value);
        if (!isNaN(lon)) {
          chipData.latestLon = lon;
          console.log(`📍 [${chipId}] Longitude: ${lon}`);
        }
      }
 
      // ============================================================
      // HANDLE MOVEMENT EVENTS (Sensor 5003)
      // ============================================================
      else if (topic.includes("5003")) {
        const sensorValue = payload.value;
        if (!Array.isArray(sensorValue) || sensorValue.length === 0) {
          console.warn(`[${chipId}] Invalid sensor 5003 value format`);
          return;
        }
 
        const eventName = sensorValue[0].eventName || "";
        const eventLower = eventName.toLowerCase();
 
        console.log(`\n [${chipId}] EVENT → ${eventName}`);
 
        // Check if it's a movement event
        const isStartMoving = eventLower.includes("start") &&
                             (eventLower.includes("moving") || eventLower.includes("movement"));
        const isEndMoving = eventLower.includes("end") &&
                           (eventLower.includes("moving") || eventLower.includes("movement"));
 
        //for other events 
        if (!isStartMoving && !isEndMoving) {
          console.log(`[${chipId}] Ignoring non-movement event: ${eventName}`);
          return;
        }
 
        const isMoving = isStartMoving;
 
        // Fetch current car data from database on base of chip id 
        const { data: carRow, error: fetchErr } = await supabase
          .from("cars")
          .select("id, chip, latitude, longitude, facilityId, is_inside_facility, previousIsInsideFacility, vin, is_moving,notification_sent_check")
          .eq("chip", chipId)
          .single();

        const facilityIdCheck=carRow?.facilityId;

        const chipFacilityCoordinatesData=[]
        facilityPolygonsCache.map(e=>{
          if(e.facility_id==facilityIdCheck){
            chipFacilityCoordinatesData.push(e)
          }
        })
          
       const validChipFacilityCoordinatesData = [];

        chipFacilityCoordinatesData.forEach(row => {
          const tupleCoords = row.coordinates.map(c => [ c.lat,c.lng]);
          validChipFacilityCoordinatesData.push(tupleCoords);
        });

        // console.log(`valid chip data of ${chipId} validChipFacilityCoordinatesData`,validChipFacilityCoordinatesData);
        const currentLatitude=carRow.latitude;
        const currentLongitude=carRow.longitude;


        
        // Turf check
        const insideResult = checkCarInsideFacility(
          currentLatitude,
          currentLongitude,
          validChipFacilityCoordinatesData,facilityIdCheck
        );

        if (insideResult.inside) {
          console.log(` Chip ${chipId} IS INSIDE facility  ${insideResult.facilityIdCheck}`, insideResult.polygon );
        } else {
          console.log(` Chip ${chipId} is OUTSIDE all facility polygons ${insideResult.facilityIdCheck}`);
        }

        

 
        if (fetchErr || !carRow) {
          console.error(` Failed to fetch car row for chip ${chipId}:`, fetchErr?.message || "Car not found");
          return;
        }
 
        // Use latest GPS coordinates from MQTT or fallback to database
        let lat = chipData.latestLat || parseFloat(carRow.latitude);
        let lon = chipData.latestLon || parseFloat(carRow.longitude);
 
        // If we still don't have coordinates, use database values
        if ((!lat || isNaN(lat)) && carRow.latitude) {
          lat = parseFloat(carRow.latitude);
        }
        if ((!lon || isNaN(lon)) && carRow.longitude) {
          lon = parseFloat(carRow.longitude);
        }
 
        let currentInside = false;
        let detectedFacilityId = null;
 
        // Check if car is inside facility polygon
        if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
          const checkResult = checkCarInsideFacility(lat,lon,validChipFacilityCoordinatesData,facilityIdCheck); 
          currentInside = checkResult.inside??false;
          detectedFacilityId = checkResult.facilityIdCheck;
        } else {
          console.warn(` [${chipId}] No valid GPS coordinates available for facility check`);
        }
 
        // Get previous inside state
        const previousInside = carRow.previousIsInsideFacility ?? carRow.is_inside_facility ?? false;
 
        // Notification logic: Send notification if car left facility
        let notificationSent = false;
        let facilityName = null;
 
        if (previousInside && !currentInside) {
          console.log(`\n ALERT: Car ${chipId} LEFT the facility!`);
        
          // Get facility name for notification
          if (carRow.facilityId) {
            facilityName = await getFacilityName(carRow.facilityId);
          }
          
          // Send notification
          await sendNotification(chipId, facilityName, carRow);
          notificationSent = true;
        }
 
        // Build update object
        const updateObj = {
          last_location_update: new Date().toISOString(),
          eventName: eventName,
          is_moving: isMoving, // true for start moving, false for end moving
          is_inside_facility: currentInside,
          carParkedFacilityId: currentInside ? detectedFacilityId : null,
          previousIsInsideFacility: carRow.is_inside_facility, // Store current as previous
        };
 
        // Special handling for END MOVING
        if (isEndMoving) {
          updateObj.is_moving = false;
          updateObj.eventName = eventName;
          updateObj.is_inside_facility=currentInside;
          updateObj.notification_sent_check=false;
          console.log(` [${chipId}] END MOVEMENT → is_moving = FALSE`);
        }
 
        // Update GPS coordinates if we have them from MQTT
        if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
          updateObj.latitude = lat;
          updateObj.longitude = lon;
        }
 
        // Write to database
        const { error: updateError } = await supabase
          .from("cars")
          .update(updateObj)
          .eq("chip", chipId);
 
        if (updateError) {
          console.error(` Update failed for chip ${chipId}:`, updateError.message);
        } else {
          console.log(` UPDATED chip ${chipId} | Moving: ${isMoving} |lastcarISInside:${updateObj.previousIsInsideFacility} | CurrentInside: ${currentInside} | Facility: ${detectedFacilityId || 'none'} | Notif: ${notificationSent}`);
        }
 
        return;
      }
    } catch (err) {
      console.error(" Error processing MQTT message:", err.message);
      console.error(" Error stack:", err.stack);
    }
  });
 
  client.on("error", (e) => {
    console.error(" MQTT Error:", e.message);
  });
 
  client.on("close", () => {
    console.log(" MQTT disconnected. Reconnecting...");
    // Optionally implement reconnection logic here
  });
 
  client.on("offline", () => {
    console.log(" MQTT client went offline");
  });
}
 
// -------------------- START WORKER --------------------
startMqttWorker().catch((error) => {
  console.error(" Fatal error starting worker:", error);
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