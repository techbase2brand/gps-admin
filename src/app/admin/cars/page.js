"use client";
import Sidebar from "../../components/Layout/Sidebar";
import CarsTable from "../../components/CarsTable";
import Header from "../../components/Layout/Header";
import { useState } from "react";

export default function Cars() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4 bg-[#f7f8fb]">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-4 text-black">Cars Details</h1>
          <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
        <CarsTable searchQuery={searchQuery}/>
      </div>
    </div>
  );
}
