"use client";
import { useState, useEffect } from "react";
import client from "../api/client"; 
import bcrypt from "bcryptjs";

export default function useStaffForm() {
  const [staffList, setStaffList] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all staff from Supabase
  const fetchAllStaff = async () => {
    const { data, error } = await client
      .from("staff")
      .select("*")
      .order("id", { ascending: true });


      

    if (error) {
      console.error("Fetch staff error:", error.message);
    } else {
      setStaffList(data);
      setStaffData(data);
    }
  };

  useEffect(() => {
    fetchAllStaff();
  }, []);

  // Auto-filter on search or role change
  useEffect(() => {
    const filteredData = staffList.filter((staff) => {
      const matchesSearch =
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = 
        filterRole === "" || 
        filterRole === "all" || 
        staff.role.toLowerCase() === filterRole.toLowerCase();

      return matchesSearch && matchesRole;
    });
    setStaffData(filteredData);
  }, [searchQuery, filterRole, staffList]);
const addStaff = async (staff) => {
  try {
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(staff.password, 10);

    const newStaff = {
      id: Date.now(),
      ...staff,
      password: hashedPassword, // store hashed password
      status: "Active",
      published: true,
    };

    const { data, error } = await client
      .from("staff")
      .insert([newStaff])
      .select();

    if (error) {
      console.error("Add staff error:", error.message);
    } else {
      setStaffList((prev) => [...prev, newStaff]);
      setStaffData((prev) => [...prev, newStaff]);
    }
  } catch (err) {
    console.error("Hashing error:", err.message);
  }
};

const editStaff = async (id, updatedStaff) => {
  // Remove password field if exists, as edit does not update password here
  const { password, ...staffWithoutPassword } = updatedStaff;

  const { data, error } = await client
    .from("staff")
    .update(staffWithoutPassword)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Edit staff error:", error.message);
  } else {
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...staffWithoutPassword } : s))
    );
    setStaffData((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...staffWithoutPassword } : s))
    );
  }
};

  // const addStaff = async (staff) => {
  //   const newStaff = {
  //     id: Date.now(),
  //     ...staff,
  //     status: "Active",
  //     published: true,
  //   };

  //   const { data, error } = await client
  //     .from("staff")
  //     .insert([newStaff])
  //     .select();

  //   if (error) {
  //     console.error("Add staff error:", error.message);
  //   } else {
  //     setStaffList((prev) => [...prev, newStaff]);
  //     setStaffData((prev) => [...prev, newStaff]);
  //   }
  // };

  // const editStaff = async (id, updatedStaff) => {
  //   const { data, error } = await client
  //     .from("staff")
  //     .update(updatedStaff)
  //     .eq("id", id)
  //     .select();

  //   if (error) {
  //     console.error("Edit staff error:", error.message);
  //   } else {
  //     setStaffList((prev) =>
  //       prev.map((s) => (s.id === id ? { ...s, ...updatedStaff } : s))
  //     );
  //     setStaffData((prev) =>
  //       prev.map((s) => (s.id === id ? { ...s, ...updatedStaff } : s))
  //     );
  //   }
  // };

  const deleteStaff = async (id) => {
    const { error } = await client
      .from("staff")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete staff error:", error.message);
    } else {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      setStaffData((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const togglePublished = async (id) => {
    const staffToUpdate = staffList.find((s) => s.id === id);
    const newStatus = staffToUpdate.status === "Active" ? "Inactive" : "Active";
    const updatedStaff = {
      status: newStatus,
      published: newStatus === "Active",
    };

    const { data, error } = await client
      .from("staff")
      .update(updatedStaff)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Toggle status error:", error.message);
    } else {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: newStatus, published: updatedStaff.published }
            : s
        )
      );
      setStaffData((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: newStatus, published: updatedStaff.published }
            : s
        )
      );
    }
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
    setFilterRole("all");
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
