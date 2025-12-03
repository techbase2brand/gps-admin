"use client";

import { useState, useEffect } from "react";
import client from "../api/client";

export default function useFacilityPolygons(facilityId) {
  const [polygons, setPolygons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all polygons for a facility
  const fetchPolygons = async () => {
    if (!facilityId) {
      setPolygons([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await client
        .from("facility_polygons")
        .select("*")
        .eq("facility_id", facilityId)
        .order("slot_number", { ascending: true });

      if (error) throw error;
      
      // Convert to format expected by map component
      const formattedPolygons = (data || []).map((poly) => ({
        slot: poly.slot_number,
        coordinates: poly.coordinates || [],
      }));
      
      setPolygons(formattedPolygons);
    } catch (err) {
      console.error("Fetch polygons error:", err.message);
      setPolygons([]);
    } finally {
      setLoading(false);
    }
  };

  // Save polygons (delete old, insert new)
  const savePolygons = async (polygonArray) => {
    if (!facilityId) {
      throw new Error("Facility ID is required");
    }

    if (!polygonArray || !Array.isArray(polygonArray) || polygonArray.length === 0) {
      // If empty array, just delete existing polygons
      await deletePolygons();
      return [];
    }

    try {
      // Delete existing polygons for this facility
      const { error: deleteError } = await client
        .from("facility_polygons")
        .delete()
        .eq("facility_id", facilityId);

      if (deleteError) throw deleteError;

      // Prepare polygons for insertion
      const polygonsToInsert = polygonArray.map((poly, index) => ({
        facility_id: Number(facilityId),
        slot_number: poly.slot || (index + 1),
        coordinates: poly.coordinates || [],
      }));

      // Insert new polygons
      const { data, error: insertError } = await client
        .from("facility_polygons")
        .insert(polygonsToInsert)
        .select();

      if (insertError) throw insertError;

      // Convert to format expected by map component
      const formattedPolygons = (data || []).map((poly) => ({
        slot: poly.slot_number,
        coordinates: poly.coordinates || [],
      }));

      setPolygons(formattedPolygons);
      return formattedPolygons;
    } catch (err) {
      console.error("Save polygons error:", err.message);
      throw err;
    }
  };

  // Delete all polygons for a facility
  const deletePolygons = async () => {
    if (!facilityId) return;

    try {
      const { error } = await client
        .from("facility_polygons")
        .delete()
        .eq("facility_id", facilityId);

      if (error) throw error;
      setPolygons([]);
    } catch (err) {
      console.error("Delete polygons error:", err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchPolygons();
  }, [facilityId]);

  return {
    polygons,
    loading,
    savePolygons,
    deletePolygons,
    refetch: fetchPolygons,
  };
}

