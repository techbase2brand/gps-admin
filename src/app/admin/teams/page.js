"use client";

import Navbar from "../../components/Layout/Navbar";
import Sidebar from "../../components/Layout/Sidebar";
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoEyeOutline } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";

function page() {
  const [staffData, setStaffData] = useState([
    {
      id: 1,
      name: "Mark",
      email: "mark@gmail.com",
      contact: "0988765454",
      joiningDate: "18 Jul, 2025",
      role: "Cashier",
      status: "Active",
      published: true,
    },
    {
      id: 2,
      name: "Lorem",
      email: "lorem@gmail.com",
      contact: "09971765302",
      joiningDate: "18 Jul, 2025",
      role: "Admin",
      status: "Active",
      published: true,
    },
    {
      id: 3,
      name: "Admin",
      email: "admin@gmail.com",
      contact: "360-943-7332",
      joiningDate: "16 Jul, 2025",
      role: "Super Admin",
      status: "Active",
      published: true,
    },
    {
      id: 4,
      name: "Marion V. Parker",
      email: "marion@gmail.com",
      contact: "713-675-8813",
      joiningDate: "16 Jul, 2025",
      role: "Admin",
      status: "Inactive",
      published: false,
    },
    {
      id: 5,
      name: "Stacey J. Meikle",
      email: "stacey@gmail.com",
      contact: "616-738-0407",
      joiningDate: "16 Jul, 2025",
      role: "CEO",
      status: "Inactive",
      published: false,
    },
    {
      id: 6,
      name: "Shawn E. Palmer",
      email: "shawn@gmail.com",
      contact: "949-202-2913",
      joiningDate: "16 Jul, 2025",
      role: "Manager",
      status: "Active",
      published: true,
    },
    {
      id: 7,
      name: "Corrie H. Cates",
      email: "corrie@gmail.com",
      contact: "914-623-6873",
      joiningDate: "16 Jul, 2025",
      role: "Accountant",
      status: "Active",
      published: true,
    },
    {
      id: 8,
      name: "Alice B. Porter",
      email: "alice@gmail.com",
      contact: "708-488-9728",
      joiningDate: "16 Jul, 2025",
      role: "Cashier",
      status: "Active",
      published: true,
    },
    {
      id: 9,
      name: "Dorothy R. Brown",
      email: "dorothy@gmail.com",
      contact: "708-628-3122",
      joiningDate: "16 Jul, 2025",
      role: "Security Guard",
      status: "Active",
      published: true,
    },
  ]);

  const [filterRole, setFilterRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleStatusChange = (id) => {
    const updatedData = staffData.map((staff) => {
      if (staff.id === id) {
        staff.status = staff.status === "Active" ? "Inactive" : "Active";
        toast.success(`User is now ${staff.status}!`);
      }
      return staff;
    });
    setStaffData(updatedData);
  };

  const handleAddStaff = () => {
    toast.info("Add staff functionality is under development.");
  };

  const handleFilter = () => {
    // Filter staff based on role
    const filteredData = staffData.filter(
      (staff) =>
        (staff.role.toLowerCase().includes(filterRole.toLowerCase()) ||
          filterRole === "") &&
        (staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staff.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setStaffData(filteredData);
  };

  const handleReset = () => {
    setStaffData([
      {
        id: 1,
        name: "Mark",
        email: "mark@gmail.com",
        contact: "0988765454",
        joiningDate: "18 Jul, 2025",
        role: "Cashier",
        status: "Active",
        published: true,
      },
      {
        id: 2,
        name: "Lorem",
        email: "lorem@gmail.com",
        contact: "09971765302",
        joiningDate: "18 Jul, 2025",
        role: "Admin",
        status: "Active",
        published: true,
      },
      {
        id: 3,
        name: "Admin",
        email: "admin@gmail.com",
        contact: "360-943-7332",
        joiningDate: "16 Jul, 2025",
        role: "Admin",
        status: "Active",
        published: true,
      },
      {
        id: 4,
        name: "Marion V. Parker",
        email: "marion@gmail.com",
        contact: "713-675-8813",
        joiningDate: "16 Jul, 2025",
        role: "Staff",
        status: "Inactive",
        published: false,
      },
      {
        id: 5,
        name: "Stacey J. Meikle",
        email: "stacey@gmail.com",
        contact: "616-738-0407",
        joiningDate: "16 Jul, 2025",
        role: "Staff",
        status: "Inactive",
        published: false,
      },
      {
        id: 6,
        name: "Shawn E. Palmer",
        email: "shawn@gmail.com",
        contact: "949-202-2913",
        joiningDate: "16 Jul, 2025",
        role: "Staff",
        status: "Active",
        published: true,
      },
      {
        id: 7,
        name: "Corrie H. Cates",
        email: "corrie@gmail.com",
        contact: "914-623-6873",
        joiningDate: "16 Jul, 2025",
        role: "Admin",
        status: "Active",
        published: true,
      },
      {
        id: 8,
        name: "Alice B. Porter",
        email: "alice@gmail.com",
        contact: "708-488-9728",
        joiningDate: "16 Jul, 2025",
        role: "Staff",
        status: "Active",
        published: true,
      },
      {
        id: 9,
        name: "Dorothy R. Brown",
        email: "dorothy@gmail.com",
        contact: "708-628-3122",
        joiningDate: "16 Jul, 2025",
        role: "Admin",
        status: "Active",
        published: true,
      },
    ]);
  };

  return (
    <div>
      <div className="flex bg-[#fff]">
        <Sidebar />

        <div>
          <Navbar title={"Staff"} />
          <div className="flex-1 p-4 bg-gray-200 rounded-2xl w-[86vw] h-[93vh]">
            <div className="container mx-auto p-4">
              <ToastContainer />

              {/* Filter, Add Staff, Reset Buttons */}
              <div className="mb-4 flex justify-between items-center mb-10">
                <div className="flex space-x-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Search ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-black"
                    />
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg placeholder-black text-black"
                    >
                      <option value="" className="text-black">
                        Select Role
                      </option>
                      <option value="Admin">Admin</option>
                      <option value="Staff">Staff</option>
                    </select>
                    <button
                      onClick={handleAddStaff}
                      className="px-4 py-2 bg-[#613EEA] text-white rounded-lg shadow-md hover:bg-blue-600"
                    >
                      + Add Staff
                    </button>
                    <button
                      onClick={handleFilter}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
                    >
                      Filter
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Staff Table */}
              <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                <thead>
                  <tr className="text-left border-b bg-gray-300">
                    <th className="p-2 text-black">NAME</th>
                    <th className="p-2 text-black">EMAIL</th>
                    <th className="p-2 text-black">CONTACT</th>
                    <th className="p-2 text-black">JOINING DATE</th>
                    <th className="p-2 text-black">ROLE</th>
                    <th className="p-2 text-black">STATUS</th>
                    <th className="p-2 text-black">PUBLISHED</th>
                    <th className="p-2 text-black">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {staffData.map((staff) => (
                    <tr key={staff.id} className="border-b">
                      <td className="p-2 text-black">{staff.name}</td>
                      <td className="p-2 text-black">{staff.email}</td>
                      <td className="p-2 text-black">{staff.contact}</td>
                      <td className="p-2 text-black">{staff.joiningDate}</td>
                      <td className="p-2 text-black">{staff.role}</td>
                      <td className="p-2 text-black">
                        <button
                          onClick={() => handleStatusChange(staff.id)}
                          className={`px-4 py-1 rounded-full  ${
                            staff.status === "Active"
                              ? "bg-green-100  text-green-500"
                              : "bg-red-100  text-red-500"
                          }`}
                        >
                          {staff.status}
                        </button>
                      </td>
                      <td className="p-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staff.status === "Active"}
                            onChange={() => handleStatusChange(staff.id)}
                            className="sr-only"
                          />
                          <span className="w-11 h-6 bg-gray-200 rounded-full inline-block"></span>
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5  rounded-full transition transform ${
                              staff.status === "Active"
                                ? "translate-x-5 bg-green-500"
                                : "translate-x-0 bg-red-500"
                            }`}
                          ></span>
                        </label>
                      </td>
                      <td className="p-2">
                        <button className="text-blue-500">
                          {" "}
                          <IoEyeOutline size={20} className="text-black" />
                        </button>
                        <button className="ml-4 text-red-500">
                          {" "}
                          <FiEdit size={16} className="text-green-500" />
                        </button>
                        <button className="ml-4 text-red-500">
                          <MdDeleteOutline size={20} className="text-Red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
