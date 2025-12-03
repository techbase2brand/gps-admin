// "use client"
// import { useRouter } from "next/navigation";
// import { useLocalStorageCRUD } from "../hooks/useLocalStorageCRUD";
// import { useEffect, useState } from "react";

// export default function CarForm() {
//   const { data, add, update } = useLocalStorageCRUD("cars");
//   const router = useRouter();
// //   const { id } = router?.query;

//   const [car, setCar] = useState({
//     id: Date.now(),
//     vin: "",
//     yardNo: "",
//     slotNo: "",
//     trackerNo: "",
//   });

// //   useEffect(() => {
// //     if (id) {
// //       const existing = data.find((c) => c.id == id);
// //       if (existing) setCar(existing);
// //     }
// //   }, [id, data]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//    add(car);
//     router.push("/admin/cars");
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-96 space-y-4">
//         <h1 className="text-xl font-bold text-black">{ "Add Car"}</h1>
//         <input
//           type="text"
//           placeholder="VIN"
//           className="border p-2 w-full text-black"
//           value={car.vin}
//           onChange={(e) => setCar({ ...car, vin: e.target.value })}
//         />
//         <input
//           type="text"
//           placeholder="Yard Number "
//           className="border p-2 w-full text-black"
//           value={car.yardNo}
//           onChange={(e) => setCar({ ...car, yardNo: e.target.value })}
//         />
//         <input
//           type="text"
//           placeholder="Slot Number"
//           className="border p-2 w-full text-black"
//           value={car.slotNo}
//           onChange={(e) => setCar({ ...car, slotNo: e.target.value })}
//         />
//         <input
//           type="text"
//           placeholder="Tracker Number"
//           className="border p-2 w-full text-black"
//           value={car.trackerNo}
//           onChange={(e) => setCar({ ...car, trackerNo: e.target.value })}
//         />
//         <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">
//           {"Add"}

//           {/* {id ? "Update" : "Add"} */}
//         </button>
//       </form>
//     </div>
//   );
// }

"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useCRUD from "../hooks/useCRUD";
import useCarsCRUD from "../hooks/useCarsCRUD";

export default function CarForm({
  defaultValues,
  fetchAll,
  updateItem,
  addItem,
  closeModal,
  existingCars = [],
}) {
  const router = useRouter();
  const isEdit = defaultValues !== "add";

  const [car, setCar] = useState({
    vin: "" || defaultValues?.vin,
    chip: "" || defaultValues?.chip,
    slotNo: "" || defaultValues?.slotNo,
    trackerNo: "" || defaultValues?.trackerNo,
    facilityId: "" || defaultValues?.facilityId,
    make: "" || defaultValues?.make,
    model: "" || defaultValues?.model,
    color: "" || defaultValues?.color,
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("carss", car, defaultValues);
  console.log("existingCars for duplicate check:", existingCars);
  const { data: facilities } = useCRUD("facility");
  // const { addItem, updateItem, fetchAll } = useCarsCRUD("/api/cars");

  const handleChange = (name, value) => {
    setCar({ ...car, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // VIN validation
    if (!car.vin.trim()) {
      newErrors.vin = "VIN is required";
    } else if (car.vin.trim().length < 3) {
      newErrors.vin = "VIN must be at least 3 characters";
    } else {
      // Check for duplicate VIN (skip check if editing the same car)
      const duplicateVin = existingCars?.find(
        (existingCar) => 
          existingCar.vin && existingCar.vin.toLowerCase() === car.vin.trim().toLowerCase() &&
          existingCar.id !== defaultValues?.id
      );
      if (duplicateVin) {
        const facility = facilities?.find(f => f.id.toString() === duplicateVin.facilityId?.toString());
        const facilityName = facility?.name || 'Unknown Facility';
        newErrors.vin = `This VIN is already added in ${facilityName}`;
      }
    }

    // Chip validation
    if (!car.chip.trim()) {
      newErrors.chip = "Chip is required";
    } else if (car.chip.trim().length < 2) {
      newErrors.chip = "Chip must be at least 2 characters";
    } else {
      // Check for duplicate Chip (skip check if editing the same car)
      const duplicateChip = existingCars?.find(
        (existingCar) => 
          existingCar.chip && existingCar.chip.toLowerCase() === car.chip.trim().toLowerCase() &&
          existingCar.id !== defaultValues?.id
      );
      if (duplicateChip) {
        const facility = facilities?.find(f => f.id.toString() === duplicateChip.facilityId?.toString());
        const facilityName = facility?.name || 'Unknown Facility';
        const vinNumber = duplicateChip.vin || 'Unknown VIN';
        newErrors.chip = `This Chip already exists in ${facilityName} with VIN: ${vinNumber}`;
      }
    }

    // Slot Number validation
    if (!car.slotNo.trim()) {
      newErrors.slotNo = "Slot Number is required";
    } else if (car.slotNo.trim().length < 1) {
      newErrors.slotNo = "Slot Number is required";
    } else if (car.facilityId) {
      // Check for duplicate slot in same facility (skip check if editing the same car)
      const duplicateSlot = existingCars?.find(
        (existingCar) => 
          existingCar.slotNo && existingCar.slotNo.toLowerCase() === car.slotNo.trim().toLowerCase() &&
          existingCar.facilityId?.toString() === car.facilityId?.toString() &&
          existingCar.id !== defaultValues?.id
      );
      if (duplicateSlot) {
        const facility = facilities?.find(f => f.id.toString() === car.facilityId?.toString());
        const facilityName = facility?.name || 'Unknown Facility';
        newErrors.slotNo = `Slot ${car.slotNo} is already occupied in ${facilityName} by VIN: ${duplicateSlot.vin}`;
      }
    }

    // Make validation
    if (!car.make.trim()) {
      newErrors.make = "Make is required";
    } else if (car.make.trim().length < 2) {
      newErrors.make = "Make must be at least 2 characters";
    }

    // Model validation
    if (!car.model.trim()) {
      newErrors.model = "Model is required";
    } else if (car.model.trim().length < 2) {
      newErrors.model = "Model must be at least 2 characters";
    }

    // Color validation
    if (!car.color.trim()) {
      newErrors.color = "Color is required";
    } else if (car.color.trim().length < 2) {
      newErrors.color = "Color must be at least 2 characters";
    }

    // Facility validation and slots check
    if (!car.facilityId) {
      newErrors.facilityId = "Facility selection is required";
    } else {
      // Check available slots in selected facility
      const selectedFacility = facilities?.find(f => f.id.toString() === car.facilityId.toString());
      
      if (selectedFacility && selectedFacility.parkingSlots) {
        // Count cars in this facility (excluding current car if editing)
        const carsInFacility = existingCars?.filter(
          existingCar => 
            existingCar.facilityId?.toString() === car.facilityId?.toString() &&
            existingCar.id !== defaultValues?.id
        ).length || 0;

        const totalSlots = parseInt(selectedFacility.parkingSlots);
        const availableSlots = totalSlots - carsInFacility;

        console.log('Facility:', selectedFacility.name);
        console.log('Total Slots:', totalSlots);
        console.log('Cars in Facility:', carsInFacility);
        console.log('Available Slots:', availableSlots);

        // If adding new car (not editing) and no slots available
        if (!isEdit && availableSlots <= 0) {
          newErrors.facilityId = `This yard has no available slots. Total: ${totalSlots}, Occupied: ${carsInFacility}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit) {
        await updateItem({ id: Number(defaultValues?.id), ...car });
      } else {
        await addItem(car);
      }
      closeModal();
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ submit: "Failed to save car. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex">
      <form onSubmit={handleSubmit} className="bg-white rounded w-96 space-y-4">
        <div>
          <input
            type="text"
            placeholder="VIN"
            className={`border p-2 w-full text-black ${errors.vin ? 'border-red-500' : 'border-gray-300'}`}
            value={car.vin}
            onChange={(e) => handleChange('vin', e.target.value)}
            required
          />
          {errors.vin && <p className="text-red-500 text-sm mt-1">{errors.vin}</p>}
        </div>
        
        <div>
          <input
            type="text"
            placeholder="Chip"
            className={`border p-2 w-full text-black ${errors.chip ? 'border-red-500' : 'border-gray-300'}`}
            value={car.chip}
            onChange={(e) => handleChange('chip', e.target.value)}
            required
          />
          {errors.chip && <p className="text-red-500 text-sm mt-1">{errors.chip}</p>}
        </div>
        
        <div>
          <input
            type="text"
            placeholder="Slot Number"
            className={`border p-2 w-full text-black ${errors.slotNo ? 'border-red-500' : 'border-gray-300'}`}
            value={car.slotNo}
            onChange={(e) => handleChange('slotNo', e.target.value)}
            required
          />
          {errors.slotNo && <p className="text-red-500 text-sm mt-1">{errors.slotNo}</p>}
        </div>

        <div>
          <input
            type="text"
            placeholder="Make"
            className={`border p-2 w-full text-black ${errors.make ? 'border-red-500' : 'border-gray-300'}`}
            value={car.make}
            onChange={(e) => handleChange('make', e.target.value)}
            required
          />
          {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make}</p>}
        </div>

        <div>
          <input
            type="text"
            placeholder="Model"
            className={`border p-2 w-full text-black ${errors.model ? 'border-red-500' : 'border-gray-300'}`}
            value={car.model}
            onChange={(e) => handleChange('model', e.target.value)}
            required
          />
          {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
        </div>
        
        <div>
          <input
            type="text"
            placeholder="Color"
            className={`border p-2 w-full text-black ${errors.color ? 'border-red-500' : 'border-gray-300'}`}
            value={car.color}
            onChange={(e) => handleChange('color', e.target.value)}
            required
          />
          {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
        </div>

        <div>
          <select
            className={`border p-2 w-full text-black ${errors.facilityId ? 'border-red-500' : 'border-gray-300'}`}
            value={car.facilityId}
            onChange={(e) => {
              const selectedFacility = facilities?.find(f => f.id.toString() === e.target.value);
              handleChange('facilityId', selectedFacility?.id || '');
            }}
            required
          >
            <option value="">Select Facility</option>
            {facilities?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          {errors.facilityId && <p className="text-red-500 text-sm mt-1">{errors.facilityId}</p>}
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        <div className="fixed bottom-0 left-0 w-full max-w-md bg-white p-4 border-t flex justify-between gap-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-500 text-white px-4 py-2 w-[50%] rounded hover:bg-gray-600"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 w-[50%] rounded text-white ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#613EEA] hover:bg-[#613EEA]'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? 'Saving...' 
              : (isEdit ? "Update Car" : "Add Car")
            }
          </button>
        </div>
      </form>
    </div>
  );
}
