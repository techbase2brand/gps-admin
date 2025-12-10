"use client";
import Sidebar from "../../components/Layout/Sidebar";
import useCRUD from "../../hooks/useCRUD";
import DashboardCard from "../../components/DashboardCard";
import { useState } from "react";
import useCarsCRUD from "../../hooks/useCarsCRUD";
import { FaCar, FaMicrochip, FaParking, FaMapMarkerAlt, FaBuilding, FaUsers } from "react-icons/fa";
import { HiChip } from "react-icons/hi";
import Navbar from "../../components/Layout/Navbar";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { data, addItem, deleteItem, loading } = useCRUD("facility");
  const { carData } = useCarsCRUD("cars");
  const { data: staffData } = useCRUD("staff");
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchVin, setSearchVin] = useState("");
  const [facilitySortConfig, setFacilitySortConfig] = useState({ column: null, direction: 'asc' });
  const [vehicleSortConfig, setVehicleSortConfig] = useState({ column: null, direction: 'asc' });
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Debug: Check status counts
  const assignedCount = carData?.filter((car) => car?.status === "Assigned")?.length || 0;
  const unassignedCount = carData?.filter((car) => car?.status === "Unassigned")?.length || 0;
  
  // console.log("=== Dashboard Debug ===");
  // console.log("Total Cars:", carData?.length);
  // console.log("Assigned Count:", assignedCount);
  // console.log("Unassigned Count:", unassignedCount);
  // console.log("All Cars Status:", carData?.map(car => ({ vin: car.vin, chip: car.chip, status: car.status })));

  const toggleSidebar = () => setCollapsed(!collapsed);

  // Helper function to get facility name
  const getFacilityName = (facilityId) => {
    const facility = data?.find(f => f.id.toString() === facilityId?.toString());
    return facility?.name || '-';
  };

  // Handle facility sorting
  const handleFacilitySort = (column) => {
    let direction = 'asc';
    if (facilitySortConfig.column === column && facilitySortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setFacilitySortConfig({ column, direction });
  };

  // Handle vehicle sorting
  const handleVehicleSort = (column) => {
    let direction = 'asc';
    if (vehicleSortConfig.column === column && vehicleSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setVehicleSortConfig({ column, direction });
  };

  // Filter and sort facilities
  const filteredFacilities = data?.filter((facility) => {
    return cityFilter === "all" || facility.city === cityFilter;
  });

  const sortedFacilities = [...(filteredFacilities || [])].sort((a, b) => {
    if (!facilitySortConfig.column) return 0;
    let aValue, bValue;
    switch (facilitySortConfig.column) {
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'city':
        aValue = a.city || '';
        bValue = b.city || '';
        break;
      case 'parkingSlots':
        aValue = parseInt(a.parkingSlots) || 0;
        bValue = parseInt(b.parkingSlots) || 0;
        return facilitySortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      default:
        return 0;
    }
    if (facilitySortConfig.column === 'parkingSlots') {
      return facilitySortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return facilitySortConfig.direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Filter and sort vehicles
  const filteredVehicles = carData?.filter((car) => {
    return statusFilter === "all" || car.status === statusFilter;
  });

  const sortedVehicles = [...(filteredVehicles || [])].sort((a, b) => {
    if (!vehicleSortConfig.column) return 0;
    let aValue, bValue;
    switch (vehicleSortConfig.column) {
      case 'vin':
        aValue = a.vin || '';
        bValue = b.vin || '';
        break;
      case 'chip':
        aValue = a.chip || '';
        bValue = b.chip || '';
        break;
      case 'status':
        aValue = a.status || 'Unassigned';
        bValue = b.status || 'Unassigned';
        break;
      default:
        return 0;
    }
    return vehicleSortConfig.direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Get unique cities
  const uniqueCities = [...new Set(data?.map(f => f.city).filter(Boolean))];
  return (
    <div className="flex bg-[#fff] min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 min-h-screen bg-[#fff]">
        <Navbar
          title={"Dashboard"}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
        />
        <div
          className={`flex-1 p-4 bg-[#F8F8F8] rounded-2xl ${
            collapsed ? "w-[95vw]" : "w-[87vw]"
          } min-h-[calc(100vh-80px)] overflow-y-auto`}
        >
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#003F65] flex items-center justify-center text-bold text-white px-4 py-2 gap-2 rounded-full my-4"
            >
              <FaMapMarkerAlt size={19} className="text-White" /> Track Vehicle
            </button>
            {showModal && (
              <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h2 className="text-xl font-bold text-black mb-4">
                    Track Vehicle
                  </h2>
                  <input
                    type="text"
                    value={searchVin}
                    onChange={(e) => setSearchVin(e.target.value)}
                    placeholder="Enter VIN number"
                    className="border border-gray-300 text-black placeholder-black rounded px-4 py-2 w-full mb-4"
                  />
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded bg-[#F8F8F8] text-[#333333]"
                    >
                      Cancel
                    </button>
                    <button
                      // onClick={() => {
                      //   const item = carData?.find(
                      //     (c) => c?.vin.toLocaleLowerCase() == searchVin
                      //   );
                      //   if (item) {
                      //     router.push(`/admin/cars/view/${item.id}`);
                      //     setShowModal(false);
                      //   } else {
                      //     alert("Vehicle not found");
                      //   }
                      // }}
                      onClick={() => {
                        const item = carData?.find(
                          (c) =>
                            c?.vin?.toLowerCase() === searchVin.toLowerCase()
                        );
                        if (item) {
                          router.push(`/admin/cars/view/${item.id}`);
                          setShowModal(false);
                        } else {
                          alert("Vehicle not found");
                        }
                      }}
                      className="px-4 py-2 rounded bg-[#003F65] text-white"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 p-4">
            <DashboardCard
              title="Total Facilities"
              count={data?.length}
              iconSrc={<FaBuilding size={24} className="text-[#003F65]" />}
              progressColor="bg-[#003F65]"
            />
            <DashboardCard
              title="Total Cars"
              count={carData?.length}
              iconSrc={<FaCar size={24} className="text-[#003F65]" />}
              progressColor="bg-[#003F65]"
            />
            <DashboardCard
              title="Assigned Trackers"
              count={assignedCount}
              iconSrc={<FaMicrochip size={24} className="text-green-500" />}
              progressColor="bg-green-500"
            />
            <DashboardCard
              title="Unassigned Trackers"
              count={unassignedCount}
              iconSrc={<FaMicrochip size={24} className="text-red-500" />}
              progressColor="bg-red-500"
            />
            <DashboardCard
              title="Total Staff"
              count={staffData?.length || 0}
              iconSrc={<FaUsers size={24} className="text-[#003F65]" />}
              progressColor="bg-[#003F65]"
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px] w-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003F65] mx-auto mb-4"></div>
                <p className="text-[#333333] text-lg">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-6 p-6 bg-[#F8F8F8]">
                {/* Recent Added Facility */}
                <div className="bg-white rounded-xl p-6 flex-1 min-w-[350px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#333333]">
                      Recent added Facility
                    </h2>
                    <div className="flex items-center gap-2">
                      {uniqueCities.length > 0 && (
                        <select
                          value={cityFilter}
                          onChange={(e) => setCityFilter(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-[#333333] focus:outline-none focus:border-[#003F65] appearance-none bg-white"
                        >
                          <option value="all">All Cities</option>
                          {uniqueCities.map((city, idx) => (
                            <option key={idx} value={city}>{city}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  {/* <button className="flex items-center gap-2 bg-[#613EEA] text-white font-600 px-4 py-2 rounded-full mb-4">
                  <FiPlus />
                  Add Facility
                </button> */}
                  {sortedFacilities?.length > 0 ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-sm font-bold text-[#666666] border-b">
                          <th 
                            className="py-2 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleFacilitySort('name')}
                          >
                            <div className="flex items-center gap-1">
                              Name
                              {facilitySortConfig.column === 'name' && (
                                <span className="text-[#003F65] text-xs">
                                  {facilitySortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th className="py-2 px-8">Number</th>
                          <th 
                            className="py-2 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleFacilitySort('city')}
                          >
                            <div className="flex items-center gap-1">
                              City
                              {facilitySortConfig.column === 'city' && (
                                <span className="text-[#003F65] text-xs">
                                  {facilitySortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th className="py-2 px-8">Address</th>
                          <th 
                            className="py-2 px-8 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleFacilitySort('parkingSlots')}
                          >
                            <div className="flex items-center gap-1">
                              Parking Slots
                              {facilitySortConfig.column === 'parkingSlots' && (
                                <span className="text-[#003F65] text-xs">
                                  {facilitySortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedFacilities?.map((f, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 flex  text-[#333333] items-center gap-2">
                              {f.name || '-'}
                            </td>
                            <td className="py-2 text-[#333333]  px-8">
                              {f.number || '-'}
                            </td>
                            <td className="py-2 flex  text-[#333333] items-center gap-2">
                              {f.city || '-'}
                            </td>
                            <td className="py-2 text-[#333333] px-8">
                              {f.address || "-"}
                            </td>
                            <td className="py-2 text-[#333333] px-8">
                              {f.parkingSlots || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-[#333333]">No Data Found :</div>
                  )}
                </div>

                {/* Todos */}
                <div className="bg-white rounded-xl p-6 flex-1 min-w-[300px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#333333]">Vehicles</h2>
                    <div className="flex items-center gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-[#333333] focus:outline-none focus:border-[#003F65] appearance-none bg-white"
                      >
                        <option value="all">All Status</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Unassigned">Unassigned</option>
                      </select>
                    </div>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-sm font-bold text-gray-600 border-b">
                        <th 
                          className="py-2 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleVehicleSort('vin')}
                        >
                          <div className="flex items-center gap-1">
                            Vin
                            {vehicleSortConfig.column === 'vin' && (
                              <span className="text-[#003F65] text-xs">
                                {vehicleSortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-2 px-8 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleVehicleSort('chip')}
                        >
                          <div className="flex items-center gap-1">
                            Chip
                            {vehicleSortConfig.column === 'chip' && (
                              <span className="text-[#003F65] text-xs">
                                {vehicleSortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-2 cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleVehicleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {vehicleSortConfig.column === 'status' && (
                              <span className="text-[#003F65] text-xs">
                                {vehicleSortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedVehicles?.map((f, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2 flex  text-[#333333] items-center gap-2">
                            {f.vin || "-"}
                          </td>
                          <td className="py-2 text-[#333333]  px-8">{f.chip || "-"}</td>
                          <td
                            className={`py-2 flex   h-6 px-6 w-32 ${
                              f?.status == "Assigned"
                                ? "text-green-500 bg-green-100"
                                : "text-red-500 bg-red-100"
                            }  rounded-full items-center gap-2`}
                          >
                            {f?.status || "Unassigned"}
                          </td>
                          {/* <td className="py-2 text-black px-8">{f.address}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
