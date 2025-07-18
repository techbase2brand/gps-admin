// "use client"
// import { useRouter } from "next/navigation";
// import { useLocalStorageCRUD } from "../hooks/useLocalStorageCRUD";
// import { useEffect, useState } from "react";

// export default function CarForm() {
//   const { data, add, update } = useLocalStorageCRUD("cars");
//   const router = useRouter();
// //   const { id } = router?.query;

//   const [car, setCar] = useState({
//     id: Date.now(),
//     vin: "",
//     yardNo: "",
//     slotNo: "",
//     trackerNo: "",
//   });

// //   useEffect(() => {
// //     if (id) {
// //       const existing = data.find((c) => c.id == id);
// //       if (existing) setCar(existing);
// //     }
// //   }, [id, data]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//    add(car);
//     router.push("/admin/cars");
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-96 space-y-4">
//         <h1 className="text-xl font-bold text-black">{ "Add Car"}</h1>
//         <input
//           type="text"
//           placeholder="VIN"
//           className="border p-2 w-full text-black"
//           value={car.vin}
//           onChange={(e) => setCar({ ...car, vin: e.target.value })}
//         />
//         <input
//           type="text"
//           placeholder="Yard Number "
//           className="border p-2 w-full text-black"
//           value={car.yardNo}
//           onChange={(e) => setCar({ ...car, yardNo: e.target.value })}
//         />
//         <input
//           type="text"
//           placeholder="Slot Number"
//           className="border p-2 w-full text-black"
//           value={car.slotNo}
//           onChange={(e) => setCar({ ...car, slotNo: e.target.value })}
//         />
//         <input
//           type="text"
//           placeholder="Tracker Number"
//           className="border p-2 w-full text-black"
//           value={car.trackerNo}
//           onChange={(e) => setCar({ ...car, trackerNo: e.target.value })}
//         />
//         <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">
//           {"Add"}

//           {/* {id ? "Update" : "Add"} */}
//         </button>
//       </form>
//     </div>
//   );
// }

"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useCRUD from "../hooks/useCRUD";

export default function CarForm({ defaultValues, addItem, updateItem }) {
  const router = useRouter();
  const isEdit = defaultValues !== "add";

  const [car, setCar] = useState({
    vin: "" || defaultValues?.vin,
    chip: "" || defaultValues?.chip,
    yardNo: "" || defaultValues?.yardNo,
    slotNo: "" || defaultValues?.slotNo,
    trackerNo: "" || defaultValues?.trackerNo,
    facilityId: "" || defaultValues?.facilityId,
    model:"" || defaultValues?.model,
    color:"" || defaultValues?.color,

  });
console.log("carss",car,defaultValues);
  const { data: facilities } = useCRUD("/api/facilities");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEdit) {
      console.log("ediit");
      await updateItem({ id: Number(defaultValues?.id), ...car });
      // await updateItem(defaultValues?.id, car);
    } else {
      await addItem(car);
    }
    router.push("/admin/cars");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow w-96 space-y-4"
      >
        <h1 className="text-xl font-bold text-black">
          {isEdit ? "Edit Car" : "Add Car"}
        </h1>

        <input
          type="text"
          placeholder="VIN"
          className="border p-2 w-full text-black"
          value={car.vin}
          onChange={(e) => setCar({ ...car, vin: e.target.value })}
        />
        <input
          type="text"
          placeholder="Chip"
          className="border p-2 w-full text-black"
          value={car.chip}
          onChange={(e) => setCar({ ...car, chip: e.target.value })}
        />

        {/* <input
          type="text"
          placeholder="Owner"
          className="border p-2 w-full text-black"
          value={car.yardNo}
          onChange={(e) => setCar({ ...car, yardNo: e.target.value })}
        /> */}

        <input
          type="text"
          placeholder="Slot Number"
          className="border p-2 w-full text-black"
          value={car.slotNo}
          onChange={(e) => setCar({ ...car, slotNo: e.target.value })}
        />

        <input
          type="text"
          placeholder="Modal"
          className="border p-2 w-full text-black"
          value={car.model}
          onChange={(e) => setCar({ ...car, model: e.target.value })}
        />
         <input
          type="text"
          placeholder="Color"
          className="border p-2 w-full text-black"
          value={car.color}
          onChange={(e) => setCar({ ...car, color: e.target.value })}
        />

        <select
          className="border p-2 w-full text-black"
          value={car.facilityId}
          onChange={(e) => setCar({ ...car, facilityId: e.target.value })}
        >
          <option value="">Select Facility</option>
          {facilities?.map((f) => (
            <option key={f.id} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 w-full rounded"
        >
          {isEdit ? "Update" : "Add"}
        </button>
      </form>
    </div>
  );
}
