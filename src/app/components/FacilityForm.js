"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useCRUD from "../hooks/useCRUD";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function FacilityForm({
  defaultValues,
  addItem,
  updateItem,
  closeModal,
}) {
  const router = useRouter();
  const { data: existingFacilities } = useCRUD("facility");
  const [form, setForm] = useState({
    name: "" || defaultValues?.name,
    number: "" || defaultValues?.number,
    city: "" || defaultValues?.city,
    address: "" || defaultValues?.address,
    lat: "" || defaultValues?.lat,
    long: "" || defaultValues?.long,
    parkingSlots: "" || defaultValues?.parkingSlots,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingForPolygon, setIsSavingForPolygon] = useState(false);
  
  // Check if we're in edit mode
  const isEditMode = defaultValues && defaultValues !== "add" && defaultValues?.id;

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    if (!isEditMode || !defaultValues) return false;
    
    return (
      form.name !== (defaultValues?.name || "") ||
      form.number !== (defaultValues?.number || "") ||
      form.city !== (defaultValues?.city || "") ||
      form.address !== (defaultValues?.address || "") ||
      form.lat !== (defaultValues?.lat || "") ||
      form.long !== (defaultValues?.long || "") ||
      form.parkingSlots !== (defaultValues?.parkingSlots || "")
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = "Facility name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Facility name must be at least 2 characters";
    }

    // Number validation
    if (!form.number.trim()) {
      newErrors.number = "Facility number is required";
    } else if (!/^[A-Za-z0-9\s-]+$/.test(form.number.trim())) {
      newErrors.number = "Facility number can only contain letters, numbers, spaces, and hyphens";
    } else {
      // Check for duplicate facility number (skip check if editing the same facility)
      const duplicateNumber = existingFacilities?.find(
        (existingFacility) => 
          existingFacility.number && 
          existingFacility.number.trim().toLowerCase() === form.number.trim().toLowerCase() &&
          existingFacility.id !== defaultValues?.id
      );
      if (duplicateNumber) {
        newErrors.number = "This facility number is already added";
      }
    }

    // City validation
    if (!form.city.trim()) {
      newErrors.city = "City is required";
    } else if (form.city.trim().length < 2) {
      newErrors.city = "City name must be at least 2 characters";
    }

    // Address validation
    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    } else if (form.address.trim().length < 10) {
      newErrors.address = "Address must be at least 10 characters";
    }

    // Parking slots validation
    if (!form.parkingSlots) {
      newErrors.parkingSlots = "Number of parking slots is required";
    } else if (isNaN(form.parkingSlots) || parseInt(form.parkingSlots) < 1) {
      newErrors.parkingSlots = "Parking slots must be a number greater than 0";
    } else if (parseInt(form.parkingSlots) > 1000) {
      newErrors.parkingSlots = "Parking slots cannot exceed 1000";
    }

    // Latitude validation (optional but if provided, must be valid)
    if (form.lat && (isNaN(form.lat) || parseFloat(form.lat) < -90 || parseFloat(form.lat) > 90)) {
      newErrors.lat = "Latitude must be between -90 and 90";
    }

    // Longitude validation (optional but if provided, must be valid)
    if (form.long && (isNaN(form.long) || parseFloat(form.long) < -180 || parseFloat(form.long) > 180)) {
      newErrors.long = "Longitude must be between -180 and 180";
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
      if (defaultValues == "add") {
        const newFacility = await addItem(form);
        closeModal();
        // Redirect to view page with new facility ID
        if (newFacility && newFacility.id) {
          router.push(`/admin/facility/view/${newFacility.id}`);
        } else {
          // Fallback to facility list if ID not available
          router.push("/admin/facility");
        }
      } else {
        await updateItem({ id: Number(defaultValues?.id), ...form });
        closeModal();
        // Redirect to view page after successful edit
        router.push(`/admin/facility/view/${defaultValues?.id}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ submit: "Failed to save facility. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPolygon = async () => {
    if (!isEditMode || !defaultValues?.id) return;

    // Check if there are unsaved changes
    if (hasUnsavedChanges()) {
      // Validate form first
      if (!validateForm()) {
        setErrors({ submit: "Please fix form errors before saving." });
        return;
      }

      setIsSavingForPolygon(true);
      try {
        // Save the form first
        await updateItem({ id: Number(defaultValues?.id), ...form });
        // After successful save, navigate to view page
        router.push(`/admin/facility/view/${defaultValues.id}`);
      } catch (error) {
        console.error("Error saving facility before polygon edit:", error);
        setErrors({ submit: "Failed to save facility. Please try again." });
      } finally {
        setIsSavingForPolygon(false);
      }
    } else {
      // No changes, directly navigate to view page
      router.push(`/admin/facility/view/${defaultValues.id}`);
    }
  };

  return (
    <div className="flex">
      <form
        onSubmit={handleSubmit}
        className="bg-white  rounded  w-96 space-y-4"
      >
        <div>
          <input
            name="name"
            placeholder="Facility Name"
            className={`border p-2 w-full text-black ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            value={form.name}
            onChange={handleChange}
            required
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <input
            name="number"
            placeholder="Facility Number"
            className={`border p-2 w-full text-black ${errors.number ? 'border-red-500' : 'border-gray-300'}`}
            value={form.number}
            onChange={handleChange}
            required
          />
          {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
        </div>
        <div>
          <input
            name="city"
            placeholder="City"
            className={`border p-2 w-full text-black ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
            value={form.city}
            onChange={handleChange}
            required
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>
        <div>
          <input
            name="address"
            placeholder="Facility Address"
            className={`border p-2 w-full text-black ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
            value={form.address}
            onChange={handleChange}
            required
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>
        <div>
          <input
            name="parkingSlots"
            type="number"
            placeholder="Number of Parking Slots"
            className={`border p-2 w-full text-black ${errors.parkingSlots ? 'border-red-500' : 'border-gray-300'}`}
            value={form.parkingSlots}
            onChange={handleChange}
            min="1"
            max="1000"
            required
          />
          {errors.parkingSlots && <p className="text-red-500 text-sm mt-1">{errors.parkingSlots}</p>}
        </div>
        {/* Error message */}
        {errors.submit && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Edit Polygon Button - Only show in edit mode, above bottom buttons */}
        {isEditMode && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleEditPolygon}
              disabled={isSavingForPolygon || isSubmitting}
              className={`w-full bg-[#613EEA] text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-[#5030d0] transition-colors ${
                isSavingForPolygon || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaMapMarkerAlt size={16} />
              {isSavingForPolygon ? 'Saving...' : 'Edit Polygon on Map'}
            </button>
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
              : (defaultValues == "add" ? "Add Facility" : "Edit Facility")
            }
          </button>
        </div>
      </form>
    </div>
  );
}
