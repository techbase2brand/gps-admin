"use client";
import { useState, useEffect } from "react";
import { IoEyeOutline } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import useReportsIssuesCRUD from "../hooks/useReportsIssuesCRUD";

const TABLE_NAME = "report_issues";

export default function ReportsIssuesTable({ searchQuery }) {
 
  const {
    data,
    deleteItem,
    fetchAll,
    updateItem,
    loading,
  } = useReportsIssuesCRUD(TABLE_NAME);
  
  const [deleteId, setDeleteId] = useState(null);
  const [localSearch, setLocalSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Filter data - only search filter
  const filteredData = data?.filter((issue) => {
    if (localSearch === "") return true;
    
    return [
      issue.user_name,
      issue.user_email,
      issue.issue_title,
      issue.issue_category,
      issue.issue_description,
      issue.status,
      issue.priority,
    ].some((field) =>
      field?.toString().toLowerCase().includes(localSearch.toLowerCase())
    );
  });

  const handleReset = () => {
    setLocalSearch("");
  };

  const handleView = (issue) => {
    setSelectedIssue(issue);
    setIsViewModalOpen(true);
  };

  const handleEdit = (issue) => {
    setEditingIssue(issue);
    setAdminNotes(issue.admin_notes || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingIssue) return;
    
    try {
      await updateItem({
        ...editingIssue,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      });
      setIsEditModalOpen(false);
      setEditingIssue(null);
      setAdminNotes("");
      fetchAll();
    } catch (err) {
      console.error("Error updating issue:", err);
    }
  };

  const handleStatusChange = async (issue, newStatus) => {
    try {
      const updateData = {
        ...issue,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      
      if (newStatus === "Resolved" && !issue.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      
      await updateItem(updateData);
      fetchAll();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "in progress":
        return "bg-blue-100 text-blue-700";
      case "open":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Debug: Log data to console
  useEffect(() => {
    if (!loading) {
      // console.log("Reports & Issues Data:", data);
      // console.log("Data count:", data?.length);
      // console.log("Table name being used:", TABLE_NAME);
      // console.log("Filtered data count:", filteredData?.length);
      if (data?.length === 0) {
        // console.warn("No data found. ");
        // console.warn("No data found. Please check if table name is correct:", TABLE_NAME);
        // console.warn("Common table names: 'reports_issues', 'reports_and_issues', 'reports', 'issues'");
      }
    }
  }, [data, loading, filteredData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-[#333333] text-lg">Loading reports and issues...</p>
        </div>
      </div>
    );
  }

  return (

    <div>

      {/* Search Bar and Filters */}
      <div className="mb-4 flex justify-between items-center mt-10 mb-10">

        <div className="flex space-x-3 items-center">
          <input
            type="text"
            placeholder="Search issues..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-80 px-4 py-2 border border-gray-300  bg-white rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-black"
          />

          {localSearch && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Reset
            </button>
          )}

        </div>

      </div>

      {/* Table */}
      <div className="overflow-x-auto">

        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
         
          <thead>
            <tr className="text-left border-b bg-black">
              <th className="text-start px-4 py-2 text-white">ID</th>
              <th className="text-start px-4 py-2 text-white">User Name</th>
              <th className="text-start px-4 py-2 text-white">User Email</th>
              <th className="text-start px-4 py-2 text-white">Issue Title</th>
              <th className="text-start px-4 py-2 text-white">Category</th>
              <th className="text-start px-4 py-2 text-white">Status</th>
              <th className="text-start px-4 py-2 text-white">Priority</th>
              <th className="text-start px-4 py-2 text-white">Created At</th>
              <th className="text-start px-4 py-2 text-white">Actions</th>
            </tr>
          </thead>
         
          <tbody>
            {filteredData?.length > 0 ? (
              filteredData.map((issue) => (
                <tr key={issue?.id} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="text-start px-4 py-2 text-black">{issue?.id}</td>
                  <td className="text-start px-4 py-2 text-black">
                    {issue?.user_name || "N/A"}
                  </td>
                  <td className="text-start px-4 py-2 text-black">
                    {issue?.user_email || "N/A"}
                  </td>
                  <td className="text-start px-4 py-2 text-black max-w-xs truncate">
                    {issue?.issue_title || "N/A"}
                  </td>
                  <td className="text-start px-4 py-2 text-black">
                    {issue?.issue_category || "N/A"}
                  </td>
                  <td className="text-start px-4 py-2 text-black">
                    <select
                      value={issue?.status || ""}
                      onChange={(e) => handleStatusChange(issue, e.target.value)}
                      className={`px-3 py-1 rounded-full cursor-pointer text-sm font-medium border-0 ${getStatusColor(issue?.status)}`}
                    >
                      <option value="Open">Open</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="text-start px-4 py-2 text-black">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(issue?.priority)}`}
                    >
                      {issue?.priority || "N/A"}
                    </span>
                  </td>
                  <td className="text-start px-4 py-2 text-black text-sm">
                    {formatDate(issue?.created_at)}
                  </td>
                  <td className="px-4 py-2 space-x-2 text-black">
                    <button
                      onClick={() => handleView(issue)}
                      className="px-2 py-2 rounded hover:bg-gray-100"
                      title="View Details"
                    >
                      <IoEyeOutline size={20} className="text-black cursor-pointer" />
                    </button>
                    <button
                      onClick={() => handleEdit(issue)}
                      className="px-2 py-2 rounded hover:bg-gray-100"
                      title="Edit"
                    >
                      <FiEdit size={16} className="text-green-500 cursor-pointer" />
                    </button>
                    <button
                      onClick={() => setDeleteId(issue.id)}
                      className="px-2 py-2 rounded hover:bg-gray-100"
                      title="Delete"
                    >
                      <MdDeleteOutline size={20} className="text-red-500 cursor-pointer" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-10">
                  <p className="text-gray-500 text-lg">No issues found</p>
                </td>
              </tr>
            )}
          </tbody>

        </table>

      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Issue Details</h2>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedIssue(null);
                }}
                className="text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">ID</label>
                <p className="text-black">{selectedIssue.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">User ID</label>
                <p className="text-black">{selectedIssue.user_id || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">User Name</label>
                <p className="text-black">{selectedIssue.user_name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">User Email</label>
                <p className="text-black">{selectedIssue.user_email || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Issue Title</label>
                <p className="text-black">{selectedIssue.issue_title || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="text-black">{selectedIssue.issue_category || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-black whitespace-pre-wrap">{selectedIssue.issue_description || "N/A"}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-black">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedIssue.status)}`}>
                      {selectedIssue.status || "N/A"}
                    </span>
                  </p>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <p className="text-black">
                    <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(selectedIssue.priority)}`}>
                      {selectedIssue.priority || "N/A"}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                <p className="text-black whitespace-pre-wrap">{selectedIssue.admin_notes || "No notes added"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-black text-sm">{formatDate(selectedIssue.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Updated At</label>
                  <p className="text-black text-sm">{formatDate(selectedIssue.updated_at)}</p>
                </div>
                {selectedIssue.resolved_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Resolved At</label>
                    <p className="text-black text-sm">{formatDate(selectedIssue.resolved_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingIssue && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Edit Issue</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingIssue(null);
                  setAdminNotes("");
                }}
                className="text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-black"
                  placeholder="Add admin notes here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editingIssue.status || ""}
                  onChange={(e) =>
                    setEditingIssue({ ...editingIssue, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-black"
                >
                  <option value="Open">Open</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingIssue(null);
                  setAdminNotes("");
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-black text-white rounded hover:bg-black cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
          <h3 className="text-lg text-[#333333] font-semibold mb-4">
                         Confirm Delete
                      </h3>
            <p className="mb-6 text-black">Are you sure you want to delete this issue?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-lg rounded"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteItem(deleteId);
                    setDeleteId(null);
                  } catch (err) {
                    console.error("Error deleting issue:", err);
                  }
                }}
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

