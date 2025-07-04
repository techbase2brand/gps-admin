"use client"
import { useRouter } from "next/navigation";
import { useLocalStorageCRUD } from "../hooks/useLocalStorageCRUD";
import { useEffect, useState } from "react";

export default function CarForm() {
  const { data, add, update } = useLocalStorageCRUD("cars");
  const router = useRouter();
//   const { id } = router?.query;

  const [car, setCar] = useState({
    id: Date.now(),
    vin: "",
    yardNo: "",
    slotNo: "",
    trackerNo: "",
  });

//   useEffect(() => {
//     if (id) {
//       const existing = data.find((c) => c.id == id);
//       if (existing) setCar(existing);
//     }
//   }, [id, data]);

  const handleSubmit = (e) => {
    e.preventDefault();
   add(car);
    router.push("/admin/cars");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-96 space-y-4">
        <h1 className="text-xl font-bold text-black">{ "Add Car"}</h1>
        <input
          type="text"
          placeholder="VIN"
          className="border p-2 w-full text-black"
          value={car.vin}
          onChange={(e) => setCar({ ...car, vin: e.target.value })}
        />
        <input
          type="text"
          placeholder="Yard Number "
          className="border p-2 w-full text-black"
          value={car.yardNo}
          onChange={(e) => setCar({ ...car, yardNo: e.target.value })}
        />
        <input
          type="text"
          placeholder="Slot Number"
          className="border p-2 w-full text-black"
          value={car.slotNo}
          onChange={(e) => setCar({ ...car, slotNo: e.target.value })}
        />
        <input
          type="text"
          placeholder="Tracker Number"
          className="border p-2 w-full text-black"
          value={car.trackerNo}
          onChange={(e) => setCar({ ...car, trackerNo: e.target.value })}
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">
          {"Add"}

          {/* {id ? "Update" : "Add"} */}
        </button>
      </form>
    </div>
  );
}
