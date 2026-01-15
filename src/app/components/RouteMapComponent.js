"use client";
import { useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, useMap, CircleMarker, Polyline, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Utility to calculate real-world distance
function getDistance(p1, p2) {
  return L.latLng(p1).distanceTo(L.latLng(p2));
}

function GraphEvents({ onMapClick, onMouseMove, activeNode }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
    mousemove(e) {
      if (activeNode) onMouseMove(e.latlng);
    }
  });
  return null;
}

export default function RouteMapComponent({ center = [35.966944, -86.493056] }) {
  const [nodes, setNodes] = useState([]); // {id, lat, lng}
  const [links, setLinks] = useState([]); // {sourceId, targetId}
  const [dragStartNode, setDragStartNode] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  // --- ADD NODE ---
  const handleMapClick = (latlng) => {
    if (dragStartNode) return;
    const newNode = { id: Date.now(), lat: latlng.lat, lng: latlng.lng };
    setNodes((prev) => [...prev, newNode]);
    console.log("list of the node draged",dragStartNode);
  };

  // --- DELETE NODE & LINKS ---
  const deleteNode = (e, nodeId) => {
    L.DomEvent.stopPropagation(e);
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setLinks((prev) => prev.filter((l) => l.source !== nodeId && l.target !== nodeId));
  };

  // --- DRAG NODE (MOVE POSITION) ---
  const handleNodeDrag = (nodeId, newLatlng) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, lat: newLatlng.lat, lng: newLatlng.lng } : n))
    );
  };

  // --- LINK NODES (MOUSE DOWN/UP) ---
  const startDrawingLink = (e, nodeId) => {
    L.DomEvent.stopPropagation(e);
    // Disable map dragging while drawing a link
    e.target._map.dragging.disable();
    setDragStartNode(nodeId);
  };

  const endDrawingLink = (e, targetId) => {
    L.DomEvent.stopPropagation(e);
    const map = e.target._map;
    map.dragging.enable();

    if (dragStartNode && dragStartNode !== targetId) {
      const exists = links.some(
        (l) => (l.source === dragStartNode && l.target === targetId) || (l.source === targetId && l.target === dragStartNode)
      );
      if (!exists) {
        setLinks((prev) => [...prev, { source: dragStartNode, target: targetId }]);
      }
    }
    setDragStartNode(null);
    setMousePos(null);
  };

  // --- MATRIX CALCULATION ---
  const matrix = useMemo(() => {
    const size = nodes.length;
    const mat = Array(size).fill(0).map(() => Array(size).fill(Infinity));
    nodes.forEach((_, i) => (mat[i][i] = 0));

    links.forEach((link) => {
      const sIdx = nodes.findIndex((n) => n.id === link.source);
      const tIdx = nodes.findIndex((n) => n.id === link.target);
      if (sIdx !== -1 && tIdx !== -1) {
        const dist = getDistance([nodes[sIdx].lat, nodes[sIdx].lng], [nodes[tIdx].lat, nodes[tIdx].lng]);
        mat[sIdx][tIdx] = mat[tIdx][sIdx] = parseFloat(dist.toFixed(2));
      }
    });
    return mat;
  }, [nodes, links]);

  const activeNodeData = nodes.find(n => n.id === dragStartNode);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-cyan-400">Satellite Graph Tool v2</h2>
        <button onClick={() => console.log({ nodes, links, matrix })} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold">
          Save Data
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="relative flex-[3] rounded-lg border-2 border-cyan-500 overflow-hidden">
          <MapContainer center={center} zoom={18} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" maxZoom={20} />
            
            <GraphEvents 
                onMapClick={handleMapClick} 
                onMouseMove={(coords) => setMousePos(coords)} 
                activeNode={dragStartNode} 
            />

            {/* Ghost Line (While drawing link) */}
            {activeNodeData && mousePos && (
              <Polyline positions={[[activeNodeData.lat, activeNodeData.lng], [mousePos.lat, mousePos.lng]]} pathOptions={{ color: "white", weight: 2, dashArray: "5, 10" }} />
            )}

            {/* Permanent Links */}
            {links.map((link, idx) => {
              const s = nodes.find((n) => n.id === link.source);
              const t = nodes.find((n) => n.id === link.target);
              return s && t ? <Polyline key={idx} positions={[[s.lat, s.lng], [t.lat, t.lng]]} pathOptions={{ color: "yellow", weight: 4 }} /> : null;
            })}

            {/* Nodes */}
            {nodes.map((node, idx) => (
              <CircleMarker
                key={node.id}
                center={[node.lat, node.lng]}
                radius={10}
                draggable={true}
                eventHandlers={{
                  mousedown: (e) => startDrawingLink(e, node.id),
                  mouseup: (e) => endDrawingLink(e, node.id),
                  contextmenu: (e) => deleteNode(e, node.id),
                  dragend: (e) => handleNodeDrag(node.id, e.target.getLatLng()),
                }}
                pathOptions={{ fillColor: "#00f2ff", fillOpacity: 1, color: "white", weight: 2 }}
              >
                <Tooltip direction="top" permanent>Node {idx}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Matrix Sidebar */}
        <div className="flex-1 bg-black p-4 rounded-lg font-mono text-xs overflow-auto border border-cyan-900">
          <h3 className="text-cyan-400 mb-4 border-b border-cyan-900 pb-2">Adjacency Matrix (Meters)</h3>
          {nodes.length === 0 ? <p className="text-gray-500 italic">Click map to add nodes...</p> : 
            matrix.map((row, i) => (
              <div key={i} className="mb-2">
                <span className="text-cyan-500 mr-2">N{i}:</span>
                [{row.map((val, j) => (
                  <span key={j} className={val === Infinity ? "text-gray-700" : "text-green-400"}>
                    {val === Infinity ? " ∞" : ` ${val}`}
                  </span>
                ))}]
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}