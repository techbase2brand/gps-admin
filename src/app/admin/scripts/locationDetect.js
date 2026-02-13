import client from "@/app/api/client";

export default async function getData() {
  const { data, error } = await client
    .from("facility_polygons")
    .select("coordinates");

  const { data: carData, error: carError } = await client
    .from("cars")
    .select("coordinates");

  if (error) console.error("facility error: ", error);
  if (carError) console.error("cars error: ", carError);

  if (data?.length > 0) {
    console.log("facility data is:", data);
  }

  if (carData?.length > 0) {
    console.log("car data is:", carData);
  }

  return { data, carData };
}
