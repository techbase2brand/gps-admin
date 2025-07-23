"use client";
import Sidebar from "../../components/Layout/Sidebar";
import CarsTable from "../../components/CarsTable";
import Header from "../../components/Layout/Header";
import { useState } from "react";
import Navbar from "../../components/Layout/Navbar";

export default function Cars() {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className="flex bg-[#fff]">
      <Sidebar collapsed={collapsed} />
      <div>
        <Navbar
          title={"Vin List"}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
        />
        <div
          className={`flex-1 p-4 bg-gray-200 rounded-2xl  ${
            collapsed ? "w-[95vw]" : "w-[86vw]"
          } h-[92vh]`}
        >
          <CarsTable searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}
