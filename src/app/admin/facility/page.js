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
  const { data, addItem, deleteItem,updateItem, loading } = useCRUD("facility");
  const { carData } = useCarsCRUD("/api/cars");
  const [searchQuery, setSearchQuery] = useState("");
  console.log("data1data1data1", carData);
  return (
    <div className="flex bg-[#f7f8fb]">
      <Sidebar />
      <div>
        <Navbar title={" Facility Management"} />
        <div className="flex-1 p-4 bg-gray-200 rounded-2xl w-[86vw] h-[92vh]">
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
