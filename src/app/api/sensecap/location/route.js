import { NextResponse } from "next/server";
import mqtt from "mqtt";
import client from "../../client";

function isValidCoordinate(value, type) {
  if (typeof value !== "number" || Number.isNaN(value)) return false;
  if (type === "lat") return value >= -90 && value <= 90;
  if (type === "lon") return value >= -180 && value <= 180;
  return false;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const chipId = body?.chipId?.trim();
    if (!chipId) {
      return NextResponse.json({ error: "chipId is required" }, { status: 400 });
    }

    const orgId = body?.orgId || process.env.SENSECAP_ORG_ID || process.env.NEXT_PUBLIC_SENSECAP_ORG_ID;
    const username = body?.username || process.env.SENSECAP_USERNAME || `org-${orgId}`;
    const password = body?.password || process.env.SENSECAP_PASSWORD || process.env.NEXT_PUBLIC_SENSECAP_PASSWORD;
    const host = body?.host || process.env.SENSECAP_HOST || "sensecap-openstream.seeed.cc";
    const port = Number(body?.port || process.env.SENSECAP_PORT || 1883);
    const clientId = body?.clientId || process.env.SENSECAP_CLIENT_ID || `${username}-gps-admin-api`;
    const timeoutMs = Number(body?.timeoutMs || 10000);

    if (!orgId || !username || !password) {
      return NextResponse.json({ error: "Missing SenseCAP credentials" }, { status: 400 });
    }

    const url = `mqtt://${host}:${port}`;
    const mqttClient = mqtt.connect(url, {
      clientId,
      username,
      password,
      protocolVersion: 4,
      reconnectPeriod: 0,
      connectTimeout: 8000,
    });

    const buffer = new Map(); // key: `${timestamp}` -> { lat?, lon? }

    const waitForPair = () =>
      new Promise((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
          try {
            mqttClient.end(true);
          } catch {}
        };

        mqttClient.on("connect", () => {
          const topicLon = `/device_sensor_data/${orgId}/${chipId}/+/vs/4197`;
          const topicLat = `/device_sensor_data/${orgId}/${chipId}/+/vs/4198`;
          mqttClient.subscribe([topicLon, topicLat]);
        });

        mqttClient.on("message", (topic, payload) => {
          try {
            const parts = topic.split("/");
            const measureId = parts[6];
            const data = JSON.parse(payload.toString());
            const value = Number(data?.value);
            const timestamp = String(data?.timestamp);
            if (!timestamp || Number.isNaN(value)) return;
            const entry = buffer.get(timestamp) || {};
            if (measureId === "4197") entry.lon = value; // longitude
            if (measureId === "4198") entry.lat = value; // latitude
            buffer.set(timestamp, entry);
            if (
              typeof entry.lat === "number" &&
              typeof entry.lon === "number" &&
              isValidCoordinate(entry.lat, "lat") &&
              isValidCoordinate(entry.lon, "lon")
            ) {
              settled = true;
              cleanup();
              resolve({
                latitude: entry.lat,
                longitude: entry.lon,
                timestamp: Number(timestamp),
              });
            }
          } catch {}
        });

        mqttClient.on("error", (err) => {
          if (!settled) {
            settled = true;
            cleanup();
            reject(err);
          }
        });

        setTimeout(() => {
          if (!settled) {
            settled = true;
            cleanup();
            reject(new Error("Timeout waiting for location"));
          }
        }, timeoutMs);
      });

    const result = await waitForPair();

    // Update DB by chip
    const { data: carRow, error: carErr } = await client
      .from("cars")
      .select("id")
      .eq("chip", chipId)
      .single();

    if (carErr || !carRow) {
      return NextResponse.json({ error: "Car not found for chip" }, { status: 404 });
    }

    const { data: updated, error: updErr } = await client
      .from("cars")
      .update({
        latitude: result.latitude,
        longitude: result.longitude,
        last_location_update: new Date(result.timestamp).toISOString(),
      })
      .eq("id", carRow.id)
      .select("id, latitude, longitude, last_location_update")
      .single();

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        latitude: updated.latitude,
        longitude: updated.longitude,
        updatedAt: updated.last_location_update,
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
