"use client";

import Sidebar from "../../../components/Layout/Sidebar";
import useCRUD from "../../../hooks/useCRUD";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CarForm from "../../../components/CarForm";

export default function CarsAddEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, addItem, updateItem } = useCRUD("/api/cars");
  const [facility, setFacility] = useState(null);

  useEffect(() => {
    if (id !== "add") {
      const found = data.find((item) => String(item.id) === id);
      setFacility(found);
    }
  }, [data, id]);

  if (id !== "add" && !facility) return <p>Loading...</p>;

  return (
    <div className="flex bg-[#f7f8fb]">
      <Sidebar />
      <div className=" p-4">
        <h1 className="text-2xl font-bold mb-4 text-black">
          {id === "add" ? "Add Facility" : "Edit Facility"}
        </h1>
      </div>
      <CarForm
        defaultValues={id == "add" ? "add" : facility}
        addItem={addItem}
        updateItem={updateItem}
        existingCars={data}
        closeModal={() => router.push("/admin/cars")}
      />
    </div>
  );
}
