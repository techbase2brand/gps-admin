"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import useCRUD from "../../../../hooks/useCRUD";
import Sidebar from "../../../../components/Layout/Sidebar";
// Routing Map Component 
const RouteMapComponent = dynamic(
  () => import("../../../../components/RouteMapComponent"),
  { ssr: false }
);

export default function CreateRoutePage() {
  const { id } = useParams();
  const { data } = useCRUD("facility");
  const [facility, setFacility] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    const found = data?.find((item) => String(item?.id) === id);
    setFacility(found);
    if (found?.address) {
      geocodeAddress(found.address);
    }
  }, [data, id]);

  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_API_KEY}`
      );
      const json = await response.json();
      if (json.results[0]) {
        const location = json.results[0].geometry.location;
        // console.log("location",location);
        
        setCoordinates({ lat: location.lat, lng: location.lng });
      }
    } catch (error) { console.error("Geocode error:", error); }
  };
  // console.log("coordinates",coordinates);
  if (!facility) return <div className="p-10 text-center">Loading Facility Data...</div>;

  return (
    <main className="flex bg-[#F8F8F8]">
      <div>

      <Sidebar /> 
      </div>
      <div className="flex-1 p-4 bg-[#F8F8F8] h-[87%]!">
        {/* <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-black">{facility.name} - Route Mapping</h1>
        </div> */}
        
        <div className=" " style={{ height: "100%", width: "100%" }}>
          {coordinates.lat !== 0 && (
            <RouteMapComponent center={coordinates} facilityId={id} />
          )}
        </div>
      </div>
    </main>
  );
}