"use client";

import Navbar from "../../components/Layout/Navbar";
import Sidebar from "../../components/Layout/Sidebar";
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoEyeOutline } from "react-icons/io5";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    joiningDate: "",
    role: "",
    permissions: [],
  });

  const openModal = (staff = null) => {
    console.log("workignng", staff);

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
    const finalData = {
      ...formData,
    };
    if (editingStaff) {
      editStaff(editingStaff.id, finalData);
    } else {
      addStaff(finalData);
    }
    closeModal();
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
              <div className="mb-4 flex justify-between items-center mt-10 mb-10">
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
                      onClick={() => openModal()}
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

                    <h2 className="text-xl text-black font-semibold mb-4">
                      {editingStaff ? "Edit" : "Add"} Staff
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        name="name"
                        placeholder="Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-black placeholder-gray-400"
                        required
                      />

                      <input
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-black placeholder-gray-400"
                        required
                      />

                      <input
                        name="contact"
                        placeholder="Contact Number"
                        value={formData.contact}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-black placeholder-gray-400"
                        required
                      />

                      <input
                        name="joiningDate"
                        type="date"
                        value={formData.joiningDate}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-black placeholder-gray-400"
                        required
                      />

                      {/* Role Select */}
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-black"
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="Admin">Admin</option>
                        <option value="Staff">Staff</option>
                      </select>

                      {/* Permissions */}
                      <div>
                        <p className="font-bold mb-1 text-black">Permissions</p>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-black">
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
                              className="flex items-center gap-2 text-black"
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
                      </div>

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
                          className="bg-gray-500 text-white px-4 py-2 w-[50%] rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-[#613EEA] text-white px-4 py-2 w-[50%] rounded hover:bg-[#613EEA]"
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
                  {staffData?.map((staff) => (
                    <tr key={staff.id} className="border-b">
                      <td className="p-2 text-black">{staff.name}</td>
                      <td className="p-2 text-black">{staff.email}</td>
                      <td className="p-2 text-black">{staff.contact}</td>
                      <td className="p-2 text-black">{staff.joiningDate}</td>
                      <td className="p-2 text-black">{staff.role}</td>
                      <td className="p-2 text-black">
                        <button
                          onClick={() => togglePublished(staff.id)}
                          // onClick={() => handleStatusChange(staff.id)}
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
                            onClick={() => togglePublished(staff.id)}
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
                        {/* <button className="text-blue-500">
                          {" "}
                          <IoEyeOutline size={20} className="text-black" />
                        </button> */}
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
                        {/* <h3 className="text-lg text-black font-semibold mb-4">
                          Confirm Delete
                        </h3> */}
                        <p className="mb-6 text-black">
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
    </div>
  );
}

export default page;
