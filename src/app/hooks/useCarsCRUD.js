
// "use client";

// import { useState, useEffect } from "react";

// export default function useCarsCRUD(apiUrl) {
//   const [carData, setcarData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchAll = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch(apiUrl);
//       const json = await res.json();
//       setcarData(json);
//     } catch (err) {
//       console.error("Fetch all error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addItem = async (item) => {
//     try {
//       const res = await fetch(apiUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(item),
//       });
//       await fetchAll();
//       return await res.json();
//     } catch (err) {
//       console.error("Add item error:", err);
//     }
//   };

//   const updateItem = async (item) => {
//     try {
//       const res = await fetch(apiUrl, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(item),
//       });
//       await fetchAll();
//       return await res.json();
//     } catch (err) {
//       console.error("Update item error:", err);
//     }
//   };

//   const updateTrackerAndStatus = async (id, trackerNo, status) => {
//     try {
//       const res = await fetch(apiUrl, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id, trackerNo, status, assignedDate: new Date().toISOString() }),
//       });
//       await fetchAll();
//       return await res.json();
//     } catch (err) {
//       console.error("Update tracker and status error:", err);
//     }
//   };

//   const deleteItem = async (id) => {
//     try {
//       const res = await fetch(apiUrl, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id }),
//       });
//       await fetchAll();
//       return await res.json();
//     } catch (err) {
//       console.error("Delete item error:", err);
//     }
//   };

//   useEffect(() => {
//     fetchAll();
//   }, [apiUrl]);

//   return { carData, loading, addItem, updateItem, deleteItem, updateTrackerAndStatus };
// }

// "use client";

// import { useState, useEffect } from "react";

// export default function useCarsCRUD(storageKey) {
//   const [carData, setcarData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchAll = async () => {
//     try {
//       setLoading(true);
//       const storedData = localStorage.getItem(storageKey);
//       setcarData(storedData ? JSON.parse(storedData) : []);
//     } catch (err) {
//       console.error("Fetch all error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addItem = async (item) => {
//     try {
//       const storedData = localStorage.getItem(storageKey);
//       const currentData = storedData ? JSON.parse(storedData) : [];
//       const newItem = {
//         id: Date.now(),
//         ...item,
//         assignedDate: null,
//         status: "Assigned",
//       };
//       const updatedData = [...currentData, newItem];
//       localStorage.setItem(storageKey, JSON.stringify(updatedData));
//       setcarData(updatedData);
//       return newItem;
//     } catch (err) {
//       console.error("Add item error:", err);
//     }
//   };

//   const updateItem = async (item) => {
//     try {
//       const storedData = localStorage.getItem(storageKey);
//       const currentData = storedData ? JSON.parse(storedData) : [];
//       const updatedData = currentData.map((d) =>
//         d.id === item.id ? { ...d, ...item } : d
//       );
//       localStorage.setItem(storageKey, JSON.stringify(updatedData));
//       setcarData(updatedData);
//       return item;
//     } catch (err) {
//       console.error("Update item error:", err);
//     }
//   };

//   const updateTrackerAndStatus = async (id, trackerNo, status) => {
//     try {
//       const storedData = localStorage.getItem(storageKey);
//       const currentData = storedData ? JSON.parse(storedData) : [];
//       const updatedData = currentData.map((d) =>
//         d.id === id
//           ? { ...d, trackerNo, status, assignedDate: new Date().toISOString() }
//           : d
//       );
//       localStorage.setItem(storageKey, JSON.stringify(updatedData));
//       setcarData(updatedData);
//       return { message: "Tracker and status updated", id };
//     } catch (err) {
//       console.error("Update tracker and status error:", err);
//     }
//   };

//   const deleteItem = async (id) => {
//     try {
//       const storedData = localStorage.getItem(storageKey);
//       const currentData = storedData ? JSON.parse(storedData) : [];
//       const updatedData = currentData.filter((d) => d.id !== id);
//       localStorage.setItem(storageKey, JSON.stringify(updatedData));
//       setcarData(updatedData);
//       return { message: "Deleted", id };
//     } catch (err) {
//       console.error("Delete item error:", err);
//     }
//   };

//   useEffect(() => {
//     fetchAll();
//   }, [storageKey]);

//   return { carData, loading, addItem, updateItem, deleteItem, updateTrackerAndStatus };
// }
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
