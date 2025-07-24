// "use client";

// import { useParams } from "next/navigation";
// import { useEffect, useState } from "react";
// import GoogleMapReact from "google-map-react";
// import useCRUD from "../../../../hooks/useCRUD";
// import Sidebar from "../../../../components/Layout/Sidebar";
// import Image from "next/image";

// export default function ViewFacilityPage() {
//   const { id } = useParams();
//   const { data } = useCRUD("/api/facilities");
//   const [facility, setFacility] = useState(null);
//   const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

//   useEffect(() => {
//     const found = data.find((item) => String(item?.id) === id);
//     setFacility(found);

//     if (found?.address) {
//       geocodeAddress(found?.address);
//     }
//   }, [data, id,coordinates]);

//   useEffect(() => {
//     if (facility?.address) {
//       geocodeAddress(facility.address);
//     }
//   }, [facility]);

//   const geocodeAddress = async (address) => {
//     try {
//       const response = await fetch(
//         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
//           address
//         )}&key=${process.env.NEXT_PUBLIC_API_KEY}`
//       );
//       const json = await response.json();
//       if (json.results[0]) {
//         const location = json.results[0].geometry.location;
//         setCoordinates({ lat: location.lat, lng: location.lng });
//       } else {
//         console.error("No results found");
//       }
//     } catch (error) {
//       console.error("Geocode error:", error);
//     }
//   };
//   if (!facility) return <p>Loading...</p>;
//   const Marker = ({ text, address }) => (
//     <div className="relative flex flex-col items-center">
//       <Image src="/pin.svg" alt="Pin" width={40} height={40} />
//       <div className="absolute bottom-full mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-90 whitespace-nowrap">
//         {address}
//       </div>
//     </div>
//   );
//   return (
//     <main>
//       <div className="flex bg-[#f7f8fb]">
//         <Sidebar />
//         <div className="flex-1 p-4">
//           <h1 className="text-2xl font-bold mb-4 text-black">
//             {facility.name}
//           </h1>
//           <div style={{ height: "80vh", width: "100%" }}>
//             {!facility || !coordinates.lat || !coordinates.lng ? (
//               <p>Loading...</p>
//             ) : (
//               <GoogleMapReact
//                 bootstrapURLKeys={{
//                   key: process.env.NEXT_PUBLIC_API_KEY,
//                 }}
//                 center={coordinates}
//                 zoom={15}
//               >
//                 <Marker
//                   lat={coordinates.lat}
//                   lng={coordinates.lng}
//                   text={facility.number}
//                   address={facility.address}
//                 />
//               </GoogleMapReact>
//             )}
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

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

// const borderCoordinates = [
//   { lat: 30.710833800037605, lng: 76.69063444004115 },
//   { lat: 30.711845526500284, lng: 76.69225249404184 },
//   { lat:  30.711383927617547, lng: 76.69264965275153 },
//   { lat:  30.710701010151155, lng: 76.69170823951532 },
//   { lat:  30.71035954960432, lng: 76.69100217958652 },
//   { lat:  30.710814830065118, lng: 76.69064914962229 },

// ];

export default function ViewFacilityPage() {
  const { id } = useParams();
  const { data } = useCRUD("facility");
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
    const found = data?.find((item) => String(item?.id) === id);
    setFacility(found);

    if (found?.address) {
      geocodeAddress(found?.address);
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

  if (!isLoaded || !facility) return <p>Loading...</p>;

  return (
    <main>
      <div className="flex bg-gray-200">
        <Sidebar />
        <div className="flex-1 p-4 bg-gray-200">
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
