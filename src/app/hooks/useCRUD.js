"use client";

import { useState, useEffect } from "react";
import client from "../api/client"; // adjust path as per your project

export default function useCRUD(storageKey) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data, error } = await client
        .from(storageKey)
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      setData(data);
    } catch (err) {
      console.error("Fetch all error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item) => {
    try {
      const newItem = {
        id: Date.now(), // bigint id as per your table schema
        name: item.name || "",
        number: item.number || "",
        city: item.city || "",
        address: item.address || "",
        lat: item.lat || "",
        long: item.long || "",
        parkingSlots: item.parkingSlots || 0,
        ...(item.polygonCoordinates !== undefined && {
          polygonCoordinates: item.polygonCoordinates,
        }),
      };

      const { data: insertedData, error } = await client
        .from(storageKey)
        .insert([newItem])
        .select();

      if (error) throw error;

      setData((prev) => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error("Add item error:", err.message);
    }
  };

  const updateItem = async (item) => {
    try {
      const updatedItem = {
        name: item.name || "",
        number: item.number || "",
        city: item.city || "",
        address: item.address || "",
        lat: item.lat || "",
        long: item.long || "",
        parkingSlots: item.parkingSlots || 0,
        ...(item.polygonCoordinates !== undefined && {
          polygonCoordinates: item.polygonCoordinates,
        }),
      };

      const { data: updated, error } = await client
        .from(storageKey)
        .update(updatedItem)
        .eq("id", item.id)
        .select();

      if (error) throw error;

      setData((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, ...updatedItem } : d))
      );
      return { id: item.id, ...updatedItem };
    } catch (err) {
      console.error("Update item error:", err.message);
    }
  };

  const deleteItem = async (id) => {
    try {
      // If deleting a facility, also delete its polygons
      if (storageKey === "facility") {
        const { error: polygonError } = await client
          .from("facility_polygons")
          .delete()
          .eq("facility_id", id);

        if (polygonError) {
          console.error("Delete polygons error:", polygonError.message);
          // Continue with facility deletion even if polygon deletion fails
        }
      }

      // Delete the facility/item
      const { error } = await client
        .from(storageKey)
        .delete()
        .eq("id", id);

      if (error) throw error;

      setData((prev) => prev.filter((d) => d.id !== id));
      return { message: "Deleted", id };
    } catch (err) {
      console.error("Delete item error:", err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
  }, [storageKey]);

  return { data, loading, addItem, updateItem, deleteItem };
}
