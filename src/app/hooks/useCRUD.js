// "use client";

// import { useState, useEffect } from "react";

// export default function useCRUD(apiUrl) {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchAll = async () => {
//     setLoading(true);
//     const res = await fetch(apiUrl);
//     const json = await res.json();
//     setData(json);
//     setLoading(false);
//   };

//   const addItem = async (item) => {
//     const res = await fetch(apiUrl, {
//       method: "POST",
//       body: JSON.stringify(item),
//     });
//     await fetchAll();
//     return await res.json();
//   };

//   const updateItem = async (item) => {
//     const res = await fetch(apiUrl, {
//       method: "PUT",
//       body: JSON.stringify(item),
//     });
//     await fetchAll();
//     return await res.json();
//   };

//   const deleteItem = async (id) => {
//     const res = await fetch(apiUrl, {
//       method: "DELETE",
//       body: JSON.stringify({ id }),
//     });
//     await fetchAll();
//     return await res.json();
//   };

//   useEffect(() => {
//     fetchAll();
//   }, []);

//   return { data, loading, addItem, updateItem, deleteItem };
// }


"use client";

import { useState, useEffect } from "react";

export default function useCRUD(storageKey) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    setLoading(true);
    const storedData = localStorage.getItem(storageKey);
    setData(storedData ? JSON.parse(storedData) : []);
    setLoading(false);
  };

  const addItem = async (item) => {
    const newItem = { id: Date.now(), ...item };
    const updatedData = [...data, newItem];
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
    setData(updatedData);
    return newItem;
  };

  const updateItem = async (item) => {
    const updatedData = data.map((d) => (d.id === item.id ? { ...d, ...item } : d));
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
    setData(updatedData);
    return item;
  };

  const deleteItem = async (id) => {
    const updatedData = data.filter((d) => d.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
    setData(updatedData);
    return { message: "Deleted", id };
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { data, loading, addItem, updateItem, deleteItem };
}
