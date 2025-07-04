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

export default function FacilityTable({ data, deleteFacility, loading }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);

  return (
    <div>
      <button
        onClick={() => router.push("/admin/facility/add")}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Facility
      </button>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-4 py-2 text-black">Name</th>
            <th className="border px-4 py-2 text-black">Number</th>
            <th className="border px-4 py-2 text-black">City</th>
            <th className="border px-4 py-2 text-black">Address</th>
            <th className="border px-4 py-2 text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...data]?.reverse()?.map((facility) => (
            <tr key={facility?.id}>
              <td className="border px-4 py-2 text-black">{facility?.name}</td>
              <td className="border px-4 py-2 text-black">
                {facility?.number}
              </td>
              <td className="border px-4 py-2 text-black">
                {facility?.city}
              </td>
              <td className="border px-4 py-2 w-[30%] text-black">
                {facility?.address}
              </td>
              <td className="border px-4 py-2 space-x-2 text-black">
                <button
                  onClick={() => router.push(`/admin/facility/${facility?.id}`)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(facility?.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => router.push(`/admin/facility/view/${facility.id}`)}
                  className="bg-green-500  text-white px-2 py-1 rounded"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-100">
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
