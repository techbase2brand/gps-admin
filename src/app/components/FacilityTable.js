// "use client";

// export default function FacilityTable({ data, deleteFacility }) {
//   return (
//     <table border="1" cellPadding="5">
//       <thead>
//         <tr>
//           <th>Number</th>
//           <th>Address</th>
//           <th>Lat</th>
//           <th>Long</th>
//           <th>Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//         {data.map((facility) => (
//           <tr key={facility.id}>
//             <td>{facility.number}</td>
//             <td>{facility.address}</td>
//             <td>{facility.lat}</td>
//             <td>{facility.long}</td>
//             <td>
//               <button>Edit</button>
//               <button onClick={() => deleteFacility(facility.id)}>Delete</button>
//               <button>View</button>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

"use client";
import { useRouter } from "next/navigation";
import { useLocalStorageCRUD } from "../hooks/useLocalStorageCRUD";
import { useState } from "react";
import { IoEyeOutline } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import useCRUD from "../hooks/useCRUD";
import FacilityForm from "./FacilityForm";

export default function FacilityTable({
  data,
  addItem,
  updateItem,
  deleteFacility,
  searchQuery,
  loading,
}) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);

  const openAddModal = () => {
    setEditingFacility(null);
    setIsModalOpen(true);
  };

  const openEditModal = (facility) => {
    setEditingFacility(facility);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingFacility(null);
    setIsModalOpen(false);
  };
  const filteredData = data?.filter((facility) =>
    [facility.name, facility.number, facility.city, facility.address].some(
      (field) =>
        field?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  return (
    <div>
      <button
        onClick={openAddModal}
        // onClick={() => router.push("/admin/facility/add")}
        className="bg-[#613EEA] text-white px-4 py-2 rounded-full mt-10  mb-10"
      >
        + Add Facility
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-end bg-black/50 z-999999">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow p-6 relative transition-transform translate-x-0">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h2 className="text-xl text-black font-semibold mb-4">
              {editingFacility ? "Edit Facility" : "Add Facility"}
            </h2>
            <FacilityForm
              defaultValues={editingFacility || "add"}
              addItem={addItem}
              updateItem={updateItem}
            />
          </div>
        </div>
      )}
      <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
        <thead>
          <tr className="text-left border-b bg-gray-300">
            <th className="px-4 text-start  py-2 text-black">Name</th>
            <th className=" px-4 text-start py-2 text-black">Number</th>
            <th className="px-4 text-start  py-2 text-black">City</th>
            <th className="px-4 text-start  py-2 text-black">Address</th>
            <th className="px-4 text-start  py-2 text-black">Actions</th>
          </tr>
        </thead>
        {filteredData?.length > 0 ? (
          <tbody>
            {[...filteredData]?.reverse()?.map((facility) => (
              <tr key={facility?.id} className="border-b border-gray-300">
                <td className=" px-4 py-2 text-black">{facility?.name}</td>
                <td className=" px-4 py-2 text-black">{facility?.number}</td>
                <td className=" px-4 py-2 text-black">{facility?.city}</td>
                <td className=" px-4 py-2 w-[30%] text-black">
                  {facility?.address}
                </td>
                <td className=" px-4 py-2 space-x-2 text-black">
                  <button
                    onClick={() => {
                      const query = new URLSearchParams({
                        id: facility.id,
                        name: facility.name,
                        address: facility.address,
                        // add more if needed
                      }).toString();
                      router.push(`/admin/facility/view/${facility.id}`);
                    }}
                    className=" px-2 py-2 rounded"
                  >
                    <IoEyeOutline size={20} className="text-black" />
                  </button>
                  <button
                    onClick={() => openEditModal(facility)}
                    // onClick={() =>
                    //   router.push(`/admin/facility/${facility?.id}`)
                    // }
                    className=" px-2 py-2 rounded"
                  >
                    <FiEdit size={16} className="text-green-500" />
                  </button>
                  <button
                    onClick={() => setDeleteId(facility?.id)}
                    className=" px-2 py-2 rounded"
                  >
                    <MdDeleteOutline size={20} className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        ) : (
          <h2 className="font-bold mb-2 text-black self-center">
            No results found:
          </h2>
        )}
      </table>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50  flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
            {/* <h3 className="text-lg text-black font-semibold mb-4">
                          Confirm Delete
                        </h3> */}
            <p className="mb-6 text-black">Are you sure you want to delete?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-green-500 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFacility(deleteId)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
