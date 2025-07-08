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

//   return { carData, loading, addItem, updateItem, deleteItem };
// }
"use client";

import { useState, useEffect } from "react";

export default function useCarsCRUD(apiUrl) {
  const [carData, setcarData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl);
      const json = await res.json();
      setcarData(json);
    } catch (err) {
      console.error("Fetch all error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item) => {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      await fetchAll();
      return await res.json();
    } catch (err) {
      console.error("Add item error:", err);
    }
  };

  const updateItem = async (item) => {
    try {
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      await fetchAll();
      return await res.json();
    } catch (err) {
      console.error("Update item error:", err);
    }
  };

  const updateTrackerAndStatus = async (id, trackerNo, status) => {
    try {
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, trackerNo, status, assignedDate: new Date().toISOString() }),
      });
      await fetchAll();
      return await res.json();
    } catch (err) {
      console.error("Update tracker and status error:", err);
    }
  };

  const deleteItem = async (id) => {
    try {
      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchAll();
      return await res.json();
    } catch (err) {
      console.error("Delete item error:", err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [apiUrl]);

  return { carData, loading, addItem, updateItem, deleteItem, updateTrackerAndStatus };
}
