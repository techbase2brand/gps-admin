
"use client";

import { useState, useEffect, useCallback } from "react";
import client from "../api/client"; // adjust path as per your project

export default function useCarsCRUD(storageKey, filters = {}) {
  const [carData, setcarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Start Query
      let query = client
        .from(storageKey)
        .select("*", { count: 'exact' });

      // Apply Filters directly to Supabase Query
      if (filters.search) {
        query = query.or(`vin.ilike.%${filters.search}%,chip.ilike.%${filters.search}%,trackerNo.ilike.%${filters.search}%`);
      }
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.facility && filters.facility !== "all") {
        query = query.eq("facilityId", filters.facility);
      }

      const { data, error, count } = await query
        .order("id", { ascending: true })
        .range(from, to);

      if (error) throw error;

      setTotalCount(count || 0);

      const fixedData = data?.map(car => ({
        ...car,
        status: car.chip && car.chip.trim() ? "Assigned" : "Unassigned"
      }));

      setcarData(fixedData || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [storageKey, currentPage, filters.search, filters.status, filters.facility]);

  // Fetch data on page or filter change
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);



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
      await fetchAll();

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
      await fetchAll();
      setcarData((prev) => prev.filter((d) => d.id !== id));
      return { message: "Deleted", id };
    } catch (err) {
      console.error("Delete item error:", err.message);
    }
  };

  useEffect(() => {
    fetchAll(currentPage);
  }, [storageKey, currentPage]);

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalCount,
    carData,
    loading,
    addItem,
    updateItem,
    deleteItem,
    updateTrackerAndStatus,
  };
}
