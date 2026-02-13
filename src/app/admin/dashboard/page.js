"use client";
import Sidebar from "../../components/Layout/Sidebar";
import useCRUD from "../../hooks/useCRUD";
import DashboardCard from "../../components/DashboardCard";
import { useState } from "react";
import useCarsCRUD from "../../hooks/useCarsCRUD";
import { FaCar, FaMicrochip, FaParking, FaMapMarkerAlt, FaBuilding, FaUsers } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { HiChip } from "react-icons/hi";
import Navbar from "../../components/Layout/Navbar";
import { useRouter } from "next/navigation";
import CarForm from "../../../app/components/CarForm";
import { ToastContainer, toast } from "react-toastify";
import useStaffForm from "../../hooks/useStaffForm";
import FacilityTable from "../../components/FacilityTable";
import CarsTable from "../../components/CarsTable";
import FacilityForm from "../../components/FacilityForm";


export default function Home() {
  const {
    staffData: StaffDataForm,
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
  const { data, addItem, deleteItem, updateItem, loading, currentPage, setCurrentPage, itemsPerPage, totalCount } =
    useCRUD("facility");
  const router = useRouter();
  const [errors, setErrors] = useState({})
  const { carData, addItem: addCar, } = useCarsCRUD("cars");
  const { data: staffData } = useCRUD("staff");
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showModalChip, setShowModalChip] = useState(false);
  const [searchVin, setSearchVin] = useState("");
  const [searchChip, setSearchChip] = useState("");
  const [facilitySortConfig, setFacilitySortConfig] = useState({ column: null, direction: 'asc' });
  const [vehicleSortConfig, setVehicleSortConfig] = useState({ column: null, direction: 'asc' });
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNavbarLogoutModalOpen, setIsNavbarLogoutModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    joiningDate: "",
    role: "",
    permissions: [],
  });
  const [isOpenAddStaff, setIsOpenAddStaff] = useState(false);
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false);

  // Debug: Check status counts
  const assignedCount = carData?.filter((car) => car?.status === "Assigned")?.length || 0;
  const unassignedCount = carData?.filter((car) => car?.status === "Unassigned")?.length || 0;
  const toggleSidebar = () => setCollapsed(!collapsed);


  const closeAddFacilityModal = () => {
    setIsAddFacilityModalOpen(false);
  }
  // Helper function to get facility name
  const getFacilityName = (facilityId) => {
    const facility = data?.find(f => f.id.toString() === facilityId?.toString());
    return facility?.name || '-';
  };

  // Handle facility sorting
  const handleFacilitySort = (column) => {
    let direction = 'asc';
    if (facilitySortConfig.column === column && facilitySortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setFacilitySortConfig({ column, direction });
  };

  // Handle vehicle sorting
  const handleVehicleSort = (column) => {
    let direction = 'asc';
    if (vehicleSortConfig.column === column && vehicleSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setVehicleSortConfig({ column, direction });
  };

  // Filter and sort facilities
  const filteredFacilities = data?.filter((facility) => {
    return cityFilter === "all" || facility.city === cityFilter;
  });

  const sortedFacilities = [...(filteredFacilities || [])].sort((a, b) => {
    if (!facilitySortConfig.column) return 0;
    let aValue, bValue;
    switch (facilitySortConfig.column) {
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'city':
        aValue = a.city || '';
        bValue = b.city || '';
        break;
      case 'parkingSlots':
        aValue = parseInt(a.parkingSlots) || 0;
        bValue = parseInt(b.parkingSlots) || 0;
        return facilitySortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      default:
        return 0;
    }
    if (facilitySortConfig.column === 'parkingSlots') {
      return facilitySortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return facilitySortConfig.direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Filter and sort vehicles
  const filteredVehicles = carData?.filter((car) => {
    return statusFilter === "all" || car.status === statusFilter;
  });

  const sortedVehicles = [...(filteredVehicles || [])].sort((a, b) => {
    if (!vehicleSortConfig.column) return 0;
    let aValue, bValue;
    switch (vehicleSortConfig.column) {
      case 'vin':
        aValue = a.vin || '';
        bValue = b.vin || '';
        break;
      case 'chip':
        aValue = a.chip || '';
        bValue = b.chip || '';
        break;
      case 'status':
        aValue = a.status || 'Unassigned';
        bValue = b.status || 'Unassigned';
        break;
      default:
        return 0;
    }
    return vehicleSortConfig.direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const openAddModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openAddFacilityModal = () => {
    setIsAddFacilityModalOpen(true);
  };

  const openAddStaffModal = () => {

    setFormData({
      name: "",
      email: "",
      contact: "",
      joiningDate: "",
      role: "",
      permissions: [],
    });
    setIsOpenAddStaff(true);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeAddStaffModal = () => {
    setIsOpenAddStaff(false);
  };

  const handleSmtp = async () => {
    // console.log("clicked smtp",formData);

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

      console.log("response", response);

    }
  }

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.contact) newErrors.contact = "Contact number is required";
    if (!formData.joiningDate) newErrors.joiningDate = "Joining date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitAddStaff = async (e) => { // 1. Added 'async'
    e.preventDefault();

    if (!validateForm()) return;
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      // toast.error("Please enter a valid email address");

      return;
    }

    const finalData = {
      ...formData,
      role: null,
      permissions: null
    };

    try {

      const result = await addStaff(finalData);
      if (result && result.success) {

        closeAddStaffModal();
        toast.success("Staff added");
        await handleSmtp();
      } else {
        return;
      }


    }
    catch (error) {
      toast.error("Something went wrong");
    }
  };


  // Get unique cities
  const uniqueCities = [...new Set(data?.map(f => f.city).filter(Boolean))];
  return (
    <div className="flex bg-[#fff] min-h-screen">

      <Sidebar collapsed={collapsed} isLogoutModalOpen={isNavbarLogoutModalOpen} />

      <div className="flex flex-col flex-1 min-h-screen bg-[#fff]">

        <Navbar title={"Dashboard"} collapsed={collapsed} toggleSidebar={toggleSidebar} onLogoutModalChange={setIsNavbarLogoutModalOpen} />

        <div className={`flex-1 p-4 gradient  ${collapsed ? "w-[95vw]" : "w-[87vw]"} min-h-[calc(100vh-80px)] overflow-y-auto `}>

          <div className="flex justify-end gap-3 p-6">

            <ToastContainer />

            <button onClick={() => setShowModal(true)} className="bg- flex items-center justify-center bg-black text-bold text-white px-4 py-2 gap-2 rounded-xl my-4">
              {/* <FaMapMarkerAlt size={19} className="text-White bg-black" /> Track Vehicle */}

              {/* <FiSearch size={18} className="text-White bg-black" /> */}
              Track VIN

            </button>

            <button onClick={() => setShowModalChip(true)} className="bg- flex items-center justify-center bg-black text-bold text-white px-4 py-2 gap-2 rounded-xl my-4">
              {/* <FaMapMarkerAlt size={19} className="text-White bg-black" /> Track Vehicle */}
              {/* <FiSearch size={18} className="text-White bg-black" />  */}
              Track Chip
            </button>

            <button onClick={openAddModal} className="bg- flex items-center justify-center bg-black text-bold text-white px-4 py-2 gap-2 rounded-xl my-4">
              Add Vehicle
            </button>

            <button onClick={() => openAddStaffModal()} className="bg- flex items-center justify-center bg-black text-bold text-white px-4 py-2 gap-2 rounded-xl my-4">
              Add Staff
            </button>

            <div>
              <button
                onClick={openAddFacilityModal}
                className="bg- flex items-center justify-center bg-black text-bold text-white px-4 py-2 gap-2 rounded-xl my-4"
              >
                Add Facility
              </button>
            </div>

            {/* Add Facility Modal */}
            {isAddFacilityModalOpen && (
              <div className="fixed inset-0 flex justify-end bg-black/50 z-999999" onClick={closeAddFacilityModal}>
                <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow p-6 relative transition-transform translate-x-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">

                    <h2 className="text-xl text-black font-semibold ">
                      Add Facility
                    </h2>
                    <button
                      onClick={closeAddFacilityModal}
                      className=" text-gray-600 hover:text-gray-800"
                    >
                      ✕
                    </button>
                  </div>

                  <FacilityForm
                    defaultValues="add"
                    addItem={addItem}
                    updateItem={updateItem}
                    closeModal={closeAddFacilityModal}
                  />
                </div>
              </div>
            )}

            {/* Add Vehicle Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 flex justify-end bg-black/50 z-999999" onClick={(e) => { closeModal() }}>
                <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow p-6 relative transition-transform translate-x-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between mb-4">
                    <h2 className="text-xl text-[#333333] font-semibold">
                      Add Vehicle
                    </h2>
                    <button
                      onClick={closeModal}
                      className=" text-gray-600 hover:text-gray-800"
                    >
                      ✕
                    </button>
                  </div>
                  <CarForm
                    defaultValues={"add"}
                    closeModal={closeModal}
                    addItem={addCar}
                  />
                </div>
              </div>
            )}

            {/* Track Vehicle By VIN Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-xl font-bold text-black mb-4">
                    Track Vehicle By VIN
                  </h2>
                  <input
                    type="text"
                    value={searchVin}
                    onChange={(e) => setSearchVin(e.target.value)}
                    placeholder="Enter VIN number"
                    className="border border-gray-300 text-black placeholder-black rounded px-4 py-2 w-full mb-4"
                  />
                  
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded bg-[#F8F8F8] text-[#333333]"
                    >
                      Cancel
                    </button>
                    <button
                      // onClick={() => {
                      //   const item = carData?.find(
                      //     (c) => c?.vin.toLocaleLowerCase() == searchVin
                      //   );
                      //   if (item) {
                      //     router.push(`/admin/cars/view/${item.id}`);
                      //     setShowModal(false);
                      //   } else {
                      //     alert("Vehicle not found");
                      //   }
                      // }}
                      onClick={() => {
                        const item = carData?.find(
                          (c) =>
                            c?.vin?.toLowerCase() === searchVin.toLowerCase()
                        );
                        if (item) {
                          router.push(`/admin/cars/view/${item.id}`);
                          setShowModal(false);
                        } else {
                          alert("Vehicle not found");
                        }
                      }}
                      className="px-4 py-2 rounded bg-black text-white"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add staff modal */}
            {isOpenAddStaff && (
              <div className="fixed inset-0 flex justify-end bg-black/50 z-999999" onClick={(e) => closeAddStaffModal()}>
                <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow p-6 relative transition-transform translate-x-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between mb-4">
                    <h2 className="text-xl text-[#333333] font-semibold ">
                      Add Staff
                    </h2>

                    <button onClick={closeAddStaffModal} className=" text-gray-600 hover:text-gray-800">
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSubmitAddStaff} className="space-y-4">

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
                      <input
                        name="password"
                        type="password"
                        placeholder="Password *"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded text-[#333333] placeholder-[#666666]-400"

                      />

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
                        onClick={closeAddStaffModal}
                        className="bg-[#666666] text-white px-4 py-2 w-[50%] rounded hover:bg-[#666666]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        // onClick={handleSmtp}
                        className="bg-black text-white px-4 py-2 w-[50%] rounded hover:bg-black"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}


            {showModalChip && (
              <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50" onClick={(e) => setShowModalChip(false)}>
                <div className="bg-white p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-xl font-bold text-black mb-4">
                    Track Vehicle By Chip
                  </h2>
                  <input
                    type="text"
                    value={searchChip}
                    onChange={(e) => setSearchChip(e.target.value)}
                    placeholder="Enter Chip number"
                    className="border border-gray-300 text-black placeholder-black rounded px-4 py-2 w-full mb-4"
                  />
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowModalChip(false)}
                      className="px-4 py-2 rounded bg-[#F8F8F8] text-[#333333]"
                    >
                      Cancel
                    </button>
                    <button
                      // onClick={() => {
                      //   const item = carData?.find(
                      //     (c) => c?.vin.toLocaleLowerCase() == searchVin
                      //   );
                      //   if (item) {
                      //     router.push(`/admin/cars/view/${item.id}`);
                      //     setShowModal(false);
                      //   } else {
                      //     alert("Vehicle not found");
                      //   }
                      // }}
                      onClick={() => {
                        const item = carData?.find(
                          (c) =>
                            c?.chip?.toLowerCase() === searchChip.toLowerCase()
                        );
                        if (item) {
                          router.push(`/admin/cars/view/${item.id}`);
                          setShowModal(false);
                        } else {
                          alert("Vehicle not found");
                        }
                      }}
                      className="px-4 py-2 rounded bg-black text-white"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 p-4">
            <DashboardCard
              title="Total Facilities"
              count={data?.length}
              iconSrc={<FaBuilding size={24} className="text-black" />}
              progressColor="bg-black"
            />
            <DashboardCard
              title="Total Cars"
              count={carData?.length}
              iconSrc={<FaCar size={24} className="text-black" />}
              progressColor="bg-black"
            />
            <DashboardCard
              title="Assigned Trackers"
              count={assignedCount}
              iconSrc={<FaMicrochip size={24} className="text-green-500" />}
              progressColor="bg-green-500"
            />
            <DashboardCard
              title="Unassigned Trackers"
              count={unassignedCount}
              iconSrc={<FaMicrochip size={24} className="text-red-500" />}
              progressColor="bg-red-500"
            />
            <DashboardCard
              title="Total Staff"
              count={staffData?.length || 0}
              iconSrc={<FaUsers size={24} className="text-black" />}
              progressColor="bg-black"
            />

          </div>


          {loading ? (
            <div className="flex items-center justify-center min-h-[400px] w-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-[#333333] text-lg">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#333333] mb-4 shrink-0"> Facility</h2>
              <FacilityTable
                data={data}
                deleteFacility={deleteItem}
                addItem={addItem}
                loading={loading}
                updateItem={updateItem}
                searchQuery={searchQuery}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalCount={totalCount}
                from="home"
              />

              <h2 className="text-xl font-bold text-[#333333] mb-4 shrink-0 mt-8"> Vehicle</h2>
              <CarsTable searchQuery={searchQuery} from="home" />
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
