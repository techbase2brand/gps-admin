"use client";

import { useState, useEffect } from "react";
import client from "../api/client";

export default function useReportsIssuesCRUD(storageKey) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data, error } = await client
        .from(storageKey)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        console.error("Table name being used:", storageKey);
        throw error;
      }
      
      // console.log(`Fetched ${data?.length || 0} records from ${storageKey}`);
      setData(data || []);
    } catch (err) {
      console.error("Fetch all error:", err.message);
      console.error("Full error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (item) => {
    try {
      const { data: updated, error } = await client
        .from(storageKey)
        .update(item)
        .eq("id", item.id)
        .select();

      if (error) throw error;

      setData((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, ...item } : d))
      );
      return updated?.[0] || item;
    } catch (err) {
      console.error("Update item error:", err.message);
      throw err;
    }
  };

  const deleteItem = async (id) => {
    try {
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

  return { data, loading, fetchAll, updateItem, deleteItem };
}

