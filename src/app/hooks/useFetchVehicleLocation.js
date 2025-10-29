"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import supabase from "../api/client";

export default function useFetchVehicleLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mqttConnected, setMqttConnected] = useState(false);
  const mqttClientRef = useRef(null);

  // MQTT Config - same as mobile app
  const MQTT_CONFIG = {
    host: "ws://sensecap-openstream.seeed.cc:8083/mqtt", // browser WS endpoint
    username: "org-449810146246400",
    password: "9B1C6913197A4C56B5EC31F1CEBAECF9E7C7235B015B456DB0EC577BD7C167F3",
    clientId: "org-449810146246400-react-" + Math.random().toString(16).substr(2, 8),
    protocolVersion: 4,
  };

  const disconnect = useCallback(() => {
    if (mqttClientRef.current) {
      try {
        mqttClientRef.current.end(true);
      } catch (e) {
        console.error("MQTT disconnect error:", e);
      }
      mqttClientRef.current = null;
    }
    setMqttConnected(false);
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const initializeMqtt = useCallback((chipId, onLocationUpdate) => {
    if (!chipId) return;

    try {
      console.log('Initializing MQTT for chip ID:', chipId);
      setLoading(true);
      setError(null);

      // Disconnect previous client if exists
      disconnect();

      const client = mqtt.connect(MQTT_CONFIG.host, {
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        clientId: MQTT_CONFIG.clientId,
        protocolVersion: MQTT_CONFIG.protocolVersion,
        reconnectPeriod: 0, // No auto reconnect
      });

      mqttClientRef.current = client;

      let latestLat = null;
      let latestLon = null;

      client.on("connect", () => {
        console.log("✅ Connected to MQTT for chip:", chipId);
        setMqttConnected(true);
        setLoading(false);

        // Subscribe to specific chip ID topics (like mobile app)
        // Subscribe to the exact channel ("1") to match what mosquitto_sub shows
        const latitudeTopic = `/device_sensor_data/449810146246400/2CF7F1C07190019F/1/vs/4198`;
        const longitudeTopic = `/device_sensor_data/449810146246400/2CF7F1C07190019F/1/vs/4197`;

        console.log("Subscribing to topics:");
        console.log("Latitude topic:", latitudeTopic);
        console.log("Longitude topic:", longitudeTopic);

        client.subscribe(latitudeTopic, (err) => {
          if (err) {
            console.error('MQTT Subscribe error (latitude):', err);
          } else {
            console.log(`✅ Subscribed to latitude topic: ${latitudeTopic}`);
          }
        });

        client.subscribe(longitudeTopic, (err) => {
          if (err) {
            console.error('MQTT Subscribe error (longitude):', err);
          } else {
            console.log(`✅ Subscribed to longitude topic: ${longitudeTopic}`);
          }
        });
      });

      client.on("message", async (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());

          console.log('📍 [MQTT] 📨 Message received on topic:', topic);
          console.log('📍 [MQTT] 📦 Message payload:', payload);

          // Since we're subscribed to specific chip ID topics, all messages are for our target chip
          if (topic.includes("4197")) {
            latestLon = payload.value;   // longitude
            console.log('📍 [MQTT] 🌐 Longitude received for chip', chipId, ':', latestLon);
          } else if (topic.includes("4198")) {
            latestLat = payload.value;   // latitude
            console.log('📍 [MQTT] 🌍 Latitude received for chip', chipId, ':', latestLat);
          }

          // Update location when both coordinates are received
          if (latestLat !== null && latestLon !== null) {
            const latitude = parseFloat(latestLat);
            const longitude = parseFloat(latestLon);
            console.log("📍 [MQTT] 🎯 Complete GPS coordinates received for chip", chipId, ":", {
              latitude,
              longitude,
              timestamp: new Date().toISOString()
            });

            if (!isNaN(latitude) && !isNaN(longitude)) {
              const currentTimestamp = new Date().toISOString();
              
              // Update database with new location
              try {
                console.log(`📍 [MQTT] 🔄 Updating database with new location for chip: ${chipId}`, {
                  latitude,
                  longitude,
                  currentTimestamp: currentTimestamp,
                  localTime: new Date().toLocaleString()
                });

                const { error: updateError } = await supabase
                  .from('cars')
                  .update({
                    latitude: latitude,
                    longitude: longitude,
                    last_location_update: currentTimestamp
                  })
                  .eq('chip', chipId);

                if (updateError) {
                  console.error('📍 [MQTT] ❌ Error updating location in database:', updateError);
                } else {
                  console.log(`📍 [MQTT] ✅ Location updated in database successfully:`, {
                    chipId: chipId,
                    latitude,
                    longitude,
                    databaseTimestamp: currentTimestamp,
                    localTime: new Date().toLocaleString()
                  });
                }
              } catch (dbError) {
                console.error('📍 [MQTT] ❌ Database location update error:', dbError);
              }

              // Call the callback with new location
              if (onLocationUpdate) {
                onLocationUpdate({
                  latitude,
                  longitude,
                  updatedAt: currentTimestamp
                });
              }

              // Reset coordinates for next update
              latestLat = null;
              latestLon = null;
            }
          }
        } catch (error) {
          console.error('Error parsing MQTT message:', error);
        }
      });

      client.on("error", (error) => {
        console.error("MQTT Error:", error);
        setMqttConnected(false);
        setError(error.message);
        setLoading(false);
      });

      client.on("close", () => {
        console.log("MQTT Connection closed");
        setMqttConnected(false);
        setLoading(false);
      });

    } catch (error) {
      console.error("MQTT Initialization error:", error);
      setMqttConnected(false);
      setError(error.message);
      setLoading(false);
    }
  }, [disconnect]);

  const fetchFromApi = useCallback(async ({ chipId, orgId, username, password, host, port, clientId, timeoutMs }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sensecap/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chipId, orgId, username, password, host, port, clientId, timeoutMs }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to fetch location");
      return json; // { latitude, longitude, updatedAt }
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    initializeMqtt, 
    disconnect, 
    fetchFromApi,
    loading, 
    error, 
    mqttConnected 
  };
}


