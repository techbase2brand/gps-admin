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

export default function Home() {
  const { data, addItem, deleteItem, loading } = useCRUD("/api/facilities");
  const { carData } = useCarsCRUD("/api/cars");
  const [searchQuery, setSearchQuery] = useState("");
console.log("data1data1data1",carData);
  return (
    <div className="flex bg-[#f7f8fb]">
      <Sidebar />

      <div className="flex-1 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-4 text-black">
            Facility Management
          </h1>
          <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery}  />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          <DashboardCard
            title="Total Facilities"
            count={data?.length}
            iconSrc="/icons/radar.png"
            progressColor="bg-pink-500"
          />
          <DashboardCard
            title="Total Cars"
            count={carData?.length}
            iconSrc="/icons/radar.png"
            progressColor="bg-red-500"
          />
          <DashboardCard
            title="Total Trackers"
            count={5048}
            iconSrc="/icons/radar.png"
            progressColor="bg-gray-500"
          />
          <DashboardCard
            title="Assigned Trackers"
            count={4048}
            iconSrc="/icons/notebook.png"
            progressColor="bg-green-500"
          />
          <DashboardCard
            title="Unassigned Trackers"
            count={1048}
            iconSrc="/icons/notebook-cross.png"
            progressColor="bg-orange-500"
          />
          <DashboardCard
            title="Facilities by Cities"
            count={500}
            iconSrc="/icons/car.png"
            progressColor="bg-blue-500"
          />
        </div>
        {loading ? (
          <div>Loading........</div>
        ) : (
          <FacilityTable
            data={data}
            deleteFacility={deleteItem}
            loading={loading}
            searchQuery={searchQuery}
          />
        )}
      </div>
    </div>
  );
}
