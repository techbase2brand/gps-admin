import { point, polygon } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

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
                console.log(`MATCH: Point is inside Slot ${polyObj.slot_number}`);
                return {
                    chip: chip,
                    inside: true,
                    slotNumber: polyObj.slot_number,
                    slotId: polyObj.id
                };
            }
        } catch (err) {
            console.error("Geometry Error:", err.message);
        }
    }
    return {
        chip: chip,
        inside: false,
        slotNumber: polyObj.slot_number,
        slotId: polyObj.id
    };
}

const TagProcessing = async (supabase, tagUpdateBuffer) => {
    try {

        let tagUpdateBufferKeys = Array.from(tagUpdateBuffer.keys());
        let getCarData = {
            "table": "cars",
            "select": "*",
            "searchOnColumn": "chip",
            "Search": tagUpdateBufferKeys,
            "type": "in"
        }
        const { data: carData, error: carError } = await getData(supabase, getCarData);

        if (carError) {
            return carError;
        }

        for (const value of carData) {

            let getfacilityPolygenData = {
                "table": "facility_polygons",
                "select": "*",
                "searchOnColumn": "facility_id",
                "Search": value.facilityId,
                "type": "eq"
            }

            const { data: facilityPolygenData, error: facilityPolygeError } = await getData(supabase, getfacilityPolygenData);

            if (facilityPolygeError) {
                console.error("Database Error:", facilityPolygeError);
                return facilityPolygeError;
            }

            if (facilityPolygenData && facilityPolygenData.length > 0) {

                tagUpdateBuffer.forEach( (element) => {
                    const valueData = checkCarInsideFacility(
                        element.latitude,
                        element.longitude,
                        facilityPolygenData,
                        value.facilityId
                    );

                    const { data: currentCar,error:currentCarError } =  supabase
                        .from('cars')
                        .select('cpSlot, chip')
                        .eq('chip', element.chip)
                        .single();

                    if (currentCarError) return;

                    if (valueData.inside) {

                        let updateValues = {
                            "table": "cars",
                            "columnName": "cpSlot",
                            "ValueMatch": valueData.chip,
                            "updateValues": {
                                "cpSlot": valueData.slotId == null ? 0 : valueData.slotId,
                                "prevCpSlot": currentCar.cpSlot == null ? 0 : currentCar.cpSlot,
                                "notification_sent_check": false
                            },

                        };

                        const { data: updateValuesData, error: updateDataerror } =  updateData(supabase, updateValues);

                        if (updateDataerror) {
                            console.error("Update Error:", updateDataerror);
                           
                        }

                        if (updateValuesData &&
                            updateValuesData.prevCpSlot !== null &&
                            updateValuesData.prevCpSlot !== updateValuesData.cpSlot
                        ) {
                            console.log(`Car ${updateValuesData.chip} LEFT slot ${updateValuesData.prevCpSlot}`);
                            console.log(supabase, updateValuesData, updateValuesData.prevCpSlot);
                            sendNotification(supabase, updateValuesData, updateValuesData.prevCpSlot)

                        }
                    }
                });


            } else {
                console.log("No facility polygons found for this ID.");
            }
        }
    } catch (error) {
        console.log(error);
        return error;

    }

}

export { TagProcessing }