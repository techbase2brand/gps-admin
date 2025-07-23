"use client";
import { useState } from "react";
import client from "../api/client"; 

export default function useGlobalSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchAllTables = async (query) => {
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const [cars, facilities, staff] = await Promise.all([
        client.from("cars").select("*").ilike("vin", `%${query}%`),
        client.from("facility").select("*").ilike("name", `%${query}%`),
        client
          .from("staff")
          .select("*")
          .or(`name.ilike.%${query}%,email.ilike.%${query}%`),
      ]);

      const combinedResults = [
        ...(cars.data || []).map((item) => ({ ...item, type: "Car" })),
        ...(facilities.data || []).map((item) => ({
          ...item,
          type: "Facility",
        })),
        ...(staff.data || []).map((item) => ({ ...item, type: "Staff" })),
      ];

      setResults(combinedResults);
      setLoading(false);
    } catch (err) {
      console.error("Global search error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, searchAllTables };
}
