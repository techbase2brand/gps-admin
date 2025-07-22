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
import FacilityForm from "../../components/FacilityForm";
import FacilityTable from "../../components/FacilityTable";
import useCRUD from "../../hooks/useCRUD";
import DashboardCard from "../../components/DashboardCard";
import Header from "../../components/Layout/Header";
import { useState } from "react";
import useCarsCRUD from "../../hooks/useCarsCRUD";
import { FiPlus, FiSearch, FiFilter } from "react-icons/fi";
import { FiCalendar } from "react-icons/fi";
import { FaCar, FaMicrochip, FaParking } from "react-icons/fa";
import { CiMicrochip } from "react-icons/ci";
import { HiChip } from "react-icons/hi";
import Navbar from "../../components/Layout/Navbar";

const todos = [
  { task: "Check Inventory", color: "bg-purple-600" },
  { task: "Manage Delivery Team", color: "bg-purple-600" },
  { task: "Contact Selma: Confirm Delivery", color: "bg-orange-500" },
  { task: "Update Shop Catalogue", color: "bg-purple-600" },
  { task: "Count Profit Analytics", color: "bg-orange-500" },
];

export default function Home() {
  const { data, addItem, deleteItem, loading } = useCRUD("facility");
  const { carData } = useCarsCRUD("cars");
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <div className="flex bg-[#fff]">
      <Sidebar />

      <div>
        <Navbar title={"Dashboard"} />
        <div className="flex-1 p-4 bg-gray-200 rounded-2xl w-[86vw] h-[92vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 p-4">
            <DashboardCard
              title="Total Facilities"
              count={data?.length}
              iconSrc={<FaParking size={24} className="text-pink-500" />}
              progressColor="bg-pink-500"
            />
            <DashboardCard
              title="Total Cars"
              count={carData?.length}
              iconSrc={<FaCar size={24} className="text-purple-600" />}
              progressColor="bg-red-500"
            />
            <DashboardCard
              title="Total Trackers"
              count={5048}
              iconSrc={<HiChip size={24} className="text-gray-500" />}
              progressColor="bg-gray-500"
            />
            <DashboardCard
              title="Assigned Trackers"
              count={carData?.filter(car => car?.status === "Assigned")?.length}
              iconSrc={<FaMicrochip size={24} className="text-green-500" />}
              progressColor="bg-green-500"
            />
            <DashboardCard
              title="Unassigned Trackers"
              count={carData?.filter(car => car?.status === "Unassigned")?.length}
              iconSrc={<FaMicrochip size={24} className="text-red-500" />}
              progressColor="bg-orange-500"
            />
            <DashboardCard
              title="Facilities by Cities"
              count={data?.length}
              iconSrc={<FaParking size={24} className="text-blue-600" />}
              progressColor="bg-blue-500"
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
                          <th className="py-2 px-8">address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.map((f, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 flex  text-black items-center gap-2">
                              {f.name}
                            </td>
                            <td className="py-2 text-black  px-8">
                              {f.number}
                            </td>
                            <td className="py-2 flex  text-black items-center gap-2">
                              {f.city}
                            </td>
                            <td className="py-2 text-black px-8">
                              {f.address}
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
                          <td className={`py-2 flex   h-6 px-6 w-32 ${f?.status =="Assigned" ? 'text-green-500 bg-green-100':  'text-red-500 bg-red-100'}  rounded-full items-center gap-2`}>
                             {f?.status || "Unassigned"}
                          </td>
                          {/* <td className="py-2 text-black px-8">{f.address}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* <ul className="space-y-3">
                    {todos?.map((todo, idx) => (
                      <li
                        key={idx}
                        className="flex items-center bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <span className={`w-2 h-full ${todo.color}`}></span>
                        <div className="flex-1 px-4 py-3 text-black">
                          {todo.task}
                        </div>
                        <FiFilter className="text-gray-500 mx-3" />
                      </li>
                    ))}
                  </ul> */}
                </div>
              </div>
            </>
            // <FacilityTable
            //   data={data}
            //   deleteFacility={deleteItem}
            //   loading={loading}
            //   searchQuery={searchQuery}
            // />
          )}
        </div>
      </div>
    </div>
  );
}
