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
  const { data, addItem, deleteItem, updateItem, loading ,currentPage,setCurrentPage,itemsPerPage,totalCount } =
    useCRUD("facility");
  const { carData } = useCarsCRUD("/api/cars");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [isNavbarLogoutModalOpen, setIsNavbarLogoutModalOpen] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);
  return (
    <div className="flex bg-[#fff] min-h-screen">
      <Sidebar collapsed={collapsed} isLogoutModalOpen={isNavbarLogoutModalOpen} />
      <div className="flex flex-col flex-1 min-h-screen bg-[#fff] w-[84%]">
        <Navbar
          title={" Facility Management"}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
          onLogoutModalChange={setIsNavbarLogoutModalOpen}
        />
        <div
          className={`flex-1 p-4 gradient bg-[#F8F8F8]  ${
            collapsed ? "w-[95vw]" : "w-full"
          } min-h-[calc(100vh-80px)]`}
        >
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px] w-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-[#333333] text-lg">Loading...</p>
              </div>
            </div>
          ) : (
            <>
            <FacilityTable
              data={data}
              deleteFacility={deleteItem}
              addItem={addItem}
              loading={loading}
              updateItem={updateItem}
              searchQuery={searchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalCount={totalCount}
            />
            
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}
