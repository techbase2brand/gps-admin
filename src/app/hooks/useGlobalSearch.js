"use client";

import { useState, useEffect } from "react";
import useCarsCRUD from "./useCarsCRUD";
import useCRUD from "./useCRUD";

export default function useGlobalSearch(carsApiUrl, otherApiUrl) {
  const { data: carsData, loading: carsLoading } = useCarsCRUD(carsApiUrl);
  const { data: otherData, loading: otherLoading } = useCRUD(otherApiUrl);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);

  useEffect(() => {
    // Combine both data arrays
    const combinedData = [
      ...carsData.map((item) => ({ ...item, source: "cars" })),
      ...otherData.map((item) => ({ ...item, source: "facilities" })),
    ];

    // If searchQuery is empty, show all
    if (searchQuery.trim() === "") {
      setFilteredResults(combinedData);
    } else {
      // Filter based on searchQuery matching any string fields
      const lowerQuery = searchQuery.toLowerCase();
      const results = combinedData.filter((item) =>
        Object.values(item).some(
          (value) =>
            typeof value === "string" && value.toLowerCase().includes(lowerQuery)
        )
      );
      setFilteredResults(results);
    }
  }, [searchQuery, carsData, otherData]);

  return {
    searchQuery,
    setSearchQuery,
    filteredResults,
    loading: carsLoading || otherLoading,
  };
}
