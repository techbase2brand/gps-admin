"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import FacilityMapWithDrawing from "./FacilityMapWithDrawing";

// Dynamically import to avoid SSR issues
const MapComponent = dynamic(
  () => Promise.resolve(FacilityMapWithDrawing),
  { ssr: false }
);

export default function FacilityMapModal({
  address,
  isOpen,
  onClose,
  onSave,
  existingPolygons = null,
}) {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [polygons, setPolygons] = useState(existingPolygons || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (address && isOpen) {
      geocodeAddress(address);
    }
  }, [address, isOpen]);

  const geocodeAddress = async (addr) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          addr
        )}&key=${process.env.NEXT_PUBLIC_API_KEY}`
      );
      const json = await response.json();
      if (json.results[0]) {
        const location = json.results[0].geometry.location;
        setCoordinates({ lat: location.lat, lng: location.lng });
      } else {
        alert("Address not found. Please check the address.");
      }
    } catch (error) {
      console.error("Geocode error:", error);
      alert("Error geocoding address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePolygonChange = (newPolygons) => {
    setPolygons(newPolygons || []);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(polygons);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Mark Polygons on Map</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading map...</p>
            </div>
          ) : coordinates.lat && coordinates.lng ? (
            <MapComponent
              center={coordinates}
              zoom={18}
              facilityAddress={address}
              existingPolygon={null}
              onPolygonChange={handlePolygonChange}
              showControls={true}
              allowMultiple={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Enter address to load map</p>
            </div>
          )}
        </div>

        {/* Footer with buttons */}
        <div className="p-4 border-t flex justify-between gap-4 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {polygons.length > 0 && (
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded flex items-center">
                {polygons.length} polygon{polygons.length > 1 ? "s" : ""} marked
              </span>
            )}
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#613EEA] text-white rounded hover:bg-[#613EEA]"
            >
              {polygons.length > 0 ? "Save Polygons" : "Continue Without Polygons"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

