// import Sidebar from "../../components/Layout/Sidebar";
// import dynamic from "next/dynamic";

// const Map = dynamic(() => import("../../components/ParkingYardsMap"), { ssr: false });

// export default function Dashboard() {
//   return (
//     <div className="flex">
//       <Sidebar />
//       <div className="flex-1 p-4">
//         <h1 className="text-2xl font-bold mb-4">Parking Yards</h1>
//         <Map />
//       </div>
//     </div>
//   );
// }
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

  // Debug: Check status counts
  const assignedCount = carData?.filter((car) => car?.status === "Assigned")?.length || 0;
  const unassignedCount = carData?.filter((car) => car?.status === "Unassigned")?.length || 0;
  
  console.log("=== Dashboard Debug ===");
  console.log("Total Cars:", carData?.length);
  console.log("Assigned Count:", assignedCount);
  console.log("Unassigned Count:", unassignedCount);
  console.log("All Cars Status:", carData?.map(car => ({ vin: car.vin, chip: car.chip, status: car.status })));

  const toggleSidebar = () => setCollapsed(!collapsed);
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
          className={`flex-1 p-4 bg-gray-200 rounded-2xl ${
            collapsed ? "w-[95vw]" : "w-[87vw]"
          } min-h-[calc(100vh-80px)] overflow-y-auto`}
        >
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#613EEA] flex items-center justify-center text-bold text-white px-4 py-2 gap-2 rounded-full my-4"
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
                      className="px-4 py-2 rounded bg-gray-300 text-black"
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
                      className="px-4 py-2 rounded bg-[#613EEA] text-white"
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
              iconSrc={<FaBuilding size={24} className="text-blue-500" />}
              progressColor="bg-blue-500"
            />
            <DashboardCard
              title="Total Cars"
              count={carData?.length}
              iconSrc={<FaCar size={24} className="text-purple-600" />}
              progressColor="bg-purple-600"
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
              iconSrc={<FaUsers size={24} className="text-orange-500" />}
              progressColor="bg-orange-500"
            />
          </div>
          {loading ? (
            <div>Loading........</div>
          ) : (
            <>
              <div className="flex flex-wrap gap-6 p-6 bg-gray-200">
                {/* Recent Added Facility */}
                <div className="bg-white rounded-xl p-6 flex-1 min-w-[350px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-black">
                      Recent added Facility
                    </h2>
                    <div className="flex items-center gap-4">
                      {/* <FiSearch className="text-gray-500" />
                      <FiFilter className="text-gray-500" /> */}
                    </div>
                  </div>
                  {/* <button className="flex items-center gap-2 bg-[#613EEA] text-white font-600 px-4 py-2 rounded-full mb-4">
                  <FiPlus />
                  Add Facility
                </button> */}
                  {data?.length > 0 ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-sm font-bold text-gray-600 border-b">
                          <th className="py-2">Name</th>
                          <th className="py-2 px-8">Number</th>
                          <th className="py-2">City</th>
                          <th className="py-2 px-8">Address</th>
                          <th className="py-2 px-8">Parking Slots</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.map((f, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 flex  text-black items-center gap-2">
                              {f.name || '-'}
                            </td>
                            <td className="py-2 text-black  px-8">
                              {f.number || '-'}
                            </td>
                            <td className="py-2 flex  text-black items-center gap-2">
                              {f.city || '-'}
                            </td>
                            <td className="py-2 text-black px-8">
                              {f.address || '-'}
                            </td>
                            <td className="py-2 text-black px-8">
                              {f.parkingSlots || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-black">No Data Found :</div>
                  )}
                </div>

                {/* Todos */}
                <div className="bg-white rounded-xl p-6 flex-1 min-w-[300px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-black">Vehicles</h2>
                    <div className="flex items-center gap-4">
                      {/* <FiPlus className="text-gray-500" />
                      <FiFilter className="text-gray-500" /> */}
                    </div>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-sm font-bold text-gray-600 border-b">
                        <th className="py-2">Vin</th>
                        <th className="py-2 px-8">Chip</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carData?.map((f, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2 flex  text-black items-center gap-2">
                            {f.vin}
                          </td>
                          <td className="py-2 text-black  px-8">{f.chip}</td>
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
