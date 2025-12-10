"use client";

import Sidebar from "../../../components/Layout/Sidebar";
import FacilityForm from "../../../components/FacilityForm";
import useCRUD from "../../../hooks/useCRUD";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function FacilityAddEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, addItem, updateItem } = useCRUD("/api/facilities");
  const [facility, setFacility] = useState(null);

  useEffect(() => {
    if (id !== "add") {
      const found = data.find((item) => String(item.id) === id);
      setFacility(found);
    }
  }, [data, id]);

  

  if (id !== "add" && !facility) return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003F65] mx-auto mb-4"></div>
        <p className="text-[#333333] text-lg">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="flex bg-[#f7f8fb]">
        <Sidebar/>
        <div className=" p-4">
        <h1 className="text-2xl font-bold mb-4 text-black">
        {id === "add" ? "Add Facility" : "Edit Facility"}
        </h1>
        </div>
      <FacilityForm
        defaultValues={id == "add" ? "add" : facility}
        addItem={addItem}
        updateItem={updateItem}
      />
    </div>
  );
}
