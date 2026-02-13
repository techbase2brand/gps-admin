"use client";

import React from "react";
import GoogleMapReact from "google-map-react";

export default function ParkingYardsMap() {
  const defaultProps = {
    center: {
      lat: 28.6139,
      lng: 77.209,
    },
    zoom: 10,
  };

  const parkingYards = [
    { id: 1, lat: 28.6139, lng: 77.209 },
    { id: 2, lat: 28.7041, lng: 77.1025 },
    { id: 3, lat: 28.5355, lng: 77.391 },
    { id: 4, lat: 28.4595, lng: 77.0266 },
    { id: 5, lat: 28.4089, lng: 77.3178 },
  ];

  const Marker = ({ text }) => (
    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
      {text}
    </div>
  );

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: process.env.GoogleMapReact_bootstrapURLKeys }}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
      >
        {parkingYards.map((yard) => (
          <Marker
            key={yard.id}
            lat={yard.lat}
            lng={yard.lng}
            // text={`Yard ${yard.id}`}
          />
        ))}
      </GoogleMapReact>
    </div>
  );
}
