import { point, polygon } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import sendNotification from "./useNotification.js"

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

const getData = async (supabase, searchData) => {
    const { data, error } = await supabase
        .from(searchData.table)
        .select(searchData.select)
    [searchData.type](searchData.searchOnColumn, searchData.Search);

    return { data, error };
};



const updateData = async (supabase, config) => {
    const { data, error } = await supabase
        .from(config.table)
        .update(config.updateValues)
        .eq(config.columnName, config.ValueMatch)
        .select();

    return { data, error };
};

function checkCarInsideFacility(chip, currentLat, currentLng, facilityPolygons, facilityId) {
    const lat = parseFloat(currentLat);
    const lng = parseFloat(currentLng);

    if (isNaN(lat) || isNaN(lng)) return { inside: false };
    const carPoint = point([lng, lat]);

    for (let polyObj of facilityPolygons) {
        try {
            const rawCoords = polyObj.coordinates.map(p => [p.lng, p.lat]);
            const closedCoords = closePolygon(rawCoords);
            const turfPolygon = polygon([closedCoords]);
            if (booleanPointInPolygon(carPoint, turfPolygon)) {
                console.log(`MATCH: Point is inside Slot ${polyObj.id}`);
                return {
                    chip: chip,
                    inside: true,
                    slotId: polyObj.id
                };
            }
            return {
                chip: chip,
                inside: false,
                slotId: null
            };

        } catch (err) {
            console.error("Geometry Error:", err.message);
        }
    }

}

// const TagProcessing = async (supabase, tagUpdateBuffer) => {
//     try {
//         console.log(tagUpdateBuffer);


//         let tagUpdateBufferKeys = Array.from(tagUpdateBuffer.keys());

//         let getCarData = {
//             "table": "cars",
//             "select": "*",
//             "searchOnColumn": "chip",
//             "Search": tagUpdateBufferKeys,
//             "type": "in"
//         }


//         const { data: carData, error: carError } = await getData(supabase, getCarData);

//         carData.forEach((e) => {
//             console.log(e.chip);


//         })


//         if (carError) {
//             console.log("error", carError);

//             return carError;
//         }

//         for (const value of carData) {

//             let getfacilityPolygenData = {
//                 "table": "facility_polygons",
//                 "select": "*",
//                 "searchOnColumn": "facility_id",
//                 "Search": value.facilityId,
//                 "type": "eq"
//             }

//             const { data: facilityPolygenData, error: facilityPolygeError } = await getData(supabase, getfacilityPolygenData);

//             if (facilityPolygeError) {
//                 console.error("Database Error:", facilityPolygeError);
//                 return facilityPolygeError;
//             }

//             if (facilityPolygenData && facilityPolygenData.length > 0) {

//                 tagUpdateBuffer.forEach(async (element) => {
//                     // console.log("value data befor passing", element.chip,
//                     //     element.latitude,
//                     //     element.longitude,
//                     //     facilityPolygenData,
//                     //     value.facilityId);

//                     const valueData = checkCarInsideFacility(
//                         element.chip,
//                         element.latitude,
//                         element.longitude,
//                         facilityPolygenData,
//                         value.facilityId
//                     );
//                     // console.log("element", element);


//                     const { data: currentCar, error: currentCarError } = await supabase

//                         .from('cars')
//                         .select('*')
//                         .eq('chip', element.chip)
//                         .single();

//                     console.log(`currentCar `, currentCar.chip,currentCar.prevCpSlot,currentCar.cpSlot);
//                     console.log(`valueData  ${valueData.chip}`, valueData);




//                     if (currentCarError) return;

//                     if (valueData.inside || !valueData.inside) {
//                         if (valueData.inside) {
//                             console.log("=======car is inside slot", valueData.chip);

//                         }
//                         if (!valueData.inside) {
//                             console.log("========chip is outside slot", valueData.chip);

//                         }


//                         let updateValues = {
//                             "table": "cars",
//                             "columnName": "chip",
//                             "ValueMatch": valueData.chip,
//                             "updateValues": {
//                                 "cpSlot": valueData.slotId == null ? 0 : valueData.slotId,
//                                 "prevCpSlot": currentCar.cpSlot == null ? 0 : currentCar.cpSlot,
//                                 "notification_sent_check": false
//                             },

//                         };

//                         const { data: updateValuesData, error: updateDataerror } = await updateData(supabase, updateValues);
//                         // console.log("updateValuesData", updateValuesData);


//                         if (updateDataerror) {
//                             console.error("Update Error:", updateDataerror);

//                         }

//                         // if (updateValuesData &&
//                         //     updateValuesData?.prevCpSlot !== null &&
//                         //     updateValuesData?.prevCpSlot !== updateValuesData?.cpSlot
//                         // ) {
//                         //     console.log(`Car ${updateValuesData.chip} LEFT slot ${updateValuesData.prevCpSlot}`);
//                         //     console.log(supabase, updateValuesData, updateValuesData.prevCpSlot);
//                         //     await sendNotification(supabase, updateValuesData, updateValuesData.prevCpSlot)

//                         // }
//                         if (updateValuesData &&
//                                 updateValuesData[0]?.prevCpSlot !== null &&
//                               updateValuesData[0]?.prevCpSlot !== updateValuesData[0]?.cpSlot
//                         ) {
//                             console.log(`Car ${updateValuesData[0].chip} LEFT slot ${updateValuesData[0].prevCpSlot}`);
//                             // console.log( updateValuesData, updateValuesData[0].prevCpSlot);
//                             const { data,error } = await sendNotification(supabase, updateValuesData, updateValuesData[0].prevCpSlot)
//                             if (error) {
//                                 console.log("error", error);
//                             }
//                             else {
//                                 console.log("notification sent", data);

//                             }

//                         }
//                         else {
//                             console.log("updateValuesData[0].prevCpSlot,updateValuesData[0].cpSlot",updateValuesData[0].prevCpSlot,updateValuesData[0].cpSlot);

//                             console.log("hi from else of updateValuesData ");

//                         }
//                     }
//                 });


//             } else {
//                 console.log("No facility polygons found for this ID.");
//             }
//         }
//     } catch (error) {
//         console.log(error);
//         return error;

//     }

// }

const TagProcessing = async (supabase, tagUpdateBuffer) => {
    const startTime = Date.now();
    try {
        const tagUpdateBufferKeys = Array.from(tagUpdateBuffer.keys());
        console.log(`[STEP 1] Starting processing for ${tagUpdateBufferKeys.length} chips:`, tagUpdateBufferKeys);

        // 1. Fetch current car states from DB
        const { data: carData, error: carError } = await getData(supabase, {
            "table": "cars",
            "select": "*",
            "searchOnColumn": "chip",
            "Search": tagUpdateBufferKeys,
            "type": "in"
        });

        if (carError) {
            console.error("[STEP 1] Error fetching car data:", carError);
            return carError;
        }
        console.log(`[STEP 2] Found ${carData?.length || 0} matching cars in Database.`);

        // 2. Process each chip in the buffer sequentially
        for (const [chipId, element] of tagUpdateBuffer) {
            console.log(`--- Processing Chip: ${chipId} ---`);

            const currentCar = carData.find(c => c.chip == chipId);
            if (!currentCar) {
                console.log(`[SKIP] Chip ${chipId} not found in 'cars' table.`);
                continue;
            }

            // 3. Get Facility Polygons
            console.log(`[STEP 3] Fetching polygons for Facility ID: ${currentCar.facilityId}`);
            const { data: facilityPolygons, error: polyError } = await getData(supabase, {
                "table": "facility_polygons",
                "select": "*",
                "searchOnColumn": "facility_id",
                "Search": currentCar.facilityId,
                "type": "eq"
            });

            if (polyError || !facilityPolygons || facilityPolygons.length === 0) {
                console.log(`[SKIP] No polygons found for facility ${currentCar.facilityId}`);
                continue;
            }

            // 4. Geometry Check
            const valueData = checkCarInsideFacility(
                chipId,
                element.latitude,
                element.longitude,
                facilityPolygons,
                currentCar.facilityId
            );
            console.log(`[STEP 4] Geometry Result for ${chipId}: Inside=${valueData.inside}, SlotID=${valueData.slotId}`);
            console.log("valueData", valueData);

            // 5. Prepare and Run Update
            const newSlot = valueData.slotId || 0;
            const oldSlot = currentCar.cpSlot || 0;

            console.log(`[STEP 5] Database Update: Chip=${chipId} | Moving From=${oldSlot} To=${newSlot}`);

            const updateConfig = {
                "table": "cars",
                "columnName": "chip",
                "ValueMatch": chipId,
                "updateValues": {
                    "cpSlot": newSlot,
                    "prevCpSlot": oldSlot,
                    "notification_sent_check": false
                },
            };

            const { data: updateResult, error: updateError } = await updateData(supabase, updateConfig);

            if (updateError) {
                console.error(`[ERROR] Failed to update chip ${chipId}:`, updateError);
                continue;
            }

            // 6. Notification Logic
            if (updateResult && updateResult.length > 0) {
                const updatedRow = updateResult[0];

                // Logic: Send notification if it was in a slot (not 0) and now the slot is different
                if (updatedRow.prevCpSlot !== 0 && updatedRow.prevCpSlot !== updatedRow.cpSlot) {
                    console.log(`[NOTIFY] Car ${chipId} LEFT slot ${updatedRow.prevCpSlot}. Sending notification...`);

                    const { data: notifData, error: notifError } = await sendNotification(
                        supabase,
                        updatedRow,
                        updatedRow.prevCpSlot
                    );

                    if (notifError) {
                        console.error(`[NOTIFY ERROR] Chip ${chipId}:`, notifError);
                    } else {
                        console.log(`[NOTIFY SUCCESS] Notification sent for ${chipId}:`, notifData);
                    }
                } else {
                    console.log(`[SKIP NOTIFY] No slot change detected for ${chipId} (Stayed in same slot or still outside).`);
                }
            }
        }

        console.log(`[FINISH] Processing completed in ${Date.now() - startTime}ms`);

    } catch (error) {
        console.error("[CRITICAL ERROR] In TagProcessing:", error);
    }
};

export { TagProcessing }