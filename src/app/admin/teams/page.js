"use client";

import Navbar from "../../components/Layout/Navbar";
import Sidebar from "../../components/Layout/Sidebar";
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEdit } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import useStaffForm from "../../hooks/useStaffForm";

function page() {
  const {
    staffData,
    addStaff,
    editStaff,
    deleteStaff,
    togglePublished,
    filterRole,
    setFilterRole,
    searchQuery,
    setSearchQuery,
    handleFilter,
    handleReset,
  } = useStaffForm();

  const allPermissions = [
    "Dashboard",
    "Facility",
    "Vehicles",
    "Reports",
    "Settings",
  ];
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [nameSortOrder, setNameSortOrder] = useState("asc"); // asc or desc
  const [dateSortOrder, setDateSortOrder] = useState("desc"); // newest first by default
  const [sortBy, setSortBy] = useState("name"); // "name", "date", "email", "contact", "status"
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter by status
  const filteredStaffData = staffData.filter((staff) => {
    return statusFilter === "all" || staff.status === statusFilter;
  });

  // Sort staff by name, date, email, contact, or status
  const sortedStaffData = [...filteredStaffData].sort((a, b) => {
    if (sortBy === "name") {
      if (nameSortOrder === "asc") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    } else if (sortBy === "date") {
      const dateA = new Date(a.joiningDate);
      const dateB = new Date(b.joiningDate);
      if (dateSortOrder === "asc") {
        return dateA - dateB; // oldest first
      } else {
        return dateB - dateA; // newest first
      }
    } else if (sortBy === "email") {
      const order = nameSortOrder === "asc" ? 1 : -1;
      return order * a.email.localeCompare(b.email);
    } else if (sortBy === "contact") {
      const order = nameSortOrder === "asc" ? 1 : -1;
      return order * (a.contact || '').localeCompare(b.contact || '');
    } else if (sortBy === "status") {
      const order = nameSortOrder === "asc" ? 1 : -1;
      return order * (a.status || '').localeCompare(b.status || '');
    }
    return 0;
  });

  const toggleNameSort = () => {
    setSortBy("name");
    setNameSortOrder(nameSortOrder === "asc" ? "desc" : "asc");
  };

  const toggleDateSort = () => {
    setSortBy("date");
    setDateSortOrder(dateSortOrder === "asc" ? "desc" : "asc");
  };

  const handleColumnSort = (column) => {
    if (column === "name") {
      toggleNameSort();
    } else if (column === "date") {
      toggleDateSort();
    } else {
      setSortBy(column);
      setNameSortOrder(nameSortOrder === "asc" ? "desc" : "asc");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("name");
    setNameSortOrder("asc");
  };
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password:"",
    contact: "",
    joiningDate: "",
    role: "",
    permissions: [],
  });
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);
  const openModal = (staff = null) => {
    setEditingStaff(staff);
    if (staff) {
      setFormData({
        name: staff.name,
        email: staff.email,
        contact: staff.contact,
        joiningDate: staff.joiningDate,
        role: staff.role,
        permissions: staff.permissions || [],
      });
    } else {
      setFormData({
        name: "",
        email: "",
        contact: "",
        joiningDate: "",
        role: "",
        permissions: [],
      });
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingStaff(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (perm) => {
    if (perm === "All") {
      if (formData.permissions.length === allPermissions.length) {
        setFormData((prev) => ({ ...prev, permissions: [] }));
      } else {
        setFormData((prev) => ({ ...prev, permissions: allPermissions }));
      }
    } else {
      if (formData.permissions.includes(perm)) {
        setFormData((prev) => ({
          ...prev,
          permissions: prev.permissions.filter((p) => p !== perm),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          permissions: [...prev.permissions, perm],
        }));
      }
    }
  };

  const confirmDelete = (id) => {
    setStaffToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    deleteStaff(staffToDelete);
    setShowDeleteModal(false);
    setStaffToDelete(null);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const finalData = {
      ...formData,
      role: null,  // Send null for now
      permissions: null  // Send null for now
    };
    if (editingStaff) {
      editStaff(editingStaff.id, finalData);
    } else {
      addStaff(finalData);
    }
    closeModal();
  };

  return (
    <div className="flex bg-[#fff] min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 min-h-screen bg-[#fff]">
        <Navbar
          title={"Staff"}
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
        />
        <div
          className={`flex-1 p-4 bg-[#F8F8F8] rounded-2xl ${
            collapsed ? "w-[95vw]" : "w-[86vw]"
          } min-h-[calc(100vh-80px)]`}
        >
            <div className="container mx-auto p-4">
              <ToastContainer />

              {/* Search, Role Filter, Add Staff, Reset */}
              <div className="mb-4 flex justify-between items-center mt-10 mb-10">
                <div className="flex space-x-3 items-center">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-80 px-4 py-2 border border-gray-300 rounded-lg text-[#333333] placeholder-[#666666] focus:outline-none focus:border-[#003F65]"
                  />
                  <div className="relative w-40 mr-4">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg text-[#333333] focus:outline-none focus:border-[#003F65] appearance-none bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {(searchQuery || statusFilter !== "all" || sortBy !== "name" || nameSortOrder !== "asc") && (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 border border-[#666666] text-[#333333] rounded-lg hover:bg-[#F8F8F8] transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
                
                <div>
                  <button
                    onClick={() => openModal()}
                    className="px-6 py-2 bg-[#003F65] text-white rounded-full shadow-md hover:bg-[#003F65] transition-colors"
                  >
                    + Add Staff
                  </button>
                </div>
              </div>

              {/* Side Modal */}
              {isOpen && (
                <div className="fixed inset-0 flex justify-end bg-black/50 z-999999">
                  <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow p-6 relative transition-transform translate-x-0">
                    <button
                      onClick={closeModal}
                      className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                    >
                      ✕
                    </button>

                    <h2 className="text-xl text-[#333333] font-semibold mb-4">
                      {editingStaff ? "Edit" : "Add"} Staff
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        name="name"
                        placeholder="Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"
                        required
                      />

                      <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"
                        required
                      />

                      {/* {!editingStaff && ( */}
                        <input
                          name="password"
                          type="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"
                          required
                        />
                      {/* )} */}

                      <input
                        name="contact"
                        placeholder="Contact Number"
                        value={formData.contact}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"
                        required
                      />

                      <input
                        name="joiningDate"
                        type="date"
                        value={formData.joiningDate}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"
                        required
                      />

                      {/* Role Select - Commented for now */}
                      {/* <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-[#333333]"
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="Admin">Admin</option>
                        <option value="Staff">Staff</option>
                      </select> */}

                      {/* Permissions - Commented for now */}
                      {/* <div>
                        <p className="font-bold mb-1 text-[#333333]">Permissions</p>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-[#333333]">
                            <input
                              type="checkbox"
                              checked={
                                formData.permissions.length ===
                                allPermissions.length
                              }
                              onChange={() => handlePermissionChange("All")}
                            />
                            <p> Select All</p>
                          </label>
                          {allPermissions?.map((perm) => (
                            <label
                              key={perm}
                              className="flex items-center gap-2 text-[#333333]"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm)}
                                onChange={() => handlePermissionChange(perm)}
                              />
                              <p> {perm} </p>
                            </label>
                          ))}
                        </div>
                      </div> */}

                      {/* <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        {editingStaff ? "Update" : "Save"}
                      </button> */}
                      <div className="fixed bottom-0 left-0 w-full max-w-md bg-white p-4 border-t flex justify-between gap-4">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="bg-[#666666] text-white px-4 py-2 w-[50%] rounded hover:bg-[#666666]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-[#003F65] text-white px-4 py-2 w-[50%] rounded hover:bg-[#003F65]"
                        >
                          {editingStaff ? "Update" : "Submit"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Staff Table */}
              <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                <thead>
                  <tr className="text-left border-b bg-gray-300">
                    <th 
                      className="p-2 text-[#333333] cursor-pointer hover:bg-[#F8F8F8] transition-colors"
                      onClick={toggleNameSort}
                    >
                      <div className="flex items-center gap-2">
                        NAME
                        {sortBy === "name" && (
                          <span className="text-sm">
                            {nameSortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-2 text-[#333333] cursor-pointer hover:bg-[#F8F8F8] transition-colors select-none"
                      onClick={() => handleColumnSort("email")}
                    >
                      <div className="flex items-center gap-2">
                        EMAIL
                        {sortBy === "email" && (
                          <span className="text-[#003F65]">
                            {nameSortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-2 text-[#333333] cursor-pointer hover:bg-[#F8F8F8] transition-colors select-none"
                      onClick={() => handleColumnSort("contact")}
                    >
                      <div className="flex items-center gap-2">
                        CONTACT
                        {sortBy === "contact" && (
                          <span className="text-[#003F65]">
                            {nameSortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-2 text-[#333333] cursor-pointer hover:bg-[#F8F8F8] transition-colors"
                      onClick={toggleDateSort}
                    >
                      <div className="flex items-center gap-2">
                        JOINING DATE
                        {sortBy === "date" && (
                          <span className="text-sm">
                            {dateSortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    {/* <th className="p-2 text-[#333333]">ROLE</th> */}
                    <th 
                      className="p-2 text-[#333333] cursor-pointer hover:bg-[#F8F8F8] transition-colors select-none"
                      onClick={() => handleColumnSort("status")}
                    >
                      <div className="flex items-center gap-2">
                        STATUS
                        {sortBy === "status" && (
                          <span className="text-[#003F65]">
                            {nameSortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                    {/* <th className="p-2 text-[#333333]">PUBLISHED</th> */}
                    <th className="p-2 text-[#333333]">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStaffData?.map((staff) => (
                    <tr key={staff.id} className="border-b border-gray-300">
                      <td className="p-2 text-[#333333]">{staff.name}</td>
                      <td className="p-2 text-[#333333]">{staff.email}</td>
                      <td className="p-2 text-[#333333]">{staff.contact}</td>
                      <td className="p-2 text-[#333333]">{staff.joiningDate}</td>
                      {/* <td className="p-2 text-[#333333]">{staff.role}</td> */}
                      <td className="p-2 text-[#333333]">
                        <button
                          // onClick={() => togglePublished(staff.id)}
                          className={`px-4 py-1 rounded-full ${
                            staff.status === "Active"
                              ? "bg-green-100 text-green-500"
                              : "bg-red-100 text-red-500"
                          }`}
                        >
                          {staff.status}
                        </button>
                      </td>
                      {/* <td className="p-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staff.status === "Active"}
                            onClick={() => togglePublished(staff.id)}
                            className="sr-only"
                          />
                          <span className="w-11 h-6 bg-[#F8F8F8] rounded-full inline-block"></span>
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5  rounded-full transition transform ${
                              staff.status === "Active"
                                ? "translate-x-5 bg-green-500"
                                : "translate-x-0 bg-red-500"
                            }`}
                          ></span>
                        </label>
                      </td> */}
                      <td className="p-2">
                        <button
                          className="ml-4 text-red-500"
                          onClick={() => openModal(staff)}
                        >
                          {" "}
                          <FiEdit size={16} className="text-green-500" />
                        </button>
                        <button
                          className="ml-4 text-red-500"
                          onClick={() => confirmDelete(staff.id)}
                        >
                          <MdDeleteOutline size={20} className="text-Red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Delete Confirmation Modal */}
                  {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50  flex justify-center items-center z-50">
                      <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
                        <p className="mb-6 text-[#333333]">
                          Are you sure you want to delete this staff member?
                        </p>
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 bg-green-500 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  );
}

export default page;
