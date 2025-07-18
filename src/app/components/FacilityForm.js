"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FacilityForm({ defaultValues, addItem, updateItem }) {
  const router = useRouter();
  console.log("defaultValuesdefaultValuesdefaultValues", defaultValues);
  const [form, setForm] = useState({
    name: "" || defaultValues?.name,
    number: "" || defaultValues?.number,
    city: "" || defaultValues?.city,
    address: "" || defaultValues?.address,
    lat: "" || defaultValues?.lat,
    long: "" || defaultValues?.long,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    // Add event prevent default
    e.preventDefault();

    if (defaultValues == "add") {
      await addItem(form);
    } else {
      await updateItem({ id: Number(defaultValues?.id), ...form });
    }

    router.push("/admin/facility"); // Navigate after submit
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow w-96 space-y-4"
      >
        <input
          name="name"
          placeholder="Facility Name"
          className="border p-2 w-full text-black"
          value={form.name}
          onChange={handleChange}
        />
        <input
          name="number"
          placeholder="Facility Number"
          className="border p-2 w-full text-black"
          value={form.number}
          onChange={handleChange}
        />
        <input
          name="city"
          placeholder="city"
          className="border p-2 w-full text-black"
          value={form.city}
          onChange={handleChange}
        />
        <input
          name="address"
          placeholder="Facility Address"
          className="border p-2 w-full text-black"
          value={form.address}
          onChange={handleChange}
        />

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 w-full rounded"
        >
          {defaultValues == "add" ? "Add Facility" : " Edit Facility"}
        </button>
      </form>
    </div>
  );
}
