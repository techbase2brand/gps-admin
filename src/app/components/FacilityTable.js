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

export default function FacilityTable({
  data,
  deleteFacility,
  searchQuery,
  loading,
}) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const filteredData = data?.filter((facility) =>
    [facility.name, facility.number, facility.city, facility.address].some(
      (field) =>
        field?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  return (
    <div>
      <button
        onClick={() => router.push("/admin/facility/add")}
        className="bg-[#613EEA] text-white px-4 py-2 rounded-full mt-10  mb-10"
      >
        + Add Facility
      </button>
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
                <td className=" px-4 py-2 text-black">
                  {facility?.name}
                </td>
                <td className=" px-4 py-2 text-black">
                  {facility?.number}
                </td>
                <td className=" px-4 py-2 text-black">
                  {facility?.city}
                </td>
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
                    onClick={() =>
                      router.push(`/admin/facility/${facility?.id}`)
                    }
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded">
            <p className="text-black">Are you sure you want to delete?</p>
            <div className="space-x-40 mt-4">
              <button
                onClick={() => deleteFacility(deleteId)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Yes
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="bg-green-500 px-4 py-2 rounded"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
