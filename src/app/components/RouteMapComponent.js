"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// import supabase from "../admin/scripts/mqttWorker"
import supabase from "../api/client";
import { useParams } from "next/navigation";
// Utility to calculate real-world distance
const getDistance = (p1, p2) => L.latLng(p1).distanceTo(L.latLng(p2));

function MapEvents({ onMapClick, onMouseMove, isDrawing }) {
  useMapEvents({
    click(e) {
      if (!isDrawing) {
        // console.log("Map clicked: Adding new node at", e.latlng);
        onMapClick(e.latlng);
      }
    },
    mousemove(e) {
      if (isDrawing) onMouseMove(e.latlng);
    },
  });
  return null;
}

export default function RouteMapComponent({ center }) {
  const params = useParams();
  const facilityId = params.id;
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [drawingFromId, setDrawingFromId] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [isBlockingClick, setIsBlockingClick] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedData, setLastSavedData] = useState(null);

  // Compare current state to last saved state
  const hasChanges = useMemo(() => {
    const currentData = JSON.stringify({ nodes, links });
    return currentData !== lastSavedData;
  }, [nodes, links, lastSavedData]);

  const saveRouteData = async () => {
    if (nodes.length === 0) return alert("Add some nodes first!");

    setIsSaving(true);
    try {
      const graph_data = {
        nodes: nodes,
        links: links,
        adjacency_matrix: matrix,
      };

      // Replace 'current_facility_id' with the actual ID from your facility table
      const { data, error } = await supabase.from("route").upsert(
        {
          facility_id: facilityId,
          graph_data: graph_data,
        },
        { onConflict: "facility_id" }
      ); // Updates if facility already has a route
      // console.log("graph_data", graph_data);
      if (error) throw error;
      if (!error) {
        setLastSavedData(JSON.stringify({ nodes, links })); // Lock the button again
        alert("Saved");
      }
    } catch (err) {
      // console.error("Error saving route:", err.message);
      alert("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Fetch only once when the page loads
  useEffect(() => {
    const fetchSavedRoute = async () => {
      if (!facilityId) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("route")
          .select("graph_data")
          .eq("facility_id", facilityId)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data?.graph_data) {
          // Just set the data; don't filter here yet
          setNodes(data.graph_data.nodes || []);
          setLinks(data.graph_data.links || []);
          setLastSavedData(JSON.stringify(data.graph_data));
        }
      } catch (err) {
        console.error("Error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSavedRoute();
  }, [facilityId]); // ONLY facilityId here

  // 2. Automatically clean up links when nodes are deleted (Undo)
  useEffect(() => {
    setLinks((prevLinks) =>
      prevLinks.filter(
        (link) =>
          nodes.some((n) => n.id === link.source) &&
          nodes.some((n) => n.id === link.target)
      )
    );
  }, [nodes]);
  // --- ADD NODE ---
  const addNode = useCallback((latlng) => {
    setNodes((prev) => [
      ...prev,
      {
        id: Date.now(), // Unique ID use kiti hai
        nmae: `Node ${prev.length}`,
        lat: latlng.lat,
        lng: latlng.lng,
      },
    ]);
  }, []);

  // --- START DRAWING ---
  const startDrawing = (e, id) => {
    L.DomEvent.stopPropagation(e);
    console.log(
      `%c Drawing started from Node: ${id}`,
      "color: #00f2ff; font-weight: bold"
    );
    e.target._map.dragging.disable();
    setDrawingFromId(id);
    setIsBlockingClick(true);
  };

  // --- FINISH DRAWING ---
  const finishDrawing = (e, targetId) => {
    L.DomEvent.stopPropagation(e);
    console.log(
      `%c Attempting connection to Node: ${targetId}`,
      "color: #ffff00; font-weight: bold"
    );

    if (e.target._map) e.target._map.dragging.enable();

    if (drawingFromId !== null && drawingFromId !== targetId) {
      const sourceNode = nodes.find((n) => n.id === drawingFromId);
      const targetNode = nodes.find((n) => n.id === targetId);

      const exists = links.some(
        (l) =>
          (l.source === drawingFromId && l.target === targetId) ||
          (l.source === targetId && l.target === drawingFromId)
      );

      if (!exists && sourceNode && targetNode) {
        const dist = getDistance(
          [sourceNode.lat, sourceNode.lng],
          [targetNode.lat, targetNode.lng]
        );
        // console.log(
        //   `%c Success: Edge created! Distance: ${dist.toFixed(2)}m`,
        //   "color: #00ff00"
        // );
        setLinks((prev) => [
          ...prev,
          { source: drawingFromId, target: targetId, weight: dist },
        ]);
      } else if (exists) {
        console.warn("Edge already exists!");
      }
    } else {
      console.warn("Connection cancelled: Same node or invalid target.");
    }

    // Reset States
    setDrawingFromId(null);
    setMousePos(null);
    setTimeout(() => setIsBlockingClick(false), 200);
  };

  // --- MATRIX CALCULATION (BINARY 1/0) ---
  const matrix = useMemo(() => {
    const size = nodes.length;
    const mat = Array(size)
      .fill(0)
      .map(() => Array(size).fill(0));
    links.forEach((link) => {
      const sIdx = nodes.findIndex((n) => n.id === link.source);
      const tIdx = nodes.findIndex((n) => n.id === link.target);
      if (sIdx !== -1 && tIdx !== -1) {
        mat[sIdx][tIdx] = 1;
        mat[tIdx][sIdx] = 1;
      }
    });
    return mat;
  }, [nodes, links]);

  const activeNode = nodes.find((n) => n.id === drawingFromId);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-cyan-400 font-mono">
        <div className="animate-pulse">LOADING FACILITY GRAPH...</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans">
      <div className="mb-4 flex justify-between items-center z-[1000] ">
        <h1 className="text-2xl font-bold tracking-tight">
          Route Create
        </h1>
        <div className="flex gap-2">
          <button
            onClick={saveRouteData}
            disabled={isSaving || !hasChanges} // Disable if no changes
            className={`px-4 py-2 rounded font-medium transition ${
              !hasChanges
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-400 hover:bg-green-700"
            }`}
          >
            {isSaving ? "Saving..." : "Save Route"}
          </button>
          <button
            onClick={() => setNodes(nodes.slice(0, -1))}
            className="px-4 py-2 bg-black text-white rounded font-medium transition cursor-pointer"
          >
            Undo Node
          </button>
          <button
            onClick={() => setLinks(links.slice(0, -1))}
            className="px-4 py-2 bg-black text-white rounded font-medium transition cursor-pointer"
          >
            Undo Edge
          </button>
          <button
            onClick={() => {
              setNodes([]);
              setLinks([]);
            }}
            className="px-4 py-2 bg-black rounded text-white font-medium transition cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[3] relative">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={18}
            className="h-full w-full"
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri"
              maxZoom={20}
            />

            <MapEvents
              onMapClick={addNode}
              onMouseMove={setMousePos}
              isDrawing={drawingFromId !== null || isBlockingClick}
            />

            {/* Ghost Line (Interactive: false is the fix!) */}
            {activeNode && mousePos && (
              <Polyline
                positions={[
                  [activeNode.lat, activeNode.lng],
                  [mousePos.lat, mousePos.lng],
                ]}
                pathOptions={{
                  color: "white",
                  weight: 2,
                  dashArray: "10, 10",
                  interactive: false,
                }}
              />
            )}

            {/* Permanent Edges */}
            {links.map((link, idx) => {
              const s = nodes.find((n) => n.id === link.source);
              const t = nodes.find((n) => n.id === link.target);
              return s && t ? (
                <Polyline
                  key={`edge-${idx}`}
                  positions={[
                    [s.lat, s.lng],
                    [t.lat, t.lng],
                  ]}
                  pathOptions={{
                    color: "#ffff00",
                    weight: 4,
                    interactive: false,
                  }}
                />
              ) : null;
            })}

            {/* Nodes */}
            {nodes.map((node, idx) => (
              <CircleMarker
                key={node.id}
                center={[node.lat, node.lng]}
                radius={12}
                eventHandlers={{
                  mousedown: (e) => startDrawing(e, node.id),
                  mouseup: (e) => finishDrawing(e, node.id),
                }}
                pathOptions={{
                  fillColor: "#00f2ff",
                  fillOpacity: 1,
                  color: "white",
                  weight: 2,
                }}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -10]}
                  className="node-tooltip"
                >
                  Node {idx}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Matrix Sidebar */}
      {/*} <div className="flex-1 p-6 bg-black overflow-y-auto border-l border-slate-800 font-mono text-xs shadow-inner">
          <h2 className="text-cyan-400 mb-6 border-b border-slate-800 pb-2 uppercase tracking-tighter font-black">
            Adjacency Matrix (Binary)
          </h2>
          {nodes.length === 0 ? (
            <p className="text-slate-600 italic">Click map to add nodes...</p>
          ) : (
            matrix.map((row, i) => (
              <div key={i} className="mb-3 flex items-center">
                <span className="text-cyan-800 mr-3 font-bold">N{i}:</span>
                <span className="text-green-500 bg-slate-900 px-3 py-1 rounded tracking-[0.3em] font-bold">
                  [ {row.join(" ")} ]
                </span>
              </div>
            ))
          )}
        </div>*/}
      </div>

      <style jsx global>{`
        .node-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: #00f2ff !important;
          font-weight: 800 !important;
          text-shadow: 2px 2px 4px black;
        }
      `}</style>
    </div>
  );
}
