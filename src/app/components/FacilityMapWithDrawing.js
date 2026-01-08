"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import "leaflet-measure/dist/leaflet-measure.css";
import "leaflet-fullscreen";
import "leaflet-measure/dist/leaflet-measure";
import { googleToLeaflet, leafletToGoogle, toGeoJSON, toSimpleJSON } from "../utils/coordinateUtils";

// Round to 6 decimal places helper
function roundTo6Decimals(num) {
  return Math.round(num * 1000000) / 1000000;
}

// Fix for default marker icon in Leaflet with Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to add map controls (Fullscreen, Measure, Custom Shape Creator)
function MapControls({ mapCenter, onShapeCreated }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Add Fullscreen control (top-left)
    const fullscreenControl = L.control.fullscreen({
      position: "topleft",
    });
    fullscreenControl.addTo(map);

    // Add Measure control
    const measureControl = new L.Control.Measure({
      position: "topleft",
      primaryLengthUnit: "meters",
      secondaryLengthUnit: "feet",
      primaryAreaUnit: "sqmeters",
      secondaryAreaUnit: "acres",
    });
    measureControl.addTo(map);

    // Custom shape creator function
    window.createRegularPolygon = function (lat, lon, sides, radius, name) {
      const points = [];
      const angleStep = (2 * Math.PI) / sides;
      for (let i = 0; i < sides; i++) {
        const angle = i * angleStep;
        const dx = (radius / 111320) * Math.cos(angle);
        const dy = (radius / 110540) * Math.sin(angle);
        points.push([lat + dy, lon + dx]);
      }
      const polygon = L.polygon(points, {
        color: "orange",
        fillColor: "orange",
        fillOpacity: 0.4,
      });
      polygon.bindPopup(name || `Polygon ${sides} sides`);
      polygon.addTo(map);
      
      // Convert to coordinates and notify parent
      const coordinates = points.map((p) => [p[0], p[1]]);
      if (onShapeCreated) {
        onShapeCreated(coordinates);
      }
    };

    // Cleanup
    return () => {
      map.removeControl(fullscreenControl);
      map.removeControl(measureControl);
      delete window.createRegularPolygon;
    };
  }, [map, mapCenter, onShapeCreated]);

  return null;
}

// Component to handle drawing controls
function DrawingControls({ onPolygonCreated, onPolygonEdited, onPolygonDeleted, existingPolygon, allowMultiple,setAllPolygons,onPolygonChange }) {
  const map = useMap();
  const featureGroupRef = useRef(L.featureGroup());
  const drawControlRef = useRef(null);
  const polygonLayersRef = useRef([]);

  // --- 1. SYNC BLOCK (Atomic Redraw) ---
  useEffect(() => {
    if (!map) return;
    if (!map.hasLayer(featureGroupRef.current)) featureGroupRef.current.addTo(map);

    // Physical wipe taaki ghosting na hovey
    featureGroupRef.current.clearLayers();
    polygonLayersRef.current = [];

    if (existingPolygon && Array.isArray(existingPolygon) && existingPolygon.length > 0) {
      try {
        // Slot-based format handling
        if (existingPolygon[0]?.slot !== undefined) {
          existingPolygon.forEach((polyData) => {
            if (polyData.coordinates) {
              const leafletCoords = polyData.coordinates.map(coord => [
                coord.lat ?? coord.latitude, 
                coord.lng ?? coord.longitude
              ]);
              const polygon = L.polygon(leafletCoords, {
                color: "#FF5E62", fillColor: "#FF5E62", fillOpacity: 0.1, weight: 3,
              }).addTo(featureGroupRef.current);
              polygonLayersRef.current.push(polygon);
            }
          });
        } 
        // Array format handling
        else {
          const normalized = Array.isArray(existingPolygon[0]) && typeof existingPolygon[0][0] === 'number' 
            ? [existingPolygon] : existingPolygon;

          normalized.forEach((polyCoords) => {
            const polygon = L.polygon(polyCoords, {
              color: "#FF5E62", fillColor: "#FF5E62", fillOpacity: 0.1, weight: 3,
            }).addTo(featureGroupRef.current);
            polygonLayersRef.current.push(polygon);
          });
        }
      } catch (err) { console.error("Sync error:", err); }
    }
  }, [existingPolygon, map]);

  // --- 2. TOOLBAR & CUSTOM MARKERS ---
  useEffect(() => {
    if (!map) return;

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: "#FF5E62", fillColor: "#FF5E62", fillOpacity: 0.1, weight: 3 },
          showArea: false, metric: false,
        },
        polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false
      },
      edit: { featureGroup: featureGroupRef.current, remove: true }
    });

    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    const customizeMarkers = () => {
      document.querySelectorAll('.leaflet-draw-tooltip-marker').forEach((marker, index) => {
        const color = index % 2 === 0 ? '#3B82F6' : '#10B981';
        Object.assign(marker.style, {
          width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color,
          border: '2px solid white', boxShadow: `0 0 0 2px ${color}`, marginLeft: '-5px', marginTop: '-5px'
        });
      });
    };

    // --- 3. EVENT HANDLERS (THE FIX) ---
    map.on(L.Draw.Event.CREATED, (e) => {
      const { layer } = e;
      
      // GHOST KILLER: Remove Leaflet's internal layer immediately
      // React will redraw it from state in "Red" color
      map.removeLayer(layer); 

      const latlngs = layer.getLatLngs()[0];
      const coordinates = latlngs.map(ll => [ll.lat, ll.lng]);
      if (onPolygonCreated) onPolygonCreated(coordinates);
    });

    map.on(L.Draw.Event.DRAWSTART, () => {
      setTimeout(() => {
        customizeMarkers();
        document.querySelectorAll('.leaflet-draw-guide-dash').forEach(l => l.style.display = 'none');
      }, 100);
    });

    map.on(L.Draw.Event.DRAWVERTEX, () => setTimeout(customizeMarkers, 50));

    map.on(L.Draw.Event.EDITED, (e) => {
      const layers = e.layers;
      
      // Create a deep copy of current polygons to avoid mutating state directly
      setAllPolygons((prevPolygons) => {
        const nextPolygons = [...prevPolygons];
    
        layers.eachLayer((layer) => {
          // 1. Find the index of the polygon that was just dragged
          const index = polygonLayersRef.current.indexOf(layer);
    
          if (index !== -1) {
            // 2. Extract the NEW coordinates from the Leaflet layer
            const latlngs = layer.getLatLngs()[0];
            const newCoordinates = latlngs.map((ll) => ({
              lat: roundTo6Decimals(ll.lat),
              lng: roundTo6Decimals(ll.lng)
            }));
    
            // 3. Deep update the specific index in the array
            nextPolygons[index] = newCoordinates;
            console.log(`Deep Sync: Polygon ${index} updated successfully.`);
          }
        });
    
        // 4. Notify parent state immediately so the "Save Polygons" button has fresh data
        if (onPolygonChange) {
          const slotFormat = nextPolygons.map((poly, i) => ({
            slot: i + 1,
            coordinates: poly
          }));
          onPolygonChange(slotFormat);
        }
    
        return nextPolygons;
      });
    });

    map.on(L.Draw.Event.DELETED, (e) => {
      const layers = e.layers;
      
   
      layers.eachLayer((layer) => {
        const index = polygonLayersRef.current.indexOf(layer);
        if (index !== -1) {
          polygonLayersRef.current.splice(index, 1);
        }
      });
    
      if (featureGroupRef.current.getLayers().length === 0) {
        console.log("Default Clear All trigger ");
        if (onPolygonDeleted) {
          onPolygonDeleted(-1); 
        }
      } else {
        
        if (onPolygonDeleted) onPolygonDeleted(); 
      }
    });

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.EDITED);
      map.off(L.Draw.Event.DELETED);
    };
  }, [map, onPolygonCreated, onPolygonEdited, onPolygonDeleted]);

  return null;
}



// Shape Creator Form Component
function ShapeCreatorForm({ mapCenter }) {
  const [sides, setSides] = useState(3);
  const [lat, setLat] = useState(mapCenter[0]?.toFixed(4) || "28.6139");
  const [lng, setLng] = useState(mapCenter[1]?.toFixed(4) || "77.209");
  const [radius, setRadius] = useState(30);
  const [shapeName, setShapeName] = useState("MyShape");

  const handleCreateShape = () => {
    const sidesNum = parseInt(sides);
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius);

    if (!sidesNum || !latNum || !lngNum || !radiusNum) {
      alert("Please fill in all fields!");
      return;
    }

    if (window.createRegularPolygon) {
      window.createRegularPolygon(latNum, lngNum, sidesNum, radiusNum, shapeName);
    } else {
      alert("Shape creator not ready. Please try again.");
    }
  };

  return (
    <div style={{ background: "white", padding: "8px", borderRadius: "4px", width: "200px" }}>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "bold" }}>Shape Creator</h4>
      <label style={{ fontSize: "12px" }}>Sides:</label>
      <br />
      <input
        id="sides"
        type="number"
        min="3"
        max="10"
        value={sides}
        onChange={(e) => setSides(e.target.value)}
        style={{ width: "100%", padding: "4px", fontSize: "12px" }}
      />
      <br />
      <label style={{ fontSize: "12px" }}>Center Lat:</label>
      <br />
      <input
        id="lat"
        type="number"
        value={lat}
        step="0.0001"
        onChange={(e) => setLat(e.target.value)}
        style={{ width: "100%", padding: "4px", fontSize: "12px" }}
      />
      <br />
      <label style={{ fontSize: "12px" }}>Center Lon:</label>
      <br />
      <input
        id="lon"
        type="number"
        value={lng}
        step="0.0001"
        onChange={(e) => setLng(e.target.value)}
        style={{ width: "100%", padding: "4px", fontSize: "12px" }}
      />
      <br />
      <label style={{ fontSize: "12px" }}>Radius (meters):</label>
      <br />
      <input
        id="radius"
        type="number"
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        style={{ width: "100%", padding: "4px", fontSize: "12px" }}
      />
      <br />
      <label style={{ fontSize: "12px" }}>Name:</label>
      <br />
      <input
        id="shapeName"
        type="text"
        value={shapeName}
        onChange={(e) => setShapeName(e.target.value)}
        style={{ width: "100%", padding: "4px", fontSize: "12px" }}
      />
      <br />
      <br />
      <button
        onClick={handleCreateShape}
        style={{
          width: "100%",
          backgroundColor: "orange",
          color: "white",
          border: "none",
          padding: "6px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        Create Shape
      </button>
    </div>
  );
}

export default function FacilityMapWithDrawing({
  center,
  zoom = 18,
  facilityAddress,
  existingPolygon = null,
  onPolygonChange = null,
  showControls = true,
  allowMultiple = false, // Allow multiple polygons
}) {
  const [polygonCoordinates, setPolygonCoordinates] = useState(allowMultiple ? [] : null);
  const [allPolygons, setAllPolygons] = useState([]); // Store all polygons
  const [mapCenter, setMapCenter] = useState(center || [28.6139, 77.209]);

  useEffect(() => {
    if (center && center.lat && center.lng) {
      setMapCenter([center.lat, center.lng]);
    }
  }, [center]);

  // Initialize polygons from existing data
  useEffect(() => {
    if (!existingPolygon || (Array.isArray(existingPolygon) && existingPolygon.length === 0)) {
      setAllPolygons([]); // Clear the internal map state
      setPolygonCoordinates(null); // Clear single polygon state
      return; // Stop here
    }
    
    if (allowMultiple && existingPolygon) {
      // If existingPolygon is an array of polygons
      if (Array.isArray(existingPolygon) && existingPolygon.length > 0) {
        // Check if it's slot-based format: [{ slot: 1, coordinates: [...] }, ...]
        if (existingPolygon[0] && typeof existingPolygon[0] === 'object' && 'slot' in existingPolygon[0] && 'coordinates' in existingPolygon[0]) {
          // Slot-based format - extract coordinates (already in Google format)
          const polygons = existingPolygon.map(poly => poly.coordinates || []);
          setAllPolygons(polygons);
        } else if (Array.isArray(existingPolygon[0]) && Array.isArray(existingPolygon[0][0])) {
          // Multiple polygons format (array of arrays) - already in Leaflet format, convert to Google
          const googlePolygons = existingPolygon.map(poly => leafletToGoogle(poly));
          setAllPolygons(googlePolygons);
        } else if (existingPolygon[0] && typeof existingPolygon[0] === 'object' && 'lat' in existingPolygon[0]) {
          // Single polygon in Google format
          setAllPolygons([existingPolygon]);
        }
      }
    } else if (!allowMultiple && existingPolygon) {
      // Single polygon mode - initialize if needed
      if (Array.isArray(existingPolygon) && existingPolygon.length > 0) {
        if (existingPolygon[0] && typeof existingPolygon[0] === 'object' && 'lat' in existingPolygon[0]) {
          // Already in Google format
          setPolygonCoordinates(existingPolygon);
        }
      }
    }

  }, [existingPolygon, allowMultiple]);

  const handlePolygonCreated = (coordinates, layer) => {
    if (allowMultiple) {
      const newPolygon = leafletToGoogle(coordinates);
      const updated = [...allPolygons, newPolygon];
      setAllPolygons(updated);
      setPolygonCoordinates(coordinates);
      if (onPolygonChange) {
        // Convert to slot-based format for saving
        const slotBasedFormat = updated.map((polygon, index) => ({
          slot: index + 1,
          coordinates: polygon,
        }));
        onPolygonChange(slotBasedFormat);
      }
    } else {
      setPolygonCoordinates(coordinates);
      if (onPolygonChange) {
        onPolygonChange(leafletToGoogle(coordinates));
      }
    }
  };

  const handlePolygonEdited = (coordinates, index) => {
    if (allowMultiple && index !== undefined && index !== -1) {
      const updated = [...allPolygons];
      updated[index] = leafletToGoogle(coordinates);
      setAllPolygons(updated);
      setPolygonCoordinates(coordinates);
      if (onPolygonChange) {
        // Convert to slot-based format for saving
        const slotBasedFormat = updated.map((polygon, index) => ({
          slot: index + 1,
          coordinates: polygon,
        }));
        onPolygonChange(slotBasedFormat);
      }
    } else {
      setPolygonCoordinates(coordinates);
      if (onPolygonChange) {
        onPolygonChange(leafletToGoogle(coordinates));
      }
    }
  };

  const handlePolygonDeleted = (index) => {
    // console.log("test handlePolygonDeleted", index);
  
    // --- NEW: Handle Clear All Case ---
    if (index === "CLEAR_ALL") {
      setAllPolygons([]);
      setPolygonCoordinates(allowMultiple ? [] : null);
      
      if (onPolygonChange) {
        onPolygonChange(null);
      }
      return; // Exit early
    }
  
    // --- EXISTING: Handle Single Delete Case ---
    if (allowMultiple && index !== undefined && index !== -1) {
      const updated = allPolygons.filter((_, i) => i !== index);
      setAllPolygons(updated);
  
      if (updated.length === 0) {
        setPolygonCoordinates(null);
      }
  
      if (onPolygonChange) {
        if (updated.length > 0) {
          const slotBasedFormat = updated.map((polygon, index) => ({
            slot: index + 1,
            coordinates: polygon,
          }));
          onPolygonChange(slotBasedFormat);
        } else {
          onPolygonChange(null);
        }
      }
    } else {
      setPolygonCoordinates(null);
      if (onPolygonChange) {
        onPolygonChange(null);
      }
    }
  };

  const handleShapeCreated = (coordinates) => {
    if (allowMultiple) {
      const newPolygon = leafletToGoogle(coordinates);
      const updated = [...allPolygons, newPolygon];
      setAllPolygons(updated);
      setPolygonCoordinates(coordinates);
      if (onPolygonChange) {
        // Convert to slot-based format for saving
        const slotBasedFormat = updated.map((polygon, index) => ({
          slot: index + 1,
          coordinates: polygon,
        }));
        onPolygonChange(slotBasedFormat);
      }
    } else {
      setPolygonCoordinates(coordinates);
      if (onPolygonChange) {
        onPolygonChange(leafletToGoogle(coordinates));
      }
    }
  };

  const handleExportJSON = () => {
    const polygonsToExport = allowMultiple ? allPolygons : (polygonCoordinates ? [leafletToGoogle(polygonCoordinates)] : []);
    
    if (polygonsToExport.length === 0) {
      alert("No polygons to export. Please draw a polygon first.");
      return;
    }

    // Export in slot-based format with latitude/longitude
    const parkingSlotPolygons = polygonsToExport.map((polygon, index) => {
      return {
        slot: index + 1,
        coordinates: polygon.map(coord => ({
          latitude: roundTo6Decimals(coord.lat),
          longitude: roundTo6Decimals(coord.lng),
        })),
      };
    });

    const jsonString = JSON.stringify(parkingSlotPolygons, null, 2);
    
    // Create download link
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `parkingSlotPolygons-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = () => {
    const polygonsToExport = allowMultiple ? allPolygons : (polygonCoordinates ? [leafletToGoogle(polygonCoordinates)] : []);
    
    if (polygonsToExport.length === 0) {
      alert("No polygons to export. Please draw a polygon first.");
      return;
    }

    // Export all polygons as GeoJSON FeatureCollection
    const features = polygonsToExport.map((polygon, index) => {
      const leafletCoords = googleToLeaflet(polygon);
      return toGeoJSON(leafletCoords, {
        facilityAddress: facilityAddress || "",
        polygonIndex: index + 1,
      });
    });

    const geoJsonData = {
      type: "FeatureCollection",
      features: features,
      properties: {
        facilityAddress: facilityAddress || "",
        exportedAt: new Date().toISOString(),
        polygonCount: features.length,
      },
    };
    
    const jsonString = JSON.stringify(geoJsonData, null, 2);
    
    // Create download link
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `facility-polygons-geojson-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Convert existing polygon from Google format to Leaflet format
  // Handle both single polygon and array of polygons
  // Convert existingPolygon to Leaflet format for display
  const existingPolygonLeaflet = existingPolygon
    ? (Array.isArray(existingPolygon) && existingPolygon.length > 0)
      ? (existingPolygon[0] && typeof existingPolygon[0] === 'object' && 'slot' in existingPolygon[0] && 'coordinates' in existingPolygon[0])
        ? existingPolygon.map(poly => googleToLeaflet(poly?.coordinates || [])) // Slot-based format
        : (existingPolygon[0] && typeof existingPolygon[0] === 'object' && 'lat' in existingPolygon[0])
          ? (Array.isArray(existingPolygon[0]) && existingPolygon[0][0] && typeof existingPolygon[0][0] === 'object' && 'lat' in existingPolygon[0][0])
            ? existingPolygon.map(poly => googleToLeaflet(poly)) // Multiple polygons in Google format
            : googleToLeaflet(existingPolygon) // Single polygon in Google format
          : existingPolygon // Already in Leaflet format
      : null
    : null;

  return (
    <div className="relative w-full h-full">
      {showControls && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-lg flex flex-col gap-2">
          {allowMultiple && allPolygons.length > 0 && (
            <div className="text-xs text-gray-600 mb-1">
              {allPolygons.length} polygon{allPolygons.length > 1 ? 's' : ''} drawn
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={allowMultiple ? allPolygons.length === 0 : !polygonCoordinates}
            >
              Export JSON
            </button>
            {/* GeoJSON export button hidden for now */}
            {/* <button
              onClick={handleExportGeoJSON}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={allowMultiple ? allPolygons.length === 0 : !polygonCoordinates}
            >
              Export GeoJSON
            </button> */}
          </div>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        scrollWheelZoom={true}
        zoomControl={true}
        maxZoom={20}
      >
        {/* Esri World Imagery (Satellite) - Free, no API key needed */}
        <TileLayer
          attribution='Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={20}
          tileSize={256}
        />

        {/* Facility Location Marker */}
        {mapCenter && (
          <Marker position={mapCenter}>
            <Popup>
              <div className="text-sm font-medium mb-2">
                {facilityAddress || "Facility Location"}
              </div>
              <ShapeCreatorForm mapCenter={mapCenter} />
            </Popup>
          </Marker>
        )}

        {/* Map Controls (Fullscreen, Measure) */}
        <MapControls mapCenter={mapCenter} onShapeCreated={handleShapeCreated} />

        {/* Drawing Controls */}
        <DrawingControls
          onPolygonCreated={handlePolygonCreated}
          onPolygonEdited={handlePolygonEdited}
          onPolygonDeleted={handlePolygonDeleted}
          existingPolygon={existingPolygonLeaflet}
          setAllPolygons={setAllPolygons}
          allowMultiple={allowMultiple}
          onPolygonChange={onPolygonChange}
        />
      </MapContainer>
    </div>
  );
}

