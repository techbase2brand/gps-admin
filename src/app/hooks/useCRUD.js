"use client";

import { useState, useEffect } from "react";

export default function useCRUD(apiUrl) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch(apiUrl);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const addItem = async (item) => {
    const res = await fetch(apiUrl, {
      method: "POST",
      body: JSON.stringify(item),
    });
    await fetchAll();
    return await res.json();
  };

  const updateItem = async (item) => {
    const res = await fetch(apiUrl, {
      method: "PUT",
      body: JSON.stringify(item),
    });
    await fetchAll();
    return await res.json();
  };

  const deleteItem = async (id) => {
    const res = await fetch(apiUrl, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    await fetchAll();
    return await res.json();
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { data, loading, addItem, updateItem, deleteItem };
}
