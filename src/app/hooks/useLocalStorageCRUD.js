"use client"
import { useState, useEffect } from 'react';

export const useLocalStorageCRUD = (key) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) setData(JSON.parse(stored));
  }, [key]);

  const saveData = (newData) => {
    setData(newData);
    localStorage.setItem(key, JSON.stringify(newData));
  };

  const add = (item) => {
    const updated = [...data, item];
    saveData(updated);
  };

  const update = (id, updatedItem) => {
    const updated = data.map((item) =>
      item.id === id ? { ...item, ...updatedItem } : item
    );
    saveData(updated);
  };

  const remove = (id) => {
    const updated = data.filter((item) => item.id !== id);
    saveData(updated);
  };

  return { data, add, update, remove };
};
