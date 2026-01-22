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
  const {
    polygons,
    savePolygons,
    loading: polygonsLoading,
  } = useFacilityPolygons(id);
  const [isAiDrawing, setIsAiDrawing] = useState(false);
  const [isAiDrawingVertical, setIsAiDrawingVertical] = useState(false);
  const [isRoute,setIsRoute]=useState(false);
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

  const handleRouteClick=()=>{
    console.log("hanle route is clicked");
    router.push(`/admin/facility/route/${id}`);
  }
  // const handleAiClick = async () => {
  //   // 1. Safe access to coordinates
  //   if (!polygonCoordinates || polygonCoordinates.length === 0) {
  //     setSaveMessage("Please draw an area polygon first.");
  //     return;
  //   }

  //   // Target the most recent polygon drawn
  //   const target = Array.isArray(polygonCoordinates[0]?.coordinates)
  //     ? polygonCoordinates[polygonCoordinates.length - 1].coordinates
  //     : Array.isArray(polygonCoordinates[0])
  //     ? polygonCoordinates[0]
  //     : polygonCoordinates;

  //   if (!target || target.length < 4) {
  //     setSaveMessage("Draw a 4-point polygon for AI.");
  //     return;
  //   }

  //   setIsAiDrawing(true);
  //   setSaveMessage("AI Grouping...");

  //   try {
  //     // 2. Build URL with lon,lat (Python API format)
  //     const p = target.slice(0, 4).map((point) => {
  //       const lat = point.lat ?? point.latitude ?? point[0];
  //       const lng = point.lng ?? point.longitude ?? point[1];
  //       return `${lng},${lat}`;
  //     });

  //     const apiUrl = `${process.env.NEXT_PUBLIC_AI_BACKEND_URL}/coordinates?p1=${p[0]}&p2=${p[1]}&p3=${p[2]}&p4=${p[3]}`;

  //     const response = await fetch(apiUrl, {
  //       headers: { "ngrok-skip-browser-warning": "true" },
  //     });
  //     const result = await response.json();

  //     if (result.status === "success" && result.detected_polygons) {
  //       // 3. Transform to Slot-Based Format for the Save function
  //       const aiPolygons = result.detected_polygons.map((poly, index) => ({
  //         slot: index + 1,
  //         coordinates: poly.map((c) => ({ lat: c[1], lng: c[0] })),
  //       }));

  //       // 4. Update state -> This triggers the map Redraw automatically
  //       setPolygonCoordinates(aiPolygons);
  //       setHasUnsavedPolygons(true);
  //       setSaveMessage(
  //         `AI detected ${aiPolygons.length} slots. Ready to save!`
  //       );
  //     } else {
  //       throw new Error(result.error || "AI failed to detect slots");
  //     }
  //   } catch (error) {
  //     console.error("AI Error:", error);
  //     setSaveMessage("AI Error: " + error.message);
  //   } finally {
  //     setIsAiDrawing(false);
  //   }
  // };
  const handleDelete = (type = "all") => {
    setPolygonCoordinates((prev) => {
      let updated;
      if (type === "one") {
        // If there's nothing to delete, just return
        if (!prev || prev.length === 0) return [];
        updated = prev.slice(0, -1);
      } else {
        // Delete All
        updated = [];
      }
  
      // IMPORTANT: Even if the array is empty, if it's different from 
      // what is in the database (savedPolygonCoordinates), we must allow saving!
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(savedPolygonCoordinates);
      setHasUnsavedPolygons(hasChanges);
  
      return updated;
    });
  
    setSaveMessage(type === "one" ? "Removed last" : "Cleared all");
    setTimeout(() => setSaveMessage(""), 2000);
  };

  const handleAiClick = async (pattern) => {
    // 1. Safe access to coordinates
    if (!polygonCoordinates || polygonCoordinates.length === 0) {
      setSaveMessage("Please draw an area polygon first.");
      return;
    }

    // Target the most recent polygon drawn
    const target = Array.isArray(polygonCoordinates[0]?.coordinates)
      ? polygonCoordinates[polygonCoordinates.length - 1].coordinates
      : Array.isArray(polygonCoordinates[0])
      ? polygonCoordinates[0]
      : polygonCoordinates;

    if (!target || target.length < 4) {
      setSaveMessage("Draw a 4-point polygon for AI.");
      return;
    }

    // Set loading state based on pattern type
    if (pattern === "vertical") {
      setIsAiDrawingVertical(true);
    } else {
      setIsAiDrawing(true);
    }

    setSaveMessage(`AI ${pattern === "vertical" ? "Vertical" : "Grouping"}...`);

    try {
      // 2. Build URL with coordinates
      const p = target.slice(0, 4).map((point) => {
        const lat = point.lat ?? point.latitude ?? point[0];
        const lng = point.lng ?? point.longitude ?? point[1];
        return `${lng},${lat}`;
      });

      // Added &pattern= to the URL
      const apiUrl = `${process.env.NEXT_PUBLIC_AI_BACKEND_URL}/coordinates?p1=${p[0]}&p2=${p[1]}&p3=${p[2]}&p4=${p[3]}&pattern=${pattern}`;
      console.log("api",apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "GET", // Be explicit
        mode: "cors", // Force CORS mode
        headers: {
          "ngrok-skip-browser-warning": "true",
          "bypass-tunnel-reminder": "true", // For Cloudflare/Tunnel bypass
          Accept: "application/json",
        },
      });

      // console.log(response);
      
      const result = await response.json();

      if (result.status === "success" && result.detected_polygons_gps) {
        // 3. Transform to Slot-Based Format
        // const aiPolygons = result.detected_polygons.map((poly, index) => ({
        //   slot: index + 1,
        //   coordinates: poly.map((c) => ({ lat: c[1], lng: c[0] })),
        // }));
        const aiPolygons = result.detected_polygons_gps.map((poly, index) => ({
          slot: index + 1,
          // Since your output is [[lat, lng], [lat, lng]...], 
          // point[0] is Latitude and point[1] is Longitude
          coordinates: poly.map((point) => ({ 
            lat: point[0], 
            lng: point[1] 
          })),
        }));

        // 4. Update state
        // setPolygonCoordinates(aiPolygons);
        setPolygonCoordinates((prev) => {
          const currentPolygons = Array.isArray(prev) ? prev : [];

          // This removes the last item (the big guidance box you just drew)
          const previousWithoutGuidanceBox = currentPolygons.slice(0, -1);

          return [...previousWithoutGuidanceBox, ...aiPolygons];
        });
        setHasUnsavedPolygons(true);
        setSaveMessage(`AI detected ${aiPolygons.length} ${pattern} slots!`);
      } else {
        throw new Error(result.error || "AI failed to detect slots");
      }
    } catch (error) {
      console.error("AI Error:", error);
      setSaveMessage("AI Error: " + error.message);
    } finally {
      // Reset both loading states
      setIsAiDrawing(false);
      setIsAiDrawingVertical(false);
    }
  };

  const handlePolygonChange = (newPolygon) => {
    setPolygonCoordinates(newPolygon);
    setSaveMessage(""); // Clear previous messages

    // Check if polygons have changed from saved state
    const hasChanges =
      JSON.stringify(newPolygon) !== JSON.stringify(savedPolygonCoordinates);
    setHasUnsavedPolygons(
      hasChanges &&
        newPolygon &&
        (Array.isArray(newPolygon) ? newPolygon.length > 0 : true)
    );
  };

  const handleSavePolygon = async () => {
    if (
      !polygonCoordinates ||
      (Array.isArray(polygonCoordinates) && polygonCoordinates.length === 0)
    ) {
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

  if (!facility)
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003F65] mx-auto mb-4"></div>
          <p className="text-[#333333] text-lg">Loading...</p>
        </div>
      </div>
    );

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
                <svg
                  className="w-10 h-10 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Unsaved Polygons
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Save your changes before leaving
                </p>
              </div>
            </div>

            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-[#333333] mb-1 font-medium">
                You have marked{" "}
                <span className="font-bold text-red-600">
                  {Array.isArray(polygonCoordinates)
                    ? polygonCoordinates.length
                    : polygonCoordinates
                    ? 1
                    : 0}{" "}
                  polygon
                  {Array.isArray(polygonCoordinates) &&
                  polygonCoordinates.length > 1
                    ? "s"
                    : ""}
                </span>{" "}
                but haven't saved them yet.
              </p>
              <p className="text-gray-600 text-sm">
                If you leave now, your changes will be lost. Do you want to save
                the polygons before leaving?
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelWarning}
                className="px-6 py-2.5 bg-[#F8F8F8] text-[#333333] rounded-lg hover:bg-[#F8F8F8] transition-colors font-medium shadow-sm"
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

      <div className="flex bg-[#F8F8F8]">
        <Sidebar />
        <div className="flex-1 p-4 bg-[#F8F8F8]">
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
                disabled={
                  isSaving || !hasUnsavedPolygons // Only disable if it's currently saving or no changes made
                }
                className={`px-4 py-2 rounded transition-colors font-medium ${
                  hasUnsavedPolygons
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {isSaving
                  ? "Saving..."
                  : hasUnsavedPolygons
                  ? "Save Changes ⚠️"
                  : "Saved"}
              </button>
              <button
                onClick={() => handleAiClick("row")} // Added arrow function
                className={`px-4 py-2 rounded font-medium text-white transition-all ${
                  isAiDrawing ? "bg-red-600 animate-pulse" : "bg-purple-600"
                }`}
              >
                {isAiDrawing ? "Stop" : "AI Grouping"}
              </button>

              <button
                onClick={() => handleDelete("one")}
                className="px-4 py-2 rounded font-medium text-white transition-all bg-orange-500 hover:bg-orange-600"
              >
                Delete Previous
              </button>

              {/* <button
                onClick={() => handleDelete("all")}
                className="px-4 py-2 rounded font-medium text-white transition-all bg-red-600 hover:bg-red-700"
              >
                Delete All
              </button> */}

              {/* Vertical Button */}
              <button
                onClick={() => handleAiClick("vertical")} // Added arrow function
                className={`px-4 py-2 rounded font-medium text-white transition-all ${
                  isAiDrawingVertical
                    ? "bg-red-600 animate-pulse"
                    : "bg-purple-600"
                }`}
              >
                {isAiDrawingVertical ? "Stop" : "AI vertical"}
              </button>


              <button
                onClick={() => handleRouteClick()} // Added arrow function
                className={`px-4 py-2 rounded font-medium text-white transition-all ${
                  isRoute
                    ? "bg-red-600 animate-pulse"
                    : "bg-purple-600"
                }`}
              >
                {isRoute ? "Stop" : "Route"}
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
                <div className="flex items-center justify-center h-full w-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#003F65] mx-auto mb-3"></div>
                    <p className="text-[#333333]">Loading map...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
