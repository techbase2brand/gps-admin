"use client";
import Sidebar from "../../components/Layout/Sidebar";
import CarsTable from "../../components/CarsTable";
import Header from "../../components/Layout/Header";
import { useState } from "react";

export default function AssignTracker() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex bg-[#fff] min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 bg-[#fff] min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-4 text-black">Cars Details</h1>
          <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
        <CarsTable searchQuery={searchQuery} assignview={true}/>
      </div>
    </div>
  );
}
