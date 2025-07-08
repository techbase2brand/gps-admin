
// "use client";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import useCarsCRUD from "../hooks/useCarsCRUD";

// export default function CarsTable({ searchQuery }) {
//   const { carData, deleteItem } = useCarsCRUD("/api/cars");
//   const router = useRouter();
//   const [deleteId, setDeleteId] = useState(null);
//   const filteredData = carData?.filter((car) =>
//     [car.vin, car?.facilityId, car.slotNo, car.trackerNo].some((field) =>
//       field?.toString().toLowerCase().includes(searchQuery.toLowerCase())
//     )
//   );
//   return (
//     <div>
//       <button
//         onClick={() => router.push("/admin/cars/add")}
//         className="bg-green-500 text-white px-4 py-2 rounded mb-4"
//       >
//         Add Car
//       </button>

//       <table className="min-w-full bg-white border">
//         <thead>
//           <tr>
//             <th className="border px-4 py-2 text-black">VIN</th>
//             <th className="border px-4 py-2 text-black">Yard Name</th>
//             <th className="border px-4 py-2 text-black">Slot No.</th>
//             <th className="border px-4 py-2 text-black">Tracker No.</th>
//             <th className="border px-4 py-2 text-black">Actions</th>
//           </tr>
//         </thead>
//         {filteredData?.length > 0 ? (
//           <tbody>
//             {filteredData?.map((car) => (
//               <tr key={car?.id}>
//                 <td className="border px-4 py-2 text-black">{car?.vin}</td>
//                 <td className="border px-4 py-2 text-black">
//                   {car?.facilityId}
//                 </td>
//                 <td className="border px-4 py-2 text-black">{car?.slotNo}</td>
//                 <td className="border px-4 py-2 text-black">
//                   {car?.trackerNo}
//                 </td>
//                 <td className="border px-4 py-2 space-x-2 text-black">
//                   <button
//                     onClick={() => router.push(`/admin/cars/${car?.id}`)}
//                     className="bg-green-500 text-white px-2 py-1 rounded"
//                   >
//                     View
//                   </button>
//                   <button
//                     onClick={() => router.push(`/admin/cars/${car?.id}`)}
//                     className="bg-blue-500 text-white px-2 py-1 rounded"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => setDeleteId(car.id)}
//                     className="bg-red-500 text-white px-2 py-1 rounded"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         ) : (
//           <h2 className="font-bold mb-2 text-black self-center">
//             No results found:
//           </h2>
//         )}
//       </table>

//       {deleteId && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white p-4 rounded">
//             <p>Are you sure you want to delete?</p>
//             <div className="space-x-2 mt-4">
//               <button
//                 onClick={() => {
//                   deleteItem(deleteId);
//                   setDeleteId(null);
//                 }}
//                 className="bg-red-500 text-white px-4 py-2 rounded"
//               >
//                 Yes
//               </button>
//               <button
//                 onClick={() => setDeleteId(null)}
//                 className="bg-gray-300 px-4 py-2 rounded"
//               >
//                 No
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useCarsCRUD from "../hooks/useCarsCRUD";

export default function CarsTable({ searchQuery }) {
  const { carData, deleteItem, updateTrackerAndStatus } = useCarsCRUD("/api/cars");
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const [trackerInput, setTrackerInput] = useState("");
  const [selectedCarId, setSelectedCarId] = useState(null);

  const selectedCar = carData?.find((car) => car.id === selectedCarId);
console.log("selectedCarselectedCarselectedCar",selectedCar);
  const filteredData = carData?.filter((car) =>
    [car.vin, car?.facilityId, car.slotNo, car.trackerNo].some((field) =>
      field?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleAssignTracker = async () => {
    if (selectedCarId && trackerInput) {
      await updateTrackerAndStatus(selectedCarId, trackerInput, "Assigned");
      setTrackerInput("");
      setSelectedCarId(null);
    }
  };

  const handleToggleStatus = async (car) => {
    const newStatus = car.status === "Assigned" ? "Unassigned" : "Assigned";
    await updateTrackerAndStatus(car.id, car.trackerNo, newStatus);
  };

  return (
    <div>
      <button
        onClick={() => router.push("/admin/cars/add")}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Car
      </button>

      {/* VIN selection and car details */}
      <div className="flex items-start mb-4 space-x-4">
        <select
          value={selectedCarId || ""}
          onChange={(e) => setSelectedCarId(parseInt(e.target.value))}
          className="border border-black placeholder-black px-4 py-2 rounded text-black"
        >
          <option className="text-black" value="">Select VIN</option>
          {carData.map((car) => (
            <option key={car.id} value={car.id}>
              {car.vin}
            </option>
          ))}
        </select>

        {selectedCar && (
          <div className="p-4 border rounded bg-gray-50 text-black">
            <p><strong>VIN:</strong> {selectedCar.vin}</p>
            <p><strong>Model:</strong> {selectedCar.model || "N/A"}</p>
            <p><strong>Status:</strong> {selectedCar.status}</p>
          </div>
        )}

        <input
          type="text"
          placeholder="Enter tracker ID"
          value={trackerInput}
          onChange={(e) => setTrackerInput(e.target.value)}
          className="border border-black px-4 py-2 rounded placeholder-black text-black"
        />

        <button
          onClick={handleAssignTracker}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Assign Tracker
        </button>
      </div>

      {/* Table */}
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-4 py-2 text-black">VIN</th>
            <th className="border px-4 py-2 text-black">Yard Name</th>
            <th className="border px-4 py-2 text-black">Slot No.</th>
            <th className="border px-4 py-2 text-black">Tracker No.</th>
            <th className="border px-4 py-2 text-black">Assigned Date</th>
            <th className="border px-4 py-2 text-black">Status</th>
            <th className="border px-4 py-2 text-black">Actions</th>
          </tr>
        </thead>
        {filteredData?.length > 0 ? (
          <tbody>
            {filteredData?.map((car) => (
              <tr key={car?.id}>
                <td className="border px-4 py-2 text-black">{car?.vin}</td>
                <td className="border px-4 py-2 text-black">{car?.facilityId}</td>
                <td className="border px-4 py-2 text-black">{car?.slotNo}</td>
                <td className="border px-4 py-2 text-black">{car?.trackerNo || "N/A"}</td>
                <td className="border px-4 py-2 text-black">
                  {car?.assignedDate
                    ? new Date(car.assignedDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="border px-4 py-2 text-black">
                  <button
                    onClick={() => handleToggleStatus(car)}
                    className={`px-2 py-1 rounded text-white ${
                      car?.status === "Assigned"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {car?.status || "Unassigned"}
                  </button>
                </td>
                <td className="border px-4 py-2 space-x-2 text-black">
                  <button
                    onClick={() => router.push(`/admin/cars/${car?.id}`)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={() => router.push(`/admin/cars/${car?.id}`)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(car.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        ) : (
          <h2 className="font-bold mb-2 text-black self-center">
            No results found:
          </h2>
        )}
      </table>

      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded">
            <p>Are you sure you want to delete?</p>
            <div className="space-x-2 mt-4">
              <button
                onClick={() => {
                  deleteItem(deleteId);
                  setDeleteId(null);
                }}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Yes
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
