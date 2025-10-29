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
import { capitalizeFirstLetter, capitalizeWords } from "../../../../utils/textUtils";
import useFetchVehicleLocation from "../../../../hooks/useFetchVehicleLocation";

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

export default function ViewCarPage() {
  const { id } = useParams();
  const { data } = useCRUD("facility");
  const { carData, updateItem } = useCarsCRUD("cars");

  const [car, setCar] = useState(null);
  const [facility, setFacility] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [chipInput, setChipInput] = useState("");
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_API_KEY,
  });
  const { initializeMqtt, disconnect, loading: mqttLoading, error: mqttError, mqttConnected } = useFetchVehicleLocation();
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
      const foundCar = carData.find((c) => String(c.id) === id);
      if (foundCar) {
        setCar(foundCar);
        const matchingFacility = data.find(
          (facility) => facility.id.toString() === foundCar.facilityId?.toString()
        );
        if (matchingFacility) {
          setFacility(matchingFacility);
        }
      }
    }
  }, [carData, data, id]);

  useEffect(() => {
    // Use vehicle location from database (latitude, longitude fields)
    if (car?.latitude && car?.longitude) {
      setCoordinates({ lat: parseFloat(car.latitude), lng: parseFloat(car.longitude) });
      setShowTooltip(true);
    } else if (facility?.address) {
      setShowTooltip(true);
      geocodeAddress(facility.address);
    }
  }, [car, facility]);

  // If no coords but chip exists, initialize MQTT like mobile app
  useEffect(() => {
    if (!car) return;
    const hasCoords = Boolean(car?.latitude && car?.longitude);

    if (!hasCoords && car?.chip) {
      console.log('📍 [ViewCar] No coords found, initializing MQTT for chip:', car.chip);

      const onLocationUpdate = (location) => {
        console.log('📍 [ViewCar] Location update received:', location);
        setCar((prev) => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude
        }));
        setCoordinates({ lat: location.latitude, lng: location.longitude });
        setShowTooltip(true);
      };

      initializeMqtt(car.chip, onLocationUpdate);
    }

    // Cleanup on unmount or when chip changes
    return () => {
      if (car?.chip) {
        disconnect();
      }
    };
  }, [car?.chip]); // Only depend on chip, not the functions

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

  const handleAssignChip = () => {
    setChipInput("");
    setShowAssignModal(true);
  };

  const handleSubmitAssignChip = async () => {
    if (!chipInput.trim() || !car?.id) return;
    try {
      const updated = await updateItem({ id: car.id, ...car, chip: chipInput.trim() });
      // Optimistically update local page state
      setCar((prev) => ({ ...prev, chip: chipInput.trim(), status: "Assigned" }));
      setShowAssignModal(false);
    } catch (e) {
      console.error("Failed to assign chip", e);
    }
  };

  if (!isLoaded || !car) return <p>Loading...</p>;

  return (
    <main>
      <div className="flex bg-[#f7f8fb]">
        <Sidebar />
        <div className="flex-1 p-4 bg-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-black">
            Vehicle Details - {car.vin}
          </h1>

          {/* Half screen layout */}
          <div className="grid grid-cols-2 gap-4 h-[80vh]">
            {/* Left side - Map */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-black">Vehicle Location</h2>

              {/* Chip Assignment Warning Note */}
              {!car?.chip && (
                <div className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-orange-800">Chip Not Assigned</p>
                        <p className="text-xs text-orange-600">Please assign a chip to view vehicle location</p>
                      </div>
                    </div>
                    <button
                      onClick={handleAssignChip}
                      className="px-3 py-1 text-sm rounded bg-orange-600 text-white hover:bg-orange-700"
                    >
                      Assign Chip
                    </button>
                  </div>
                </div>
              )}

              <div style={{ height: "calc(100% - 3rem)" }}>
                <GoogleMap
                  mapContainerStyle={{ height: "100%", width: "100%" }}
                  center={coordinates}
                  zoom={15}
                >
                  {car?.latitude && car?.longitude && (
                    <Marker
                      position={coordinates}
                      title="Vehicle Location"
                      onClick={() => setShowTooltip(true)}
                    />
                  )}
                  {showTooltip && car?.latitude && car?.longitude && (
                    <InfoWindow
                      position={coordinates}
                      onCloseClick={() => setShowTooltip(false)}
                    >
                      <div style={{ fontSize: "16px", padding: "2px", color: "black" }}>
                        <span>Vehicle: {car?.vin}</span>
                        <br />
                        {/* {car?.latitude && car?.longitude ? "Current Location" : facility?.address} */}
                        {/* {car?.latitude && car?.longitude ? `Latitude: ${car?.latitude}, Longitude: ${car?.longitude}` : "No location data"} */}
                        {car.chip ? `Chip: ${car.chip}` : "No chip assigned"}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
            </div>

            {/* Assign Chip Modal */}
            {showAssignModal && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black">Assign Chip</h3>
                    <button
                      onClick={() => setShowAssignModal(false)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Vehicle VIN</label>
                      <div className="border rounded px-3 py-2 bg-gray-50 text-black">{car?.vin}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Make</label>
                        <div className="border rounded px-3 py-2 bg-gray-50 text-black">{car?.make ? capitalizeWords(car.make) : "-"}</div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Model</label>
                        <div className="border rounded px-3 py-2 bg-gray-50 text-black">{car?.model ? capitalizeWords(car.model) : "-"}</div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Chip ID</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 text-black"
                        placeholder="Enter Chip ID"
                        value={chipInput}
                        onChange={(e) => setChipInput(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitAssignChip}
                      className="px-4 py-2 rounded bg-[#613EEA] text-white hover:opacity-90"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Right side - Vehicle Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-6 text-black border-b pb-3">Vehicle Information</h2>
              <div className="space-y-6">
                {/* Primary Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded p-3 shadow-sm">
                      <label className="block text-sm font-medium text-gray-600 mb-1">VIN Number</label>
                      <p className="text-lg text-black font-bold">{car.vin}</p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Chip ID</label>
                      <p className="text-lg text-black font-semibold">
                        {car.chip || <span className="text-gray-500 italic">Not Assigned</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Specs */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded p-3 shadow-sm">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Make</label>
                      <p className="text-lg text-black">{car.make ? capitalizeWords(car.make) : <span className="text-gray-500 italic">N/A</span>}</p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
                      <p className="text-lg text-black">{car.model ? capitalizeWords(car.model) : <span className="text-gray-500 italic">N/A</span>}</p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Color</label>
                      <p className="text-lg text-black">{car.color ? capitalizeFirstLetter(car.color) : <span className="text-gray-500 italic">N/A</span>}</p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                      <div className="mt-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${car.status === "Assigned"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                          }`}>
                          {car.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Details</h3>
                  <div className="bg-white rounded p-4 shadow-sm">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Assigned Yard</label>
                    <div className="space-y-2">
                      <p className="text-lg text-black font-semibold">
                        {facility?.name || <span className="text-gray-500 italic">Not Assigned</span>}
                      </p>
                      {facility?.address && (
                        <div className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-sm text-gray-600">{facility.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
