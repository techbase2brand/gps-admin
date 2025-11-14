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
import Navbar from "../../components/Layout/Navbar";

export default function Home() {
  const { data, addItem, deleteItem, updateItem, loading } =
    useCRUD("facility");
  const { carData } = useCarsCRUD("/api/cars");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);
  return (
    <div className="flex bg-[#fff] min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 min-h-screen bg-[#fff]">
        <Navbar
          title={" Facility Management"}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
        />
        <div
          className={`flex-1 p-4 bg-gray-200 rounded-2xl ${
            collapsed ? "w-[95vw]" : "w-[86vw]"
          } min-h-[calc(100vh-80px)]`}
        >
          {loading ? (
            <div>Loading........</div>
          ) : (
            <FacilityTable
              data={data}
              deleteFacility={deleteItem}
              addItem={addItem}
              loading={loading}
              updateItem={updateItem}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>
    </div>
  );
}
