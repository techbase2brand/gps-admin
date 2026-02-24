"use client";
import { useState, useEffect } from "react";
import client from "../api/client";
import bcrypt from "bcryptjs";

export default function useStaffForm() {
  const [staffList, setStaffList] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // Page state stays here
  const itemsPerPage = 10;

  // Fetch all staff from Supabase
  const fetchAllStaff = async (page = 1, limit = 10) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await client
      .from("staff")
      .select("*", { count: 'exact' }) // Get total row count
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Fetch staff error:", error.message);
    } else {
      setStaffList(data);
      setStaffData(data);
      setTotalCount(count || 0);
    }
  };

  useEffect(() => {
    fetchAllStaff(currentPage);
  }, [currentPage]);

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
      const { data: userExist, error: fetchError } = await client
        .from("staff")
        .select("email")
        .eq('email', staff.email)
        .maybeSingle();
  
      if (userExist) {
        console.warn("User already exists with this email");
        return { success: false, message: "Email already exists" };
      }
  
      const hashedPassword = await bcrypt.hash(staff.password, 10);
  
      const newStaff = {
        id: Date.now(),
        ...staff,
        password: hashedPassword,
        status: "Active",
        published: true,
      };
  
      const { data, error } = await client
        .from("staff")
        .insert([newStaff])
        .select();
  
      if (error) {
        console.error("Add staff error:", error.message);
        // Return false so the modal stays open for the user to fix errors
        return { success: false, message: error.message }; 
      } else {
        // Use the actual data from the DB (data[0]) instead of local newStaff for accuracy
        setStaffList((prev) => [...prev, data[0]]);
        setStaffData((prev) => [...prev, data[0]]);
        
        // THIS IS THE KEY: You must return success true to close the modal
        return { success: true }; 
      }
    } catch (err) {
      console.error("Hashing error:", err.message);
      return { success: false, message: "System error occurred" };
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
    totalCount,
    setCurrentPage,
    currentPage,
    itemsPerPage
  };
}
