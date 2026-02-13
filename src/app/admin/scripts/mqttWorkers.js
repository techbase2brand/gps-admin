import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";
import admin from "./firebase-admin.js";

// --- Configuration ---
const MQTT_CONFIG = {
  host: "ws://sensecap-openstream.seeed.cc:8083/mqtt",
  username: "org-449810146246400",
  password: "9B1C6913197A4C56B5EC31F1CEBAECF9E7C7235B015B456DB0EC577BD7C167F3",
  protocolVersion: 4,
};

const SUPABASE_URL = "https://vhjetkdfxqbogbegboic.supabase.co";
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Use your full key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Global State ---
const latestChipData = {}; 
let facilityPolygonsCache = []; 

// =========================================================================
// GEOSPATIAL & DB UTILITIES
// =========================================================================

async function getFacilityPolygons() {
  const { data, error } = await supabase.from('facility_polygons').select('id, facility_id, slot_number, coordinates');
  if (error) return [];
  console.log(`Loaded ${data?.length || 0} polygons.`);
  return data || [];
}

function getPolygonsBySlotId(cpSlotId) {
  if (!cpSlotId) return [];
  return facilityPolygonsCache
    .filter((e) => String(e.id) === String(cpSlotId))
    .map((row) => ({
      slot_number: row.slot_number,
      coords: row.coordinates.map((c) => [c.lng, c.lat]),
      id: row.id,
      facility_id: row.facility_id
    }));
}

// =========================================================================
// NOTIFICATION LOGIC (THE ONLY NOTIFICATION LEFT)
// =========================================================================

async function sendSlotExitNotification(carRow, slotNumber) {
  const chipId = carRow.chip;
  
  // 1. Atomic update to prevent duplicate notifications
  const { count, error: lockError } = await supabase
    .from('cars')
    .update({ notification_sent_check: true })
    .eq('id', carRow.id)
    .eq('notification_sent_check', false);

  if (lockError || count === 0) return false;

  try {
    const message = `Car ${carRow.vin || chipId} has left Slot ${slotNumber}.`;
    const title = 'Slot Exit Alert';

    const { data: tokensData } = await supabase.from('user_fcm_tokens').select('fcm_token').eq('is_active', true);
    const tokens = tokensData?.map(r => r.fcm_token).filter(t => t) || [];

    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: { title, body: message },
        data: { chip_id: String(chipId), type: 'slot_exit', slot: String(slotNumber) }
      });
      console.log(`[${chipId}] Slot Exit Notification Sent.`);
      return true;
    }
  } catch (error) {
    console.error("FCM Error:", error);
  }
  return false;
}

// =========================================================================
// CORE LOGIC
// =========================================================================

async function checkSlotExit(carRow, lat, lon) {
  const { chip, cpSlot, notification_sent_check, is_moving } = carRow;

  // Only check if car is currently assigned a slot and hasn't been notified yet
  if (!cpSlot || notification_sent_check || !is_moving) return;

  const polygons = getPolygonsBySlotId(cpSlot);
  if (polygons.length === 0) return;

  const slotPoly = polygons[0];
  const carPoint = point([lon, lat]);
  const turfPoly = polygon([[...slotPoly.coords, slotPoly.coords[0]]]); // Ensure closed

  const isInside = booleanPointInPolygon(carPoint, turfPoly);

  if (!isInside) {
    console.log(`[${chip}] ALERT: Left Slot ${slotPoly.slot_number}`);
    const success = await sendSlotExitNotification(carRow, slotPoly.slot_number);
    if (success) {
      // Clear the slot in DB now that they've left
      await supabase.from("cars").update({ cpSlot: null }).eq("id", carRow.id);
    }
  }
}

async function handleFacilityStateUpdate(carRow, lat, lon, isMoving, eventName) {
  const chipId = carRow.chip;

  // 1. Prepare Update Object
  const updateObj = {
    latitude: lat,
    longitude: lon,
    is_moving: isMoving,
    last_location_update: new Date().toISOString(),
    eventName: eventName
  };

  // 2. If movement ends, reset notification flag so it can trigger next time they leave
  if (eventName.toLowerCase().includes("end")) {
    updateObj.notification_sent_check = false;
    updateObj.parkedNotification = false;
    updateObj.is_moving = false;
  }

  // 3. Update DB
  await supabase.from("cars").update(updateObj).eq("chip", chipId);

  // 4. Trigger Slot Exit Check (The only functional check)
  // We pass the updated state to the check
  const updatedCarRow = { ...carRow, ...updateObj };
  await checkSlotExit(updatedCarRow, lat, lon);
}

// =========================================================================
// WORKER SETUP
// =========================================================================

async function processLocationCheck(chipId, eventName, isMovingFromEvent) {
  const { data: carRow } = await supabase.from("cars").select("*").eq("chip", chipId).single();
  if (!carRow) return;

  let finalIsMoving = (eventName === 'GPS Update') ? carRow.is_moving : isMovingFromEvent;

  // Optimization: If parked and just a regular GPS ping, do nothing
  if (eventName === 'GPS Update' && !finalIsMoving) return;

  const cache = latestChipData[chipId];
  const lat = cache?.latestLat || carRow.latitude;
  const lon = cache?.latestLon || carRow.longitude;

  if (lat && lon) {
    await handleFacilityStateUpdate(carRow, lat, lon, finalIsMoving, eventName);
    if (cache) { cache.latestLat = null; cache.latestLon = null; }
  }
}

async function startMqttWorker() {
  facilityPolygonsCache = await getFacilityPolygons();
  const client = mqtt.connect(MQTT_CONFIG.host, MQTT_CONFIG);

  client.on("connect", () => {
    console.log("Worker Live. Monitoring Slot Exits...");
    client.subscribe([
      `/device_sensor_data/449810146246400/+/+/vs/4198`, // Lat
      `/device_sensor_data/449810146246400/+/+/vs/4197`, // Lon
      `/device_sensor_data/449810146246400/+/+/vs/5003`  // Move
    ]);
  });

  client.on("message", async (topic, message) => {
    const payload = JSON.parse(message.toString());
    const chipId = topic.split("/")[3];
    if (!latestChipData[chipId]) latestChipData[chipId] = { latestLat: null, latestLon: null, is_moving: false };

    if (topic.includes("4198")) {
      latestChipData[chipId].latestLat = parseFloat(payload.value);
      if (latestChipData[chipId].latestLon) await processLocationCheck(chipId, 'GPS Update');
    } else if (topic.includes("4197")) {
      latestChipData[chipId].latestLon = parseFloat(payload.value);
      if (latestChipData[chipId].latestLat) await processLocationCheck(chipId, 'GPS Update');
    } else if (topic.includes("5003")) {
      const eventName = payload.value[0]?.eventName || "";
      const isMoving = eventName.toLowerCase().includes("start");
      latestChipData[chipId].is_moving = isMoving;
      await processLocationCheck(chipId, eventName, isMoving);
    }
  });
}

startMqttWorker();