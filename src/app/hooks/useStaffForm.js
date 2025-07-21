// "use client";
// import { useState, useEffect } from "react";
// import { ToastContainer, toast } from "react-toastify";

// export default function useStaffForm() {
//   const [staffList, setStaffList] = useState([]);
//     const [filterRole, setFilterRole] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");
  

//   useEffect(() => {
//     const storedStaff = JSON.parse(localStorage.getItem("staffList")) || [];
//     setStaffList(storedStaff);
//   }, []);

//   const saveToLocalStorage = (data) => {
//     localStorage.setItem("staffList", JSON.stringify(data));
//   };

//   const addStaff = (staff) => {
//     const newStaff = { ...staff, id: Date.now(), status: "Active", published: true };
//     const updatedList = [...staffList, newStaff];
//     setStaffList(updatedList);
//     saveToLocalStorage(updatedList);
//   };

//   const editStaff = (id, updatedStaff) => {
//   const updatedList = staffList.map((s) =>
//     s.id === id
//       ? {
//           ...s, // keeps existing status & published
//           ...updatedStaff, // updates new fields
//           id, // ensures id is same
//         }
//       : s
//   );
//   setStaffList(updatedList);
//   saveToLocalStorage(updatedList);
// };
//   const deleteStaff = (id) => {
//     const updatedList = staffList.filter((s) => s.id !== id);
//     setStaffList(updatedList);
//     saveToLocalStorage(updatedList);
//   };

//   const togglePublished = (id) => {
//     const updatedList = staffList.map((s) =>
//       s.id === id ? { ...s, published: !s.published, status: s.published ? "Inactive" : "Active" } : s
//     );
//     setStaffList(updatedList);
//     saveToLocalStorage(updatedList);
//   };

//   return { staffList, addStaff, editStaff, deleteStaff, togglePublished };
// }
"use client";
import { useState, useEffect } from "react";

export default function useStaffForm() {
  const [staffList, setStaffList] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [filterRole, setFilterRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedStaff = JSON.parse(localStorage.getItem("staffList")) || [];
    setStaffList(storedStaff);
    setStaffData(storedStaff);
  }, []);

  const saveToLocalStorage = (data) => {
    localStorage.setItem("staffList", JSON.stringify(data));
  };

  const addStaff = (staff) => {
    const newStaff = { ...staff, id: Date.now(), status: "Active", published: true };
    const updatedList = [...staffList, newStaff];
    setStaffList(updatedList);
    setStaffData(updatedList);
    saveToLocalStorage(updatedList);
  };

  const editStaff = (id, updatedStaff) => {
    const updatedList = staffList.map((s) =>
      s.id === id ? { ...s, ...updatedStaff, id } : s
    );
    setStaffList(updatedList);
    setStaffData(updatedList);
    saveToLocalStorage(updatedList);
  };

  const deleteStaff = (id) => {
    const updatedList = staffList.filter((s) => s.id !== id);
    setStaffList(updatedList);
    setStaffData(updatedList);
    saveToLocalStorage(updatedList);
  };

  const togglePublished = (id) => {
    const updatedList = staffList.map((s) =>
      s.id === id
        ? {
            ...s,
            published: !s.published,
            status: s.published ? "Inactive" : "Active",
          }
        : s
    );
    setStaffList(updatedList);
    setStaffData(updatedList);
    saveToLocalStorage(updatedList);
  };

  const handleFilter = () => {
    const filteredData = staffList.filter(
      (staff) =>
        (staff.role.toLowerCase().includes(filterRole.toLowerCase()) ||
          filterRole === "") &&
        (staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staff.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setStaffData(filteredData);
  };

  const handleReset = () => {
    setFilterRole("");
    setSearchQuery("");
    setStaffData(staffList);
  };

  return {
    staffList,
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
  };
}
