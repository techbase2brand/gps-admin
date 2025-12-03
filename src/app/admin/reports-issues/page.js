"use client";
import Sidebar from "../../components/Layout/Sidebar";
import ReportsIssuesTable from "../../components/ReportsIssuesTable";
import { useState } from "react";
import Navbar from "../../components/Layout/Navbar";

export default function ReportsIssues() {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className="flex bg-[#fff] min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 min-h-screen bg-[#fff]">
        <Navbar
          title={"Reports and Issues"}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
        />
        <div
          className={`p-4 bg-gray-200 rounded-2xl ${
            collapsed ? "w-[95vw]" : "w-[86vw]"
          } min-h-[calc(100vh-80px)]`}
        >
          <ReportsIssuesTable searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}

