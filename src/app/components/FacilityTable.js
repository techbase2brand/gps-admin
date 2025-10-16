// "use client";

// export default function FacilityTable({ data, deleteFacility }) {
//   return (
//     <table border="1" cellPadding="5">
//       <thead>
//         <tr>
//           <th>Number</th>
//           <th>Address</th>
//           <th>Lat</th>
//           <th>Long</th>
//           <th>Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//         {data.map((facility) => (
//           <tr key={facility.id}>
//             <td>{facility.number}</td>
//             <td>{facility.address}</td>
//             <td>{facility.lat}</td>
//             <td>{facility.long}</td>
//             <td>
//               <button>Edit</button>
//               <button onClick={() => deleteFacility(facility.id)}>Delete</button>
//               <button>View</button>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

"use client";
import { useRouter } from "next/navigation";
import { useLocalStorageCRUD } from "../hooks/useLocalStorageCRUD";
import { useState } from "react";
import { IoEyeOutline } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import useCRUD from "../hooks/useCRUD";
import useCarsCRUD from "../hooks/useCarsCRUD";
import FacilityForm from "./FacilityForm";

export default function FacilityTable({
  data,
  addItem,
  updateItem,
  deleteFacility,
  searchQuery,
  loading,
}) {
  const router = useRouter();
  const { carData, deleteItem: deleteCar } = useCarsCRUD("cars");
  const [deleteId, setDeleteId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [localSearch, setLocalSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState(null);

  const openAddModal = () => {
    setEditingFacility(null);
    setIsModalOpen(true);
  };

  const openEditModal = (facility) => {
    setEditingFacility(facility);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingFacility(null);
    setIsModalOpen(false);
  };

  // Get unique cities
  const uniqueCities = [...new Set(data?.map(f => f.city).filter(Boolean))];

  // Filter data
  const filteredData = data?.filter((facility) => {
    const matchesSearch = [facility.name, facility.number, facility.city, facility.address].some(
      (field) => field?.toString().toLowerCase().includes(localSearch.toLowerCase())
    );
    const matchesCity = cityFilter === "all" || facility.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const handleReset = () => {
    setLocalSearch("");
    setCityFilter("all");
  };

  // Helper function to get vehicles in a facility
  const getVehiclesInFacility = (facilityId) => {
    return carData?.filter(car => car.facilityId?.toString() === facilityId?.toString()) || [];
  };

  // Enhanced deletion handler
  const handleDeleteFacility = async (facilityId) => {
    const facility = data?.find(f => f.id === facilityId);
    const vehiclesInFacility = getVehiclesInFacility(facilityId);
    
    if (vehiclesInFacility.length > 0) {
      // Show custom confirmation modal with vehicle details
      setFacilityToDelete({ facility, vehicles: vehiclesInFacility });
      setShowDeleteConfirm(true);
    } else {
      // No vehicles, proceed with normal deletion
      await deleteFacility(facilityId);
      setDeleteId(null);
    }
  };

  // Confirm deletion with vehicles
  const confirmDeleteWithVehicles = async () => {
    if (facilityToDelete) {
      // Delete all vehicles in the facility first
      for (const vehicle of facilityToDelete.vehicles) {
        await deleteCar(vehicle.id);
      }
      // Then delete the facility
      await deleteFacility(facilityToDelete.facility.id);
    }
    
    setShowDeleteConfirm(false);
    setFacilityToDelete(null);
    setDeleteId(null);
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setFacilityToDelete(null);
    setDeleteId(null);
  };

  return (
    <div>
      {/* Search Bar and Filters */}
      <div className="mb-4 flex justify-between items-center mt-10 mb-10">
        <div className="flex space-x-3 items-center">
          <input
            type="text"
            placeholder="Search facilities..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-80 px-4 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-[#613EEA]"
          />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-40 px-4 py-2 mr-4 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#613EEA]"
          >
            <option value="all">All Cities</option>
            {uniqueCities.map((city, idx) => (
              <option key={idx} value={city}>{city}</option>
            ))}
          </select>
        </div>
        
        <div>
          <button
            onClick={openAddModal}
            className="px-6 py-2 bg-[#613EEA] text-white rounded-full shadow-md hover:bg-[#5030d0] transition-colors"
          >
            + Add Facility
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
              {editingFacility ? "Edit Facility" : "Add Facility"}
            </h2>
            <FacilityForm
              defaultValues={editingFacility || "add"}
              addItem={addItem}
              updateItem={updateItem}
              
              closeModal={closeModal}
            />
          </div>
        </div>
      )}
      <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
        <thead>
          <tr className="text-left border-b bg-gray-300">
            <th className="px-4 text-start  py-2 text-black">Name</th>
            <th className=" px-4 text-start py-2 text-black">Number</th>
            <th className="px-4 text-start  py-2 text-black">City</th>
            <th className="px-4 text-start  py-2 text-black">Address</th>
            <th className="px-4 text-start  py-2 text-black">Parking Slots</th>
            <th className="px-4 text-start  py-2 text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...filteredData]?.reverse()?.map((facility) => (
            <tr key={facility?.id} className="border-b border-gray-300">
              <td className=" px-4 py-2 text-black">{facility?.name || '-'}</td>
              <td className=" px-4 py-2 text-black">{facility?.number || '-'}</td>
              <td className=" px-4 py-2 text-black">{facility?.city || '-'}</td>
              <td className=" px-4 py-2 w-[30%] text-black">
                {facility?.address || '-'}
              </td>
              <td className=" px-4 py-2 text-black">
                {facility?.parkingSlots || '-'}
              </td>
              <td className=" px-4 py-2 space-x-2 text-black">
                <button
                  onClick={() => {
                    const query = new URLSearchParams({
                      id: facility.id,
                      name: facility.name,
                      address: facility.address,
                      // add more if needed
                    }).toString();
                    router.push(`/admin/facility/view/${facility.id}`);
                  }}
                  className=" px-2 py-2 rounded"
                >
                  <IoEyeOutline size={20} className="text-black" />
                </button>
                <button
                  onClick={() => openEditModal(facility)}
                  // onClick={() =>
                  //   router.push(`/admin/facility/${facility?.id}`)
                  // }
                  className=" px-2 py-2 rounded"
                >
                  <FiEdit size={16} className="text-green-500" />
                </button>
                <button
                  onClick={() => setDeleteId(facility?.id)}
                  className=" px-2 py-2 rounded"
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
          <p className="text-gray-500 text-lg">No facilities found</p>
        </div>
      )}

      {/* Regular delete confirmation */}
      {deleteId && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50  flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
            <p className="mb-6 text-black">Are you sure you want to delete this facility?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFacility(deleteId)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced delete confirmation with vehicles */}
      {showDeleteConfirm && facilityToDelete && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
            <h3 className="text-lg text-black font-semibold mb-4">
              Delete Facility with Vehicles
            </h3>
            <div className="mb-4">
              <p className="text-black mb-2">
                <strong>Facility:</strong> {facilityToDelete.facility.name}
              </p>
              <p className="text-red-600 mb-4">
                <strong>Warning:</strong> This facility contains {facilityToDelete.vehicles.length} vehicle(s). 
                Deleting the facility will also delete all vehicles in it.
              </p>
              
              {/* Show vehicle list */}
              <div className="max-h-40 overflow-y-auto border rounded p-2 mb-4">
                <p className="text-sm font-semibold text-black mb-2">Vehicles to be deleted:</p>
                {facilityToDelete.vehicles.map((vehicle, index) => (
                  <div key={vehicle.id} className="text-sm text-gray-700 py-1">
                    {index + 1}. VIN: {vehicle.vin} | Chip: {vehicle.chip} | Slot: {vehicle.slotNo}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWithVehicles}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
