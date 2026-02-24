"use client";
import Navbar from "../../components/Layout/Navbar";
import Sidebar from "../../components/Layout/Sidebar";
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEdit } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import useStaffForm from "../../hooks/useStaffForm";
import client from "../../api/client.js"

function page() {
  const {
    staffData,
    totalCount,
    currentPage,
    setCurrentPage,
    itemsPerPage,
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
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const [data, setData] = useState({
    "title": "",
    "confirm": "",
    "reject": ""
  })

  const [newDeleteRequest, setNewDeleteRequest] = useState({})
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [nameSortOrder, setNameSortOrder] = useState("asc"); // asc or desc
  const [dateSortOrder, setDateSortOrder] = useState("desc"); // newest first by default
  const [sortBy, setSortBy] = useState("name"); // "name", "date", "email", "contact", "status"
  const [statusFilter, setStatusFilter] = useState("all");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const channel = client
      .channel('staff-table-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'staff',
        },
        (payload) => {
          // console.log("Database changed!", payload);
          let val = Math.random()
          setCurrentPage(prev => val)
          // console.log("setCurrentPage working ",staffData)

        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [currentPage]);

  // Filter by status
  const filteredStaffData = staffData.filter((staff) => {
    if (statusFilter == "DeleteRequest") {
      if (staff.deleteAccount) {
        return staff.deleteAccount;
      }
    }

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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("name");
    setNameSortOrder("asc");
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    joiningDate: "",
    role: "",
    permissions: [],
  });

  const [collapsed, setCollapsed] = useState(false);
  const [isNavbarLogoutModalOpen, setIsNavbarLogoutModalOpen] = useState(false);

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

  const confirmDelete = (id, data = {}) => {
    setStaffToDelete(id);
    setShowDeleteModal(true);
    setData(data);
  };

  const handleDelete = () => {
    deleteStaff(staffToDelete);
    setShowDeleteModal(false);
    setStaffToDelete(null);
  };



  const handleSmtp = async () => {
    // console.log("clicked smtp",formData);
    if (editingStaff) {
      // console.log("Editing mode: Skipping SMTP notification");
      return;
    }
    if (formData.password) {
      let postData = {
        email: formData.email,
        username: formData.name,
        password: formData.password
      }

      const response = await fetch("/api/smtp",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        })
    }
  }

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    if (!editingStaff && !formData.password) newErrors.password = "Password is required";
    if (!formData.contact) newErrors.contact = "Contact number is required";
    if (!formData.joiningDate) newErrors.joiningDate = "Joining date is required";


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => { // 1. Added 'async'
    e.preventDefault();

    if (!validateForm()) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const finalData = {
      ...formData,
      role: null,
      permissions: null
    };

    try {
      if (editingStaff) {
        // Wait for the edit to finish
        await editStaff(editingStaff.id, finalData);
        toast.success("Staff updated!");
      } else {
        // 2. Await the result from addStaff
        const result = await addStaff(finalData);

        // 3. ONLY if the database save worked, trigger the email
        if (result && result.success) {
          console.log("DB Success! Now sending SMTP...");
          await handleSmtp(); // This is where we trigger the email
          toast.success("Staff added and email sent!");
        } else {
          // If addStaff returned success: false (like duplicate email)
          toast.error(result?.message || "Could not add staff");
          let newErrors = {};
          newErrors.email = result?.message
          setErrors(newErrors)

          return; // Stop here! Don't close the modal.
        }
      }

      // 4. Only close the modal if everything worked
      closeModal();

    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Something went wrong. Check console.");
    }
  };

  return (
    <div className="flex bg-[#fff] min-h-screen ">

      <Sidebar collapsed={collapsed} isLogoutModalOpen={isNavbarLogoutModalOpen} />

      <div className="flex flex-col flex-1 min-h-screen bg-[#fff] w-[84%]">
        <Navbar title={"Staff"} collapsed={collapsed} toggleSidebar={toggleSidebar} onLogoutModalChange={setIsNavbarLogoutModalOpen} />

        <div
          className={`flex-1 p-4 bg-[#F8F8F8]  gradient ${collapsed ? "w-[95vw]" : "w-full"
            } min-h-[calc(100vh-80px)]`}
        >
          <div className="">

            <ToastContainer />

            {/* Search, Role Filter, Add Staff, Reset */}
            <div className="mb-4 flex justify-between items-center mt-10 mb-10">

              <div className="flex space-x-3 items-center">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 px-4 py-2 border border-gray-300  bg-white rounded-lg text-[#333333] placeholder-[#666666] focus:outline-none focus:border-black"
                />

                <div className="relative w-40 mr-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg text-[#333333] focus:outline-none focus:border-black appearance-none bg-white cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="DeleteRequest">Delete Request</option>

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
                  className="px-6 py-2 bg-black text-white rounded-full shadow-md hover:bg-black transition-colors cursor-pointer"
                >
                  Add Staff
                </button>
              </div>

            </div>

            {/* Side Modal */}
            {isOpen && (
              <div className="fixed inset-0 flex justify-end bg-black/50 z-999999" onClick={() => closeModal()}>
                <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow p-6 relative transition-transform translate-x-0" onClick={(e) => e.stopPropagation()}>

                  <button
                    onClick={closeModal}
                    className="absolute top-5 right-8 text-gray-600 hover:text-gray-800 cursor-pointer"
                  >
                    ✕
                  </button>

                  <h2 className="text-xl text-[#333333] font-semibold mb-4">
                    {editingStaff ? "Edit" : "Add"} Staff
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                      <input
                        name="name"
                        placeholder="Name *"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"

                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <input
                        name="email"
                        type="email"
                        placeholder="Email *"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"

                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      {!editingStaff && (
                        <input
                          name="password"
                          type="password"
                          placeholder="Password *"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"

                        />
                      )}
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <input
                        name="contact"
                        type="number"
                        placeholder="Contact Number *"
                        value={formData.contact}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"

                      />
                      {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
                    </div>

                    <div>
                      <input
                        name="joiningDate"
                        type="date"
                        placeholder="Date *"
                        value={formData.joiningDate}
                        onChange={handleChange}
                        onClick={(e) => e.target.showPicker()}
                        className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"

                      />
                      {errors.joiningDate && <p className="text-red-500 text-sm mt-1">{errors.joiningDate}</p>}
                    </div>

                    <div className="fixed bottom-0 left-0 w-full max-w-md bg-white p-4 border-t flex justify-between gap-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="bg-[#666666] text-white px-4 py-2 w-[50%] rounded hover:bg-[#666666] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        // onClick={handleSmtp}
                        className="bg-black text-white px-4 py-2 w-[50%] rounded hover:bg-black cursor-pointer"
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
                <tr className="text-left border-b bg-black">
                  <th
                    className="p-2  cursor-pointer transition-colors"
                    onClick={toggleNameSort}
                  >
                    <div className="flex items-center gap-2 text-white">
                      NAME
                      {sortBy === "name" && (
                        <span className="text-sm">
                          {nameSortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="p-2 cursor-pointer transition-colors select-none text-white"
                    onClick={() => handleColumnSort("email")}
                  >
                    <div className="flex items-center gap-2">
                      EMAIL
                      {sortBy === "email" && (
                        <span className="text-black">
                          {nameSortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="p-2 text-[#333333] cursor-pointer transition-colors select-none text-white"
                    onClick={() => handleColumnSort("contact")}
                  >
                    <div className="flex items-center gap-2">
                      CONTACT
                      {sortBy === "contact" && (
                        <span className="text-black">
                          {nameSortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="p-2 cursor-pointer transition-colors text-white"
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
                    className="p-2 cursor-pointer transition-colors select-none"
                    onClick={() => handleColumnSort("status")}
                  >
                    <div className="flex items-center gap-2 text-white">
                      STATUS
                      {sortBy === "status" && (
                        <span className="text-black">
                          {nameSortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  {/* <th className="p-2 text-[#333333]">PUBLISHED</th> */}
                  <th className="p-2 text-white">ACTIONS</th>
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
                        className={`px-4 py-1 rounded-full ${staff.status === "Active"
                          ? "bg-green-100 text-green-500"
                          : "bg-red-100 text-red-500"
                          }`}
                      >
                        {staff.deleteAccount ? "Delete Request" : staff.status}
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
                      {/* delete request */}
                      {/* {staff.deleteAccount && <button
                        className="ml-4 text-red-500"
                        onClick={() => confirmDelete(staff.id, {
                          "title": "confirm the user request for delete",
                          "confirm": "Yes",
                          "reject": "No"
                        })}
                      >
                        <MdDeleteOutline size={20} className="text-Red-500" />
                      </button>} */}

                      <button
                        className="ml-4 text-red-500"
                        onClick={() => openModal(staff)}
                      >
                        {" "}
                        <FiEdit size={16} className="text-green-500 cursor-pointer" />
                      </button>
                      <button
                        className="ml-4 text-red-500"
                        onClick={() => confirmDelete(staff.id)}
                      >
                        <MdDeleteOutline size={20} className="text-Red-500 cursor-pointer" />
                      </button>
                    </td>
                  </tr>
                ))}



                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                  <div className="fixed inset-0 bg-black/50  flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
                      <h3 className="text-lg text-[#333333] font-semibold mb-4">
                        {data.title ?? "Confirm Delete"}
                      </h3>
                      <p className="mb-6 text-[#333333]">
                        Are you sure you want to delete this staff member?
                      </p>
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => {
                            setShowDeleteModal(false)
                            setData({})
                          }}
                          className="px-4 py-2 border border-lg rounded"
                        >
                          {data.reject ?? "Cancel"}
                        </button>
                        <button
                          onClick={handleDelete}
                          className="px-4 py-2 bg-red-500 text-white rounded"
                        >
                          {data.confirm ?? "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (<div className="flex justify-between items-center p-4 bg-white border border-gray-300 rounded-b-lg">
              <p className="text-black text-sm">
                { }
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-4 py-2 border rounded text-black disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-4 py-2 border rounded text-black disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>)}

          </div>

        </div>

      </div>
    </div>
  );
}

export default page;
