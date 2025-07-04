"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import GoogleMapReact from "google-map-react";
import useCRUD from "../../../../hooks/useCRUD";
import Sidebar from "../../../../components/Layout/Sidebar";
import Image from "next/image";

export default function ViewFacilityPage() {
  const { id } = useParams();
  const { data } = useCRUD("/api/facilities");
  const [facility, setFacility] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  const Marker = ({ text, address }) => (
    <div className="relative flex flex-col items-center">
      <div className="absolute bottom-full mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-90 whitespace-nowrap">
        {address}
      </div>
    </div>
  );
  useEffect(() => {
    const found = data.find((item) => String(item.id) === id);
    setFacility(found);

    if (found?.address) {
      geocodeAddress(found.address);
    }
  }, [data, id]);

  useEffect(() => {
    if (facility?.address) {
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
  if (!facility) return <p>Loading...</p>;

  return (
    <main>
      <div className="flex bg-[#f7f8fb]">
        <Sidebar />
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold mb-4 text-black">
            {facility.name}
          </h1>
          <div style={{ height: "80vh", width: "100%" }}>
            {!facility || !coordinates.lat || !coordinates.lng ? (
              <p>Loading...</p>
            ) : (
              <GoogleMapReact
                bootstrapURLKeys={{
                  key: process.env.NEXT_PUBLIC_API_KEY,
                }}
                center={coordinates}
                zoom={15}
              >
                <Image src="/pin.svg" alt="Pin" width={40} height={40} />
                <Marker
                  lat={coordinates.lat}
                  lng={coordinates.lng}
                  text={facility.number}
                  address={facility.address}
                />
              </GoogleMapReact>
            )}
            {/* <GoogleMapReact
              bootstrapURLKeys={{
                key: "AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI",
              }}
              defaultCenter={coordinates}
              center={coordinates}
              defaultZoom={15}
            >
              <Marker
                lat={coordinates.lat}
                lng={coordinates.lng}
                text={facility.number}
                address={facility.address}
              />
            </GoogleMapReact> */}
          </div>
        </div>
      </div>
    </main>
  );
}
