
"use client";

import { useState, useEffect } from "react";
import client from "../api/client"; // adjust path as per your project

export default function useCarsCRUD(storageKey) {
  const [carData, setcarData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data, error } = await client
        .from(storageKey)
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      
      // Fix status for all cars based on chip (for existing data)
      const fixedData = data?.map(car => {
        const correctStatus = car.chip && car.chip.trim() ? "Assigned" : "Unassigned";
        return { ...car, status: correctStatus };
      });
      
      setcarData(fixedData);
    } catch (err) {
      console.error("Fetch all error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item) => {
    try {
      // Status depends on chip: if chip exists → Assigned, else → Unassigned
      const status = item.chip && item.chip.trim() ? "Assigned" : "Unassigned";
      
      const newItem = {
        id: Date.now(), // keep same id logic
        ...item,
        status,
      };

      const { data, error } = await client
        .from(storageKey)
        .insert([newItem])
        .select();

      if (error) throw error;

      setcarData((prev) => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error("Add item error:", err.message);
    }
  };

  const updateItem = async (item) => {
    try {
      // Status depends on chip: if chip exists → Assigned, else → Unassigned
      const status = item.chip && item.chip.trim() ? "Assigned" : "Unassigned";
      const updatedItem = { ...item, status };
      
      const { data, error } = await client
        .from(storageKey)
        .update(updatedItem)
        .eq("id", item.id)
        .select();

      if (error) throw error;

      setcarData((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, ...updatedItem } : d))
      );
      return updatedItem;
    } catch (err) {
      console.error("Update item error:", err.message);
    }
  };

  const updateTrackerAndStatus = async (id, trackerNo, status) => {
    try {
      const updates = {
        trackerNo,
        status,
      };

      const { data, error } = await client
        .from(storageKey)
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;

      setcarData((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, trackerNo, status, } : d
        )
      );
      return { message: "Tracker and status updated", id };
    } catch (err) {
      console.error("Update tracker and status error:", err.message);
    }
  };

  const deleteItem = async (id) => {
    try {
      const { error } = await client
        .from(storageKey)
        .delete()
        .eq("id", id);

      if (error) throw error;

      setcarData((prev) => prev.filter((d) => d.id !== id));
      return { message: "Deleted", id };
    } catch (err) {
      console.error("Delete item error:", err.message);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [storageKey]);

  return {
    carData,
    loading,
    addItem,
    updateItem,
    deleteItem,
    updateTrackerAndStatus,
  };
}
