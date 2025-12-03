import { NextResponse } from 'next/server';
// Import necessary Turf functions
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";

// 🔑 Parking slot coordinates in [longitude, latitude] format
const PARKING_SLOT_COORDINATES = [
  [ -86.49331480264665, 35.97025559961646],
  [ -86.49332016706468, 35.97020890413792 ],
  [ -86.49175509810448, 35.97003623922167 ],
  [ -86.49174571037292, 35.97008184885889 ]
];

// Complete the polygon by connecting the last coordinate back to the first one.
const PARKING_SLOT_POLYGON = polygon([[...PARKING_SLOT_COORDINATES, PARKING_SLOT_COORDINATES[0]]]);


/**
 * GET handler: /api/location-check?chipId=X&llat=Y&llon=Z
 * This function checks if the car's location is inside the defined parking slot polygon.
 */
export async function GET(request) {
  // 1. Read Query Parameters
  const { searchParams } = new URL(request.url);
  const chipId = searchParams.get('chipId');
  const llat = searchParams.get('llat');
  const llon = searchParams.get('llon');

  // 2. Data Validation
  if (!llat || !llon) {
    return NextResponse.json(
      { success: false, message: 'Missing llat (latitude) or llon (longitude) parameters.' },
      { status: 400 }
    );
  }

  const latitude = parseFloat(llat);
  const longitude = parseFloat(llon);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { success: false, message: 'Invalid latitude or longitude value.' },
      { status: 400 }
    );
  }

  // 3. Create Turf Point
  // Turf/GeoJSON format expects: [longitude, latitude]
  const carPoint = point([longitude, latitude]);

  // 4. Perform Point-in-Polygon check
  const isInside = booleanPointInPolygon(carPoint, PARKING_SLOT_POLYGON);

  // 5. Return the result
  const resultMessage = isInside
    ? "Car is INSIDE the designated parking slot."
    : "Car is OUTSIDE the designated parking slot.";

  // Log the check result
  console.log(`[${chipId || 'N/A'}] Location check (Lat: ${latitude}, Lon: ${longitude}): ${resultMessage}`);
  
  return NextResponse.json({
    success: true,
    chipId: chipId || 'N/A',
    latitude: latitude,
    longitude: longitude,
    isInsideParkingSlot: isInside,
    message: resultMessage,
  });
}