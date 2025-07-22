"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polygon,
  useLoadScript,
} from "@react-google-maps/api";
import useCRUD from "../../../../hooks/useCRUD";
import Sidebar from "../../../../components/Layout/Sidebar";
import useCarsCRUD from "../../../../hooks/useCarsCRUD";

const borderCoordinates = [
  { lat: 30.711434513935473, lng: 76.69281881288748 },
  { lat: 30.711061439447136, lng: 76.693120359315 },
  { lat: 30.70958809725289, lng: 76.69090656730441 },
  { lat: 30.70915810473933, lng: 76.69000928281343 },
  { lat: 30.70944898223773, lng: 76.68975921992285 },
  { lat: 30.710542926715164, lng: 76.69148024099525 },
  { lat: 30.71141554405, lng: 76.69281145815148 },
  { lat: 30.70958809725289, lng: 76.69090656730441 },
  { lat: 30.70915810473933, lng: 76.69000928281343 },
  { lat: 30.70944898223773, lng: 76.68975921992285 },
  { lat: 30.710542926715164, lng: 76.69148024099525 },
  { lat: 30.71141554405, lng: 76.69281145815148 },
];

export default function ViewFacilityPage() {
  const { id } = useParams();
  const { data } = useCRUD("facility");
  const { carData } = useCarsCRUD("cars");

  const [facility, setFacility] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_API_KEY,
  });
  const polygonOptions = {
    fillColor: "transparent", // or rgba with opacity if needed
    fillOpacity: 0.1,
    strokeColor: "#FF5E62",
    strokeOpacity: 1,
    strokeWeight: 2,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 1,
  };


useEffect(() => {
  if (carData && data && id) {
    const car = carData.find((c) => String(c.id) === id);
    if (car) {
      const matchingFacility = data.find(
        (facility) => facility.name === car.facilityId
      );
      if (matchingFacility) {
        setFacility(matchingFacility);
      }
    }
  }
}, [carData, data, id]);

  useEffect(() => {
    if (facility?.address) {
      setShowTooltip(true)
      geocodeAddress(facility.address);
    }
  }, [facility]);


  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${process.env.NEXT_PUBLIC_API_KEY}`
      );
      const json = await response.json();
      if (json.results[0]) {
        const location = json.results[0].geometry.location;
        setCoordinates({ lat: location.lat, lng: location.lng });
      } else {
        console.error("No results found");
      }
    } catch (error) {
      console.error("Geocode error:", error);
    }
  };

  if (!isLoaded || !facility) return <p>Loading...</p>;

  return (
    <main>
      <div className="flex bg-[#f7f8fb]">
        <Sidebar />
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold mb-4 text-black">
            {facility.name}
          </h1>
          <div style={{ height: "80vh", width: "100%" }}>
            <GoogleMap
              mapContainerStyle={{ height: "100%", width: "100%" }}
              center={coordinates}
              zoom={15}
            >
              <Marker
                position={coordinates}
                title={facility.address}
                // label={facility.address ? String(facility.address) : ""}
                onClick={() => setShowTooltip(true)}
              />
              {showTooltip && (
                <InfoWindow
                  position={coordinates}
                  onCloseClick={() => setShowTooltip(false)}
                  style={{ position: "absolute", bottom: "500px" }}
                >
                  <div
                    style={{ fontSize: "16px", padding: "2px", color: "black" }}
                  >
                    <span>Facility Name: {facility?.name}</span><br/>
                    {facility?.address}
                  </div>
                </InfoWindow>
              )}
              <Polygon paths={borderCoordinates} options={polygonOptions} />
            </GoogleMap>
          </div>
        </div>
      </div>
    </main>
  );
}
