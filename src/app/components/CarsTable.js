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
import { IoEyeOutline } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import CarForm from "./CarForm";
import useCRUD from "../hooks/useCRUD";

export default function CarsTable({ searchQuery, assignview }) {
  const {
    carData,
    deleteItem,
    fetchAll,
    updateItem,
    addItem,
    updateTrackerAndStatus,
  } = useCarsCRUD("cars");
  const { data: facilities } = useCRUD("facility");
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const [trackerInput, setTrackerInput] = useState("");
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const openAddModal = () => {
    setEditingCar(null);
    setIsModalOpen(true);
  };

  const openEditModal = (car) => {
    setEditingCar(car);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingCar(null);
    setIsModalOpen(false);
  };

  const selectedCar = carData?.find((car) => car.id === selectedCarId);

  // Helper function to get facility name from facility ID
  const getFacilityName = (facilityId) => {
    const facility = facilities?.find(f => f.id.toString() === facilityId?.toString());
    return facility?.name || 'Unknown Facility';
  };

  // Filter data
  const filteredData = carData?.filter((car) => {
    const facilityName = getFacilityName(car?.facilityId);
    const matchesSearch = [car.vin, facilityName, car.slotNo, car.trackerNo, car.chip].some((field) =>
      field?.toString().toLowerCase().includes(localSearch.toLowerCase())
    );
    const matchesStatus = statusFilter === "all" || car.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReset = () => {
    setLocalSearch("");
    setStatusFilter("all");
  };

  const handleAssignTracker = async () => {
    if (selectedCarId && trackerInput) {
      await updateTrackerAndStatus(selectedCarId, trackerInput, "Assigned");
      setTrackerInput("");
      setSelectedCarId(null);
    }
  };

  // Toggle status removed - status now depends on chip only
  // const handleToggleStatus = async (car) => {
  //   const newStatus = car.status === "Assigned" ? "Unassigned" : "Assigned";
  //   await updateTrackerAndStatus(car?.id, car?.trackerNo, newStatus);
  // };

  return (
    <div>
      {/* Search Bar and Filters */}
      <div className="mb-4 flex justify-between items-center mt-10 mb-10">
        <div className="flex space-x-3 items-center">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-80 px-4 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-[#613EEA]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40 px-4 py-2 mr-4 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#613EEA]"
          >
            <option value="all">All Status</option>
            <option value="Assigned">Assigned</option>
            <option value="Unassigned">Unassigned</option>
          </select>
        </div>
        
        <div>
          <button
            onClick={openAddModal}
            className="px-6 py-2 bg-[#613EEA] text-white rounded-full shadow-md hover:bg-[#5030d0] transition-colors"
          >
            + Add Vehicle
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-end bg-black/50 z-999999">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow p-6 relative transition-transform translate-x-0">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl text-black font-semibold mb-4">
              {editingCar ? "Edit Vehicle" : "Add Vehicle"}
            </h2>
            <CarForm
              defaultValues={editingCar || "add"}
              closeModal={closeModal}
              addItem={addItem}
              updateItem={updateItem}
              fetchAll={fetchAll}
              existingCars={carData}
            />
          </div>
        </div>
      )}

      {/* VIN selection and car details */}
      {assignview && (
        <div className="flex items-start mb-4 space-x-4">
          <select
            value={selectedCarId || ""}
            onChange={(e) => setSelectedCarId(parseInt(e.target.value))}
            className="border border-black placeholder-black px-4 py-2 rounded text-black"
          >
            <option className="text-black" value="">
              Select VIN
            </option>
            {carData.map((car) => (
              <option key={car.id} value={car.id}>
                {car.vin}
              </option>
            ))}
          </select>

          {selectedCar && (
            <div className="p-4 border rounded bg-gray-50 text-black">
              <p>
                <strong>VIN:</strong> {selectedCar.vin}
              </p>
              <p>
                <strong>Model:</strong> {selectedCar.model || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {selectedCar.status}
              </p>
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
      )}

      {/* Table */}
      <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
        <thead>
          <tr className="text-left border-b bg-gray-300">
            <th className="text-start px-4 py-2 text-black">VIN</th>
            <th className="text-start px-4 py-2 text-black">Chip</th>
            <th className="text-start px-4 py-2 text-black">Yard Name</th>
            <th className="text-start px-4 py-2 text-black">Slot No.</th>
            {assignview && (
              <th className="text-start px-4 py-2 text-black">Tracker No.</th>
            )}
            {assignview && (
              <th className="text-start px-4 py-2 text-black">Assigned Date</th>
            )}
            <th className="text-start px-4 py-2 text-black">Status</th>
            <th className="text-start px-4 py-2 text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData?.map((car) => (
            <tr key={car?.id} className="border-b border-gray-300">
              <td className="text-start px-4 py-2 text-black">{car?.vin}</td>
              <td className="text-start px-4 py-2 text-black">{car?.chip}</td>
              <td className="text-start px-4 py-2 text-black">
                {getFacilityName(car?.facilityId)}
              </td>
              <td className="text-start px-4 py-2 text-black">
                {car?.slotNo}
              </td>
              {assignview && (
                <td className="text-start px-4 py-2 text-black">
                  {car?.trackerNo || "N/A"}
                </td>
              )}
              {assignview && (
                <td className="text-start px-4 py-2 text-black">
                  {car?.assignedDate
                    ? new Date(car?.assignedDate).toLocaleDateString()
                    : "N/A"}
                </td>
              )}
              <td className="text-start px-4 py-2 text-black">
                <span
                  className={`px-4 py-1 rounded-full inline-block ${
                    car?.status === "Assigned"
                      ? "bg-green-100  text-green-500"
                      : "bg-red-100  text-red-500"
                  }`}
                >
                  {car?.status || "Unassigned"}
                </span>
              </td>
              <td className=" px-4 py-2 space-x-2 text-black">
                <button
                 onClick={() => {
                    const query = new URLSearchParams({
                      id: car.id,
                    }).toString();
                    router.push(`/admin/cars/view/${car.id}`);
                  }}
                  // onClick={() => router.push(`/admin/cars/${car?.id}`)}
                  className=" px-2 py-2 rounded"
                >
                  <IoEyeOutline size={20} className="text-black" />
                </button>
                <button
                  onClick={() => openEditModal(car)}
                  // onClick={() => router.push(`/admin/cars/${car?.id}`)}
                  className="px-2 py-2 rounded"
                >
                  <FiEdit size={16} className="text-green-500" />
                </button>
                <button
                  onClick={() => setDeleteId(car.id)}
                  className="px-2 py-2 rounded"
                >
                  <MdDeleteOutline size={20} className="text-red-500" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredData?.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">No vehicles found</p>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50  flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
            {/* <h3 className="text-lg text-black font-semibold mb-4">
                          Confirm Delete
                        </h3> */}
            <p className="mb-6 text-black">Are you sure you want to delete?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-green-500 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteItem(deleteId);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
