"use client";
import Sidebar from "../../components/Layout/Sidebar";
import ReportsIssuesTable from "../../components/ReportsIssuesTable";
import { useState } from "react";
import Navbar from "../../components/Layout/Navbar";

export default function ReportsIssues() {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [isNavbarLogoutModalOpen, setIsNavbarLogoutModalOpen] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className="flex bg-[#fff] min-h-screen">
      <Sidebar collapsed={collapsed} isLogoutModalOpen={isNavbarLogoutModalOpen} />
      <div className="flex flex-col flex-1 min-h-screen bg-[#fff] w-[80%]">
        <Navbar
          title={"Reports and Issues"}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
          onLogoutModalChange={setIsNavbarLogoutModalOpen}
        />
        <div
          className={`p-4 bg-[#F8F8F8] gradient ${
            collapsed ? "w-[95vw]" : "w-full"
          } min-h-[calc(100vh-56px)]`}
        >
          <ReportsIssuesTable searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}

