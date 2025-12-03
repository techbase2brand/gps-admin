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

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import useCRUD from "../../../../hooks/useCRUD";
import useFacilityPolygons from "../../../../hooks/useFacilityPolygons";
import Sidebar from "../../../../components/Layout/Sidebar";

// Dynamically import Leaflet component to avoid SSR issues
const FacilityMapWithDrawing = dynamic(
  () => import("../../../../components/FacilityMapWithDrawing"),
  { ssr: false }
);

export default function ViewFacilityPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data } = useCRUD("facility");
  const { polygons, savePolygons, loading: polygonsLoading } = useFacilityPolygons(id);
  const [facility, setFacility] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [polygonCoordinates, setPolygonCoordinates] = useState(null);
  const [savedPolygonCoordinates, setSavedPolygonCoordinates] = useState(null); // Track saved state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [hasUnsavedPolygons, setHasUnsavedPolygons] = useState(false);
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  useEffect(() => {
    const found = data?.find((item) => String(item?.id) === id);
    setFacility(found);

    if (found?.address) {
      geocodeAddress(found?.address);
    }
  }, [data, id]);

  // Load polygons from new table
  useEffect(() => {
    if (polygons && polygons.length > 0) {
      setPolygonCoordinates(polygons);
      setSavedPolygonCoordinates(polygons);
      setHasUnsavedPolygons(false);
    } else {
      setPolygonCoordinates(null);
      setSavedPolygonCoordinates(null);
      setHasUnsavedPolygons(false);
    }
  }, [polygons]);

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

  const handlePolygonChange = (newPolygon) => {
    setPolygonCoordinates(newPolygon);
    setSaveMessage(""); // Clear previous messages
    
    // Check if polygons have changed from saved state
    const hasChanges = JSON.stringify(newPolygon) !== JSON.stringify(savedPolygonCoordinates);
    setHasUnsavedPolygons(hasChanges && newPolygon && (
      Array.isArray(newPolygon) ? newPolygon.length > 0 : true
    ));
  };

  const handleSavePolygon = async () => {
    if (!polygonCoordinates || (Array.isArray(polygonCoordinates) && polygonCoordinates.length === 0)) {
      setSaveMessage("No polygon to save. Please draw a polygon first.");
      return;
    }

    setIsSaving(true);
    setSaveMessage("");

    try {
      // Save to new facility_polygons table
      await savePolygons(polygonCoordinates);
      setSaveMessage("Polygons saved successfully!");
      setSavedPolygonCoordinates(polygonCoordinates); // Update saved state
      setHasUnsavedPolygons(false); // Mark as saved
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving polygons:", error);
      setSaveMessage("Failed to save polygons. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle browser close/refresh warning with custom modal
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedPolygons) {
        // Show custom modal instead of browser alert
        e.preventDefault();
        setShowSaveWarning(true);
        // Store that this is a browser navigation attempt
        setPendingNavigation("browser_close");
        // Prevent default browser alert
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedPolygons]);

  // Handle browser back button with custom modal
  useEffect(() => {
    if (!hasUnsavedPolygons) return;

    const handlePopState = (e) => {
      if (hasUnsavedPolygons) {
        // Prevent back navigation
        window.history.pushState(null, "", window.location.href);
        // Show custom modal
        setShowSaveWarning(true);
        setPendingNavigation("browser_back");
      }
    };

    // Push state to track back button
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedPolygons]);

  // Handle save and leave
  const handleSaveAndLeave = async () => {
    await handleSavePolygon();
    setShowSaveWarning(false);
    const navType = pendingNavigation;
    setPendingNavigation(null);
    
    // If it was browser back, navigate back after save
    if (navType === "browser_back") {
      window.history.back();
    }
    // If it was browser close, allow it after save
    if (navType === "browser_close") {
      // Browser will handle the close after we return
      return;
    }
  };

  // Handle leave without saving
  const handleLeaveWithoutSave = () => {
    setHasUnsavedPolygons(false);
    setShowSaveWarning(false);
    const navType = pendingNavigation;
    setPendingNavigation(null);
    
    // Navigate to facility page
    router.push("/admin/facility");
  };

  // Cancel warning
  const handleCancelWarning = () => {
    setShowSaveWarning(false);
    setPendingNavigation(null);
  };

  if (!facility) return <p>Loading...</p>;

  return (
    <main>
      {/* Custom Unsaved Polygons Warning Modal */}
      {showSaveWarning && (
        <div 
          className="fixed inset-0 z-[10000] bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm"
          onClick={handleCancelWarning}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-lg w-[90%] shadow-2xl border-2 border-yellow-300 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-yellow-100 rounded-full p-4 flex-shrink-0">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Unsaved Polygons</h3>
                <p className="text-sm text-gray-500 mt-1">Save your changes before leaving</p>
              </div>
            </div>
            
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-gray-700 mb-1 font-medium">
                You have marked <span className="font-bold text-red-600">{Array.isArray(polygonCoordinates) ? polygonCoordinates.length : (polygonCoordinates ? 1 : 0)} polygon{Array.isArray(polygonCoordinates) && polygonCoordinates.length > 1 ? 's' : ''}</span> but haven't saved them yet.
              </p>
              <p className="text-gray-600 text-sm">
                If you leave now, your changes will be lost. Do you want to save the polygons before leaving?
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelWarning}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveWithoutSave}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Leave without saving
              </button>
              <button
                onClick={handleSaveAndLeave}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex bg-gray-200">
        <Sidebar />
        <div className="flex-1 p-4 bg-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-black">{facility.name}</h1>
            <div className="flex items-center gap-3">
              {hasUnsavedPolygons && (
                <span className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded border border-yellow-300">
                  ⚠️ Unsaved polygons
                </span>
              )}
              {saveMessage && (
                <span
                  className={`text-sm px-3 py-1 rounded ${
                    saveMessage.includes("success")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {saveMessage}
                </span>
              )}
              <button
                onClick={handleSavePolygon}
                disabled={isSaving || !polygonCoordinates || (Array.isArray(polygonCoordinates) && polygonCoordinates.length === 0)}
                className={`px-4 py-2 rounded transition-colors font-medium ${
                  hasUnsavedPolygons
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {isSaving ? "Saving..." : hasUnsavedPolygons ? "Save Polygons ⚠️" : "Save Polygon"}
              </button>
            </div>
          </div>
          <div style={{ height: "80vh", width: "100%" }}>
            {coordinates.lat && coordinates.lng ? (
              <FacilityMapWithDrawing
                center={coordinates}
                zoom={18}
                facilityAddress={facility.address}
                existingPolygon={polygonCoordinates}
                onPolygonChange={handlePolygonChange}
                showControls={true}
                allowMultiple={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Loading map...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
