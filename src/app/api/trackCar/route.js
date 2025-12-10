import { NextResponse } from "next/server";
import client from "../client";


export async function GET() {
  const { data, error } = await client
    .from("facility_polygons")
    .select("facility_id, slot_number, coordinates")
    .order("facility_id", { ascending: true })
    .order("slot_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by facility_id
  const grouped = Object.values(
    data.reduce((acc, row) => {
      if (!acc[row.facility_id]) {
        acc[row.facility_id] = {
          facility_id: row.facility_id,
          slots: []
        };
      }
      acc[row.facility_id].slots.push({
        slot_number: row.slot_number,
        coordinates: row.coordinates,
      });
      return acc;
    }, {})
  );

  return NextResponse.json(grouped);
}




