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

// Global state
const latestChipData = {}; // State to track latest GPS values from MQTT topics
let facilityPolygonsCache = []; // Cache of all facility polygons from the DB

// DURATION FOR PARKED STABILITY CHECK
// 3600000 ms = 1 Hour (60 minutes * 60 seconds * 1000 ms)
const PARK_CHECK_DELAY_MS = 300000; // Using 3.6 seconds for testing

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

/**
 * Fetches the human-readable facility name from its ID.
 */
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
 * Filters the global polygon cache by the facility_polygons.id (which is stored in cars.cpSlot).
 * Used for checking exit from a SPECIFIC assigned slot.
 * @returns {Array<{slot_number: number, coords: Array<[number, number]>, id: number, facility_id: number}>} Array containing 0 or 1 processed polygon objects.
 */
function getPolygonsBySlotId(cpSlotId) { // Filters by the specific polygon row ID (cpSlotId)
  if (!cpSlotId) return [];
  
  const cpSlotString = String(cpSlotId);
  
  const polygons = facilityPolygonsCache.filter(
    (e) => String(e.id) === cpSlotString
  );
  
  return polygons.map((row) => {
    // row.coordinates is [{lat: X, lng: Y}, ...]. Convert to array of [lat, lng] tuples.
    const coords = row.coordinates.map((c) => [c.lat, c.lng]);
    return {
        slot_number: row.slot_number,
        coords: coords, // [lat, lng]
        id: row.id,
        facility_id: row.facility_id
    };
  });
}

/**
 * Filters the global polygon cache to get all polygons for a specific facility ID.
 * Used for general facility entry/exit check and new slot detection.
 * @returns {Array<{slot_number: number, coords: Array<[number, number]>, id: number, facility_id: number}>} Array of processed polygon objects.
 */
function getPolygonsByFacilityId(facilityId) { // Filters by the common facility ID
  if (!facilityId) return [];
  
  const facilityIdString = String(facilityId);
  
  // Filters by the common facility ID (e.facility_id)
  const facilityPolygons = facilityPolygonsCache.filter(
    (e) => String(e.facility_id) === facilityIdString
  );
  
  return facilityPolygons.map((row) => {
    // row.coordinates is [{lat: X, lng: Y}, ...]. Convert to array of [lat, lng] tuples.
    const coords = row.coordinates.map((c) => [c.lat, c.lng]);
    return {
        slot_number: row.slot_number,
        coords: coords, // [lat, lng]
        id: row.id,
        facility_id: row.facility_id
    };
  });
}


/**
 * Checks if a given point is inside a specific slot polygon.
 */
function checkCarInsideSpecificSlot(currentLat, currentLng, slotPolygon, slotNumber, facilityId) {
  currentLat = parseFloat(currentLat);
  currentLng = parseFloat(currentLng);
  
  if (isNaN(currentLat) || isNaN(currentLng)) {
    console.error("Invalid car coordinates:", currentLat, currentLng);
    return { inside: false, slotNumber: null };
  }

  // Turf.js requires [longitude, latitude]
  const carPoint = point([currentLng, currentLat]);

  try {
    // 1. Convert DB format [lat, lng] to GeoJSON format [lng, lat]
    // slotPolygon.coords is [lat, lng]
    const fixedCoords = slotPolygon.coords.map(([lat, lng]) => [lng, lat]); 
    // 2. Ensure the polygon is closed (first point == last point)
    const closedPolygon = closePolygon(fixedCoords);
    const turfPolygon = polygon([closedPolygon]);

    if (booleanPointInPolygon(carPoint, turfPolygon)) {
      console.log(`   Location: [Lng: ${currentLng}, Lat: ${currentLat}]`);
      console.log(`   ✅ INSIDE Slot ${slotNumber}`);
      return { inside: true, slotNumber: slotNumber };
    } else {
      console.log(`   Location: [Lng: ${currentLng}, Lat: ${currentLat}]`);
      console.log(`   ❌ OUTSIDE Slot ${slotNumber} (Facility ${facilityId})`);
      return { inside: false, slotNumber: slotNumber };
    }
  } catch (err) {
    console.error("Slot polygon check error:", err);
    return { inside: false, slotNumber: null };
  }
}

/**
 * Checks if a given point is inside any of the provided facility polygons.
 * Returns the matching slot number and the polygon's ID (to be saved as cpSlot) if found.
 */
function checkCarInsideFacility(currentLat, currentLng, facilityPolygons, facilityId) {
  currentLat = parseFloat(currentLat);
  currentLng = parseFloat(currentLng);
  
  if (isNaN(currentLat) || isNaN(currentLng)) {
    console.error("Invalid car coordinates:", currentLat, currentLng);
    return { inside: false, facilityIdCheck: null, slotNumber: null, cpSlotId: null };
  }

  const checkedPolygons = []; // Array to store details of polygons checked
  const carPoint = point([currentLng, currentLat]);

  for (let polyObj of facilityPolygons) {
    try {
      // 1. Convert DB format [lat, lng] to GeoJSON format [lng, lat]
      const fixedCoords = polyObj.coords.map(([lat, lng]) => [lng, lat]);
      // 2. Ensure the polygon is closed (first point == last point)
      const closedPolygon = closePolygon(fixedCoords);
      const turfPolygon = polygon([closedPolygon]);
      
      // Store checked polygon info (before the inside check)
      checkedPolygons.push(`Slot ${polyObj.slot_number} (ID: ${polyObj.id})`);

      if (booleanPointInPolygon(carPoint, turfPolygon)) {
        // Log the success with full detail
        console.log(`   Location: [Lng: ${currentLng}, Lat: ${currentLat}]`);
        console.log(`   ✅ INSIDE Facility ${facilityId}, Slot ${polyObj.slot_number} (ID: ${polyObj.id})`);
        return { 
            inside: true, 
            facilityIdCheck: facilityId, 
            slotNumber: polyObj.slot_number,
            cpSlotId: polyObj.id // Return the facility_polygons.id to be saved as cars.cpSlot
        };
      }
    } catch (err) {
      console.error("Polygon check error:", err);
    }
  }
  
  // Log the failure with full detail
  if (facilityPolygons.length > 0) {
    console.log(`   Location: [Lng: ${currentLng}, Lat: ${currentLat}]`);
    
    // Log details of the check
    const facilityIdString = facilityId || 'Unknown Facility ID';
    // Use the collected details for the final failure log
    console.log(`   ❌ OUTSIDE all polygons for Facility ${facilityIdString}. Checked: ${checkedPolygons.join(', ')}`);
  }
  return { inside: false, facilityIdCheck: null, slotNumber: null, cpSlotId: null };
}

// =========================================================================
// NOTIFICATION & STABILITY CHECK UTILITIES
// =========================================================================

/**
 * Sends FCM notification for car exit/left facility.
 */
async function sendNotification(chipId, facilityName, carData, slotNumber) {
  let finalSlotNumber = slotNumber ?? 'Unknown'; // Ensure it's not null/undefined for the message
  try {
    const message = `Car with VIN ${carData?.vin} and chip id ${carData?.chip} has left ${facilityName}, Slot ${finalSlotNumber}.`;
    const title = 'Car Left Facility';
 
    // FETCH ACTIVE TOKENS (Ensure is_active=true filter is used)
    const { data: tokensData, error: fetchError } = await supabase
      .from('user_fcm_tokens')
      .select('fcm_token')
      .eq('is_active', true);
 
    if (fetchError) {
      console.error(
        'ERROR fetching active FCM tokens for notification:',
        fetchError.message,
      );
      return false; // Return false on error
    }
 
    const tokensToSend = tokensData
      .map(row => row.fcm_token)
      .filter(token => token);
 
    console.log(
      `++++ Fetched ${tokensToSend.length} active tokens for broadcast.`,
    );
 
    if (tokensToSend.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokensToSend,
 
        // UI notification (Android + iOS)
        notification: {
          title,
          body: message,
        },
 
        // Data payload
        data: {
          chip_id: chipId.toString(),
          facility: facilityName,
          slot: String(finalSlotNumber),
          title,
          body: message,
          type: 'car_left_facility',
        },
 
        // Android specific (optional but recommended)
        android: {
          priority: 'high',
          notification: {
            channelId: 'default-channel-id',
            sound: 'default',
          },
        },
 
        // iOS / APNs config
        apns: {
          headers: {
            'apns-priority': '10', // Immediate delivery
          },
          payload: {
            aps: {
              alert: {
                title,
                body: message,
              },
              sound: 'default',
              'content-available': 1,
            },
          },
        },
      });
 
      console.log(
        `FCM Broadcast Sent successfully to ${response.successCount} tokens.`,
      );
 
      // Update DB status to prevent repeat notification until next End Moving event
      const { error: updateError } = await supabase
        .from('cars')
        .update({
          notification_sent_check: true,
        })
        .eq('id', carData.id);
      
      if (updateError) {
        console.error('DB update failed after successful FCM send. Re-notification possible.', updateError);
        return false; // Treat as failure if DB update fails to ensure retry
      }
 
      console.log('DB updated after notification was sent.');
      return true; // Notification attempt successful (even if 0 tokens sent)
    } else {
      console.log('No active FCM tokens available for broadcasting.');
      return false;
    }
  } catch (error) {
    // If any error occurs (FCM failure or DB update failure after FCM), 
    // the notification_sent_check flag is not set to true, allowing retry.
    console.error('Notification Error: Failed to send or update DB status after successful send attempt.', error);
    return false; // Notification attempt failed
  }
}


/**
 * Sends a notification specifically for a confirmed parked car and updates the parkedNotification flag.
 */
async function sendParkedNotification(chipId, facilityName, carData, slotNumber) {
    try {
        const title = "Car Parked Confirmation";
        const message = `Car with VIN ${carData?.vin} is confirmed parked in ${facilityName}, Slot ${slotNumber}.`;

        // 1. Fetch Active Tokens (Ensure is_active=true filter is used)
        const { data: tokensData, error: fetchError } = await supabase
            .from("user_fcm_tokens")
            .select("fcm_token")
            .eq("is_active", true); // Added is_active filter for correct functionality

        if (fetchError) {
            console.error("ERROR fetching active FCM tokens for PARKED notification:", fetchError.message);
            return false;
        }

        const tokensToSend = tokensData.map(row => row.fcm_token).filter(token => token);

        console.log(`++++ Fetched ${tokensToSend.length} tokens for PARKED broadcast.`);

        if (tokensToSend.length > 0) {
            const response = await admin.messaging().sendEachForMulticast({
                tokens: tokensToSend,
                
                // UI notification (Android + iOS)
                notification: {
                    title,
                    body: message,
                },

                // Data payload
                data: {
                    chip_id: chipId.toString(),
                    facility: facilityName,
                    slot: String(slotNumber),
                    title,
                    body: message,
                    type: 'car_parked_confirmed'
                },
                
                // Android specific
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'default-channel-id',
                        sound: 'default',
                    },
                },
                
                // iOS / APNs config
                apns: {
                    headers: {
                        'apns-priority': '10', // Immediate delivery
                    },
                    payload: {
                        aps: {
                            alert: {
                                title,
                                body: message,
                            },
                            sound: 'default',
                            'content-available': 1,
                        },
                    },
                },
            });

            console.log(`FCM Broadcast (Parked) Sent successfully to ${response.successCount} tokens.`);

            // 2. Update parkedNotification flag only upon successful sending
            const { error: updateError } = await supabase
                .from("cars")
                .update({
                    parkedNotification: true
                })
                .eq("id", carData.id);

            if (updateError) {
                console.error('DB update failed after successful PARKED FCM send. Re-notification possible.', updateError);
                return false;
            }

            console.log("DB updated: parkedNotification set to TRUE.");
            return true;
        } else {
            console.log("No active FCM tokens for parked notification. DB flag remains false.");
            return false;
        }
    } catch (error) {
        console.error("Parked Notification Error:", error);
        return false;
    }
}


/**
 * Checks if the car's current location is stable and still inside the facility 
 * one hour after the End Movement event.
 */
async function checkParkedStability(chipId) {
    console.log(`\n--- [${chipId}] Running Scheduled Park Stability Check ---`);
    
    // 1. Fetch the latest car state from DB
    // Fetch all relevant parking fields
    const { data: carRow, error: fetchErr } = await supabase
        .from("cars")
        .select("id, chip, latitude, longitude, parkedLatitude, parkedLongitude, cpSlot, is_inside_facility, parkedNotification, vin, facilityId")
        .eq("chip", chipId)
        .single();

    if (fetchErr || !carRow || carRow.cpSlot === null) { // cpSlot must exist
        console.error(`Park Check failed for chip ${chipId}: Car data or cpSlot not found.`);
        return;
    }

    const { latitude, longitude, parkedLatitude, parkedLongitude, is_inside_facility, parkedNotification, cpSlot, facilityId } = carRow;

    // Check 1: Has the notification already been sent?
    if (parkedNotification) {
        console.log(`[${chipId}] Park Check skipped: Notification already sent.`);
        return;
    }

    // Check 2: Are current and parked coordinates valid?
    if (latitude === null || longitude === null || parkedLatitude === null || parkedLongitude === null) {
        console.warn(`[${chipId}] Park Check skipped: Missing coordinate data.`);
        return;
    }
    
    // Check 3: Is the car still stable (close to parked spot)?
    const latDiff = Math.abs(latitude - parkedLatitude);
    const lonDiff = Math.abs(longitude - parkedLongitude);
    const isStable = latDiff < 0.0001 && lonDiff < 0.0001; // Approx 10 meters tolerance
    console.log(`[${chipId}] Stability Check: Stable=${isStable}, Inside Facility=${is_inside_facility}`);

    // Check 4: Is the car stable AND still inside the facility?
    if (isStable && is_inside_facility) {
        
        // Fetch the polygon data using the cpSlot ID to get the slot number
        const slotPolygons = getPolygonsBySlotId(cpSlot);
        
        if (slotPolygons.length === 0) {
             console.warn(`[${chipId}] Park Check failed: Slot polygon data for cpSlot ${cpSlot} not found in cache.`);
             return;
        }

        const slotNumber = slotPolygons[0].slot_number;
        const facilityName = await getFacilityName(facilityId); // Use the main facilityId for name
        
        console.log(`\n ✅ [${chipId}] PARKED CONFIRMATION: Stable and inside facility slot ${slotNumber}.`);
        
        // Send notification and set parkedNotification to true (in DB upon success)
        await sendParkedNotification(chipId, facilityName, carRow, slotNumber);
    } else {
        console.log(`[${chipId}] Park Check completed: Car moved or left facility after end event.`);
    }
}

/**
 * Schedules the checkParkedStability function for a later time.
 */
function scheduleParkCheck(chipId, delay) {
    console.log(`\n ⏱️ [${chipId}] Scheduled Park Check to run in ${delay / 1000} seconds.`);
    
    setTimeout(() => {
        // The check will run independently after the delay
        checkParkedStability(chipId).catch(err => {
            console.error(`Scheduled Park Check failed for ${chipId}:`, err);
        });
    }, delay);
}

/**
 * Checks if car with slot ID has moved outside that specific slot and sends notification.
 * This is a separate check that does NOT require previousIsInsideFacility.
 */
async function checkSlotExitNotification(carRow, lat, lon) {
    const chipId = carRow.chip;
    const cpSlot = carRow.cpSlot;
    const facilityId = carRow.facilityId;

    // Only check if car has a slot ID assigned
    if (cpSlot === null || cpSlot === undefined || carRow.notification_sent_check === true) {
        // FIX: Added detailed logging for skipping the check
        if (cpSlot === null || cpSlot === undefined) {
             console.log(`[${chipId}] Slot Exit Check skipped: cpSlot is null/undefined.`);
        } else if (carRow.notification_sent_check === true) {
             console.log(`[${chipId}] Slot Exit Check skipped: Notification already sent (notification_sent_check=true).`);
        }
        return false; // No slot assigned, or already notified, skip
    }

    console.log(`\n--- [${chipId}] Checking Slot Exit for Slot ID ${cpSlot} ---`);

    // Get facility polygons
    const validPolygons = getPolygonsBySlotId(cpSlot); // Filters by facility_polygons.id
    if (validPolygons.length === 0) {
        console.warn(`[${chipId}] No facility polygons found for cpSlot ID ${cpSlot}. Cannot check slot exit.`);
        return false;
    }

    // Find the specific slot polygon 
    const slotPolygon = validPolygons[0]; 
    const slotNumber = slotPolygon.slot_number; // Get the human-readable slot number
    
    // Log the specific slot coordinates for debugging (User Request)
    console.log(`   Slot ${slotNumber} (ID ${cpSlot}) Polygon Coords: ${JSON.stringify(slotPolygon.coords)}`);


    // Check if car is currently outside this specific slot
    const slotCheck = checkCarInsideSpecificSlot(lat, lon, slotPolygon, slotNumber, facilityId); 

    // If car is outside the slot, send notification
    if (!slotCheck.inside) {
        console.log(`\n 🚨 ALERT: Car ${chipId} has LEFT Slot ${slotNumber}!`);
        
        const facilityName = await getFacilityName(facilityId);
        
        // Send notification (this will set notification_sent_check to true in DB)
        const notificationSentSuccessfully = await sendNotification(chipId, facilityName, carRow, slotNumber);
        
        if (notificationSentSuccessfully) {
             // Clear cpSlot in database since car left the slot, but DO NOT update other state here.
            await supabase
                .from("cars")
                .update({
                    cpSlot: null,
                    // notification_sent_check is set in sendNotification
                })
                .eq("id", carRow.id); // Use carRow.id to update the specific row
            
            console.log(`[${chipId}] Slot exit notification sent and cpSlot cleared.`);
            return true; // Indicate that exit and notification occurred
        } else {
             // If sending fails, we do NOT clear cpSlot or notification_sent_check, allowing retry.
            console.log(`[${chipId}] Notification failed. Skipping cpSlot clear.`);
            return false;
        }
    } else {
        console.log(`[${chipId}] Car is still inside Slot ${slotNumber}. No notification needed.`);
        return false; // Indicate no exit
    }
}

/**
 * Centralized function to handle the core facility check and DB update logic.
 */
async function handleFacilityStateUpdate(carRow, lat, lon, isMoving, eventName = 'Location Update') {
  const chipId = carRow.chip;
  const facilityIdCheck = carRow.facilityId;
  let facilityName = 'Unknown Facility'; // Initialize facilityName

  console.log(`\n--- [${chipId}] Processing Location Update: ${eventName} ---`);
  // LOG DB FETCHED Cpslot value for verification
  console.log(`   DB State: cpSlot=${carRow.cpSlot}, is_moving=${carRow.is_moving}, PrevInside=${carRow.previousIsInsideFacility}, NotifSent=${carRow.notification_sent_check}`);


  // Ensure isMoving is explicitly boolean
  if (isMoving === null || isMoving === undefined) {
    isMoving = false;
  }

  // --- 1. Check if this is an End Movement event ---
  const isEndMovement = eventName.toLowerCase().includes("end") && 
                        (eventName.toLowerCase().includes("moving") || eventName.toLowerCase().includes("movement"));
  const isStartMovement = eventName.toLowerCase().includes("start") && 
                        (eventName.toLowerCase().includes("moving") || eventName.toLowerCase().includes("movement"));

  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    console.warn(`[${chipId}] No valid GPS coordinates available. Skipping facility check.`);
    return;
  }
  
  // ====================================================================
  // CRITICAL STEP: Check Slot Exit if cpSlot is set and car is moving.
  // ====================================================================
  let notificationTriggered = false;
  
  // Slot Exit Check runs if car has a slot AND is moving, triggered by GPS Update OR Start Movement.
  const isMovementRelatedEvent = eventName === 'GPS Update' || isStartMovement;

  if (carRow.cpSlot !== null && carRow.is_moving === true && isMovementRelatedEvent) {
     const exited = await checkSlotExitNotification(carRow, lat, lon);
     
     if (exited) {
        notificationTriggered = true;

        // Refetch the row to get the updated cpSlot and notification_sent_check status
        // This ensures the main update uses the correct, cleared cpSlot=null value.
        const { data: updatedCarRow } = await supabase
          .from("cars")
          .select("notification_sent_check, cpSlot")
          .eq("chip", chipId)
          .single();
        
        if (updatedCarRow) {
            carRow.cpSlot = updatedCarRow.cpSlot; // Should be null
            carRow.notification_sent_check = updatedCarRow.notification_sent_check; // Should be true
        }
     }
  }


  // 2. Get facility polygons specific to this car's assigned facility
  const validPolygons = getPolygonsByFacilityId(facilityIdCheck); 
  if (validPolygons.length === 0) {
    console.warn(`[${chipId}] No facility polygons found for Facility ID ${facilityIdCheck}. Skipping check.`);
  }

  // 3. Determine Check Target: Always check all valid polygons for new slot detection/facility inside status.
  let polygonsToAcknowledge = validPolygons;
  let checkMode = 'Facility (All Slots)'; 
  
  console.log(`   Check Mode: ${checkMode}`);


  // 4. Perform the geospatial check (Full check for new slot detection/is_inside_facility)
  const checkResult = validPolygons.length > 0
    // checkCarInsideFacility returns cpSlotId
    ? checkCarInsideFacility(lat, lon, polygonsToAcknowledge, facilityIdCheck)
    // Default to outside if no polygons loaded
    : { inside: false, facilityIdCheck: null, slotNumber: null, cpSlotId: null }; 

  const currentInside = checkResult.inside ?? false;
  const detectedFacilityId = currentInside ? facilityIdCheck : null;
  // Detected Slot ID is the facility_polygons.id
  const detectedCpSlotId = checkResult.cpSlotId; 

  // 5. Get previous state
  const previousInside = carRow.previousIsInsideFacility ?? carRow.is_inside_facility ?? false;
  const notificationSent = carRow.notification_sent_check ?? false;
  
  // 6. Legacy Notification Logic (EXIT ALERT): Trigger if previousInside=true and currentInside=false (Full Facility Exit)
  if (!isEndMovement && previousInside && !currentInside && !notificationSent && !notificationTriggered) {
    
    const alertTarget = carRow.facilityId ? `Facility ${carRow.facilityId}` : 'Facility';
    console.log(`\n 🚨 ALERT: Car ${chipId} LEFT the ${alertTarget} (Full Facility Exit)!`);

    if (carRow.facilityId) {
      facilityName = await getFacilityName(carRow.facilityId); // Correctly assigns to initialized variable
    }
    
    // Send notification (No slot number here, as it's a general facility exit)
    await sendNotification(chipId, facilityName, carRow, 'Unknown');
    notificationTriggered = true;
  }

  // 7. Build update object with new parking fields
  const updateObj = {
    // FIX: Ensure last_location_update is set to the current time for non-EndMovement events
    last_location_update: new Date().toISOString(), 
    eventName: eventName,
    is_moving: isMoving,
    is_inside_facility: currentInside,
    carParkedFacilityId: detectedFacilityId,
    previousIsInsideFacility: carRow.is_inside_facility, 
    latitude: lat,
    longitude: lon,
    parkedNotification: carRow.parkedNotification || false, 
    
    // Use the *newly detected cpSlot ID* ONLY if currently inside. 
    // Otherwise, carry forward the updated cpSlot (which might be null if cleared by checkSlotExitNotification).
    cpSlot: currentInside ? detectedCpSlotId : carRow.cpSlot || null, 
    
    // notification_sent_check: If notification was triggered by checkSlotExitNotification, it's already TRUE in DB.
    // If not triggered, we maintain the current DB state (carRow.notification_sent_check).
    notification_sent_check: carRow.notification_sent_check || notificationTriggered
  };
  
  // 8. Special handling for END MOVING event: Reset flags AND save parked coordinates/slot
  if (isEndMovement) {
    // FIX: Set last_location_update here to accurately reflect the parking time
    updateObj.carParkedTime = new Date().toISOString(); 
    
    updateObj.is_moving = false;
    updateObj.notification_sent_check = false; // Reset exit notification flag
    updateObj.parkedNotification = false; // Reset parked notification flag

    // Save parked location/slot ID for stability check
    updateObj.parkedLatitude = lat;
    updateObj.parkedLongitude = lon;
    
    // If you had a 'parked_time' column, it would be set here:
    // updateObj.parked_time = updateObj.last_location_update;
    
    updateObj.cpSlot = detectedCpSlotId; // Use the newly detected slot ID for parking

    console.log(`[${chipId}] END MOVEMENT -> is_moving = FALSE. Flags reset. Parked location saved. Parked Lng: ${lon}, Parked Lat: ${lat}. Timestamp: ${updateObj.carParkedTime}`);

    // Schedule the stability check (PARK_CHECK_DELAY_MS is 3.6s for testing)
    if (detectedCpSlotId && currentInside) {
      scheduleParkCheck(chipId, PARK_CHECK_DELAY_MS);
    }
  }

  // 9. Write to database
  const { error: updateError } = await supabase
    .from("cars")
    .update(updateObj)
    .eq("chip", chipId);

  if (updateError) {
    console.error(`Update failed for chip ${chipId}:`, updateError.message);
  } else {
    // Log the FINAL cpSlot value that was sent to the database
    const finalCpSlot = updateObj.cpSlot;
    console.log(`UPDATED chip ${chipId} | Moving: ${updateObj.is_moving} | PrevInside: ${previousInside} | CurrentInside: ${currentInside} | Slot ID: ${finalCpSlot} | NotifTriggered: ${notificationTriggered} | ParkCheckScheduled: ${isEndMovement && currentInside ? 'YES' : 'NO'} | FinalNotifCheck: ${updateObj.notification_sent_check}`);
  }
}

// =========================================================================
// GPS UPDATE PROCESSING FUNCTION (Triggers Check)
// =========================================================================

/**
 * Fetches car data, determines the final coordinates (MQTT cache or DB), 
 * triggers the geofence check, and cleans up the MQTT cache.
 */
async function processLocationCheck(chipId, eventName, isMovingFromEvent) {
    // 1. Fetch current car data from database
    const { data: carRow, error: fetchErr } = await supabase
        .from("cars")
        .select("id, chip, latitude, longitude, facilityId, is_inside_facility, previousIsInsideFacility, vin, is_moving, notification_sent_check, parkedNotification, cpSlot, parkedLatitude, parkedLongitude")
        .eq("chip", chipId)
        .single();

    if (fetchErr || !carRow) {
        console.error(`Failed to fetch car row for chip ${chipId}:`, fetchErr?.message || "Car not found");
        return;
    }

    // Determine the final 'is_moving' state to be saved to the database.
    let finalIsMovingState;
    if (eventName === 'GPS Update') {
        // For simple GPS updates, the source of truth for 'is_moving' must be the database.
        finalIsMovingState = carRow.is_moving; 
    } else {
        // For 5003 Movement events, use the state calculated from the event itself.
        finalIsMovingState = isMovingFromEvent;
    }
    
    // ====================================================================
    // OPTIMIZATION: SKIP CHECK FOR PARKED CARS (User Request)
    // ====================================================================
    if (eventName === 'GPS Update' && !carRow.is_moving) {
        console.log(`[${chipId}] Skipping GPS check: Car is parked (is_moving = ${carRow.is_moving}).`);
        return;
    }

    const chipData = latestChipData[chipId];
    
    // 2. Determine final coordinates: Prioritize fresh MQTT cache, fallback to database
    let lat = chipData?.latestLat || parseFloat(carRow.latitude || null);
    let lon = chipData?.latestLon || parseFloat(carRow.longitude || null);

    // 3. Run centralized update logic
    await handleFacilityStateUpdate(carRow, lat, lon, finalIsMovingState, eventName);

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

  // 1. Load facility polygons at startup
  facilityPolygonsCache = await getFacilityPolygons();
  if (facilityPolygonsCache.length === 0) {
    console.warn("Facility checking will be limited until polygons are loaded.");
  }
  // LOG FIX: Log cache content for verification
  console.log("++facilityPolygonsCache loaded with:",facilityPolygonsCache.length, "entries.");


  console.log("Periodic position check is DISABLED. Checks rely only on MQTT events (4197, 4198, 5003).");
  console.log(`Park stability check delay set to ${PARK_CHECK_DELAY_MS / 1000} seconds.`);

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