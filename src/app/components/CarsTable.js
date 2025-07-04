"use client"
import { useRouter } from "next/navigation";
import { useLocalStorageCRUD } from "../hooks/useLocalStorageCRUD";
import { useState } from "react";

export default function CarsTable() {
  const { data, remove } = useLocalStorageCRUD("cars");
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);

  return (
    <div>
      <button
        onClick={() => router.push("/admin/cars/add")}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Car
      </button>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-4 py-2 text-black">VIN</th>
            <th className="border px-4 py-2 text-black">Yard No.</th>
            <th className="border px-4 py-2 text-black">Slot No.</th>
            <th className="border px-4 py-2 text-black">Tracker No.</th>
            <th className="border px-4 py-2 text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((car) => (
            <tr key={car.id}>
              <td className="border px-4 py-2 text-black">{car.vin}</td>
              <td className="border px-4 py-2 text-black">{car.yardNo}</td>
              <td className="border px-4 py-2 text-black">{car.slotNo}</td>
              <td className="border px-4 py-2 text-black">{car.trackerNo}</td>
              <td className="border px-4 py-2 space-x-2 text-black">
                <button
                  onClick={() => router.push(`/admin/edit-car?id=${car.id}`)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(car.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => router.push(`/admin/edit-car?id=${car.id}`)}
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded">
            <p>Are you sure you want to delete?</p>
            <div className="space-x-2 mt-4">
              <button
                onClick={() => {
                  remove(deleteId);
                  setDeleteId(null);
                }}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Yes
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="bg-gray-300 px-4 py-2 rounded"
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
