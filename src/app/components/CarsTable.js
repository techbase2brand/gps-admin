"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useCarsCRUD from "../hooks/useCarsCRUD";
import { IoEyeOutline } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import CarForm from "./CarForm";
import useCRUD from "../hooks/useCRUD";

export default function CarsTable({ searchQuery, assignview, from }) {

  const { data: facilities } = useCRUD("facility");
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const [trackerInput, setTrackerInput] = useState("");
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });

  const {
    carData,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalCount,
    deleteItem,
    fetchAll,
    updateItem,
    addItem,
    updateTrackerAndStatus,
  } = useCarsCRUD("cars", {
    search: localSearch,
    status: statusFilter,
    facility: facilityFilter
  });


  useEffect(() => {
    setCurrentPage(1);
  }, [localSearch, statusFilter, facilityFilter]);

  useEffect(() => {
    if (currentPage > 1 && carData.length === 0 ) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [carData, currentPage, setCurrentPage]);



  useEffect(() => {
    if (carData.length > 10) {
      setCurrentPage((prev) => {
        console.log("THE VALUE prev", prev);
        const nextValue = prev + 1;
        console.log("THE VALUE AFTER prev", nextValue);
        return nextValue; 
      });
    }
  }, [carData]);

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
    return facility?.name || '-';
  };

  // Handle column sorting
  const handleSort = (column) => {
    let direction = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };

  // Filter data
  // const filteredData = carData?.filter((car) => {
  //   const facilityName = getFacilityName(car?.facilityId);
  //   const matchesSearch = [car.vin, facilityName, car.slotNo, car.trackerNo, car.chip].some((field) =>
  //     field?.toString().toLowerCase().includes(localSearch.toLowerCase())
  //   );
  //   const matchesStatus = statusFilter === "all" || car.status === statusFilter;
  //   const matchesFacility = facilityFilter === "all" || car?.facilityId?.toString() === facilityFilter;
  //   return matchesSearch && matchesStatus && matchesFacility;
  // });


  const filteredData = carData?.filter((car) => {
    const matchesStatus = statusFilter === "all" || car.status === statusFilter;
    return matchesStatus;
  });


  //pagination logic
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Sort data
  const sortedData = [...(carData || [])].sort((a, b) => {
    if (!sortConfig.column) return 0;

    let aValue, bValue;

    switch (sortConfig.column) {
      case 'vin':
        aValue = a.vin || '';
        bValue = b.vin || '';
        break;
      case 'chip':
        aValue = a.chip || '';
        bValue = b.chip || '';
        break;
      case 'facility':
        aValue = getFacilityName(a?.facilityId) || '';
        bValue = getFacilityName(b?.facilityId) || '';
        break;
      case 'slotNo':
        aValue = parseInt(a.slotNo) || 0;
        bValue = parseInt(b.slotNo) || 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      case 'status':
        aValue = a.status || 'Unassigned';
        bValue = b.status || 'Unassigned';
        break;
      default:
        return 0;
    }

    if (sortConfig.column === 'slotNo') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  const handleReset = () => {
    setLocalSearch("");
    setStatusFilter("all");
    setFacilityFilter("all");
    setSortConfig({ column: null, direction: 'asc' });
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
      {!from && <div className="mb-4 flex justify-between items-center mt-10 mb-10">
        <div className="flex space-x-3 items-center">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-80 px-4 py-2 border  bg-white border-gray-300 rounded-lg text-[#333333] placeholder-[#666666] focus:outline-none focus:border-black"
          />

          {/* <div className="relative w-40 mr-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg text-[#333333] focus:outline-none focus:border-black appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="Assigned">Assigned</option>
              <option value="Unassigned">Unassigned</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div> */}

          <div className="relative w-48 mr-4">
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg text-[#333333] focus:outline-none focus:border-black appearance-none bg-white"
            >
              <option value="all">All Facilities</option>
              {facilities?.map((facility) => (
                <option key={facility.id} value={facility.id.toString()}>
                  {facility.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {(localSearch || statusFilter !== "all" || facilityFilter !== "all" || sortConfig.column) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-[#666666] text-[#333333] rounded-lg hover:bg-[#F8F8F8] transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div>

          <button
            onClick={openAddModal}
            className="px-6 py-2 bg-black text-white rounded-full shadow-md hover:bg-black transition-colors"
          >
            Add Vehicle
          </button>

        </div>

      </div>}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-end bg-black/50 z-999999">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow p-6 relative transition-transform translate-x-0">
            <button
              onClick={closeModal}
              className="absolute top-5 right-8 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl text-[#333333] font-semibold mb-4">
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
            className="border border-black placeholder-black px-4 py-2 rounded text-[#333333]"
          >
            <option className="text-[#333333]" value="">
              Select VIN
            </option>
            {carData.map((car) => (
              <option key={car.id} value={car.id}>
                {car.vin}
              </option>
            ))}
          </select>

          {selectedCar && (
            <div className="p-4 border rounded bg-gray-50 text-[#333333]">
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
            className="border border-black px-4 py-2 rounded placeholder-black text-[#333333]"
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
          <tr className="text-left border-b bg-black">
            <th className="text-start px-4 py-2 text-white rounded-tl-lg">
              VIN
            </th>
            <th className="text-start px-4 py-2 text-white ">
              Chip
            </th>
            <th className="text-start px-4 py-2 text-white ">
              Yard Name
            </th>
            <th
              className="text-start px-4 py-2 text-white  cursor-pointer select-none"
              onClick={() => handleSort('slotNo')}
            >
              <div className="flex items-center gap-2">
                Slot No.
                {sortConfig.column === 'slotNo' && (
                  <span className="text-black">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            {assignview && (
              <th className="text-start px-4 py-2 text-white ">Tracker No.</th>
            )}
            {assignview && (
              <th className="text-start px-4 py-2 text-white ">Assigned Date</th>
            )}
            <th
              className="text-start px-4 py-2 text-white  cursor-pointer select-none"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                Status
                {sortConfig.column === 'status' && (
                  <span className="text-black">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th className="text-start px-4 py-2 text-white rounded-tr-lg">Actions</th>
          </tr>
        </thead>
        <tbody>

          {sortedData?.map((car) => (
            <tr key={car?.id} className="border-b border-gray-300">
              <td className="text-start px-4 py-2 text-[#333333]">{car?.vin || "-"}</td>
              <td className="text-start px-4 py-2 text-[#333333]">{car?.chip || "-"}</td>
              <td className="text-start px-4 py-2 text-[#333333]">
                {getFacilityName(car?.facilityId) || "-"}
              </td>
              <td className="text-start px-4 py-2 text-[#333333]">
                {car?.slotNo || "-"}
              </td>
              {assignview && (
                <td className="text-start px-4 py-2 text-[#333333]">
                  {car?.trackerNo || "N/A"}
                </td>
              )}
              {assignview && (
                <td className="text-start px-4 py-2 text-[#333333]">
                  {car?.assignedDate
                    ? new Date(car?.assignedDate).toLocaleDateString()
                    : "N/A"}
                </td>
              )}
              <td className="text-start px-4 py-2 text-[#333333]">
                <span
                  className={`px-4 py-1 rounded-full inline-block ${car?.status === "Assigned"
                    ? "bg-green-100  text-green-500"
                    : "bg-red-100  text-red-500"
                    }`}
                >
                  {car?.status || "Unassigned"}
                </span>
              </td>
              <td className=" px-4 py-2 space-x-2 text-[#333333]">
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
                  <IoEyeOutline size={20} className="text-[#333333]" />
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

      {/* Pagination Controls */}
      {totalPages > 1 && <div className="flex justify-between items-center p-4 bg-white border border-gray-300 rounded-b-lg">
        <p className="text-black text-sm">
          { }
          Page {currentPage} of {totalPages || 1}
        </p>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-4 py-2 border rounded text-black disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-4 py-2 border rounded text-black disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>}

      {sortedData?.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="text-center">

            <p className="text-[#333333] text-lg">No Vehicle</p>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50  flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
            <h3 className="text-lg text-[#333333] font-semibold mb-4">
                          Confirm Delete
                        </h3>
            <p className="mb-6 text-[#333333]">Are you sure you want to delete?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-lg rounded"
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
