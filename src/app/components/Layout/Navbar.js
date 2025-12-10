"use client";
import { useState, useEffect } from "react";
import { FiMenu, FiSearch, FiBell, FiLogOut } from "react-icons/fi";
import { LuPanelLeftOpen } from "react-icons/lu";
import Image from "next/image";
import useGlobalSearch from "../../hooks/useGlobalSearch";
import { useRouter } from "next/navigation";

export default function Navbar({ title, toggleSidebar, collapsed }) {
  const router = useRouter();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [query, setQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { results, loading, searchAllTables } = useGlobalSearch();

  // Logout function
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    // Redirect to main page (animated login form)
    router.push("/");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        searchAllTables(trimmedQuery);
        if (!showSearchModal) setShowSearchModal(true); // open modal if closed
      } else {
        searchAllTables("");
        if (showSearchModal) setShowSearchModal(false); // close modal if open
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]); // removed showSearchModal from dependencies

  return (
    <nav className="sticky top-0 left-0 z-[1000] bg-white flex items-center px-6 h-14 gap-6">
      {collapsed ? (
        <LuPanelLeftOpen
          size={20}
          className="cursor-pointer text-black"
          onClick={toggleSidebar}
        />
      ) : (
        <FiMenu
          size={20}
          className="cursor-pointer text-black"
          onClick={toggleSidebar}
        />
      )}
      <span className="text-[#333333] font-bold hover:text-[#003F65]">{title}</span>

      {/* Search */}
      <div className="relative ml-auto max-w-md w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowSearchModal(true);
          }}
          className="flex items-center bg-gray-100 rounded-full"
        >
          <input
            type="search"
            placeholder="Search..."
            className="bg-transparent px-4 py-2 outline-none flex-grow text-[#333333] placeholder-[#666666]"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSearchModal(true);
            }}
          />
          <button
            type="submit"
            className="bg-[#003F65] text-white p-2 rounded-full"
          >
            <FiSearch size={18} />
          </button>
        </form>

        {/* Search Modal */}
        {showSearchModal && (
          <div
            className="absolute left-0 mt-2 mr-10 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
            style={{
              width: "33vw",
              maxHeight: "60vh",
              zIndex: 999999,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F8F8F8]">
              <h3 className="text-lg font-bold text-[#333333]">
                Search Results
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-[#666666] hover:text-[#333333] transition-colors p-1 rounded hover:bg-white"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(60vh - 60px)" }}>
              {results.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-[#666666]">No results found.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {results?.map((item) => (
                    <li
                      key={`${item.type}-${item.id}`}
                      className="px-4 py-4 text-[#333333] cursor-pointer hover:bg-[#F8F8F8] transition-colors border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setShowSearchModal(false);
                        setQuery("");
                        if (item.type === "Facility") {
                          router.push(`/admin/facility/view/${item.id}`);
                        } else if (item.type === "Car") {
                          router.push(`/admin/cars/view/${item.id}`);
                        } else if (item.type === "Staff") {
                          router.push(`/admin/teams`);
                        }
                      }}
                    >
                      {item.type === "Car" ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 border-r border-gray-200 pr-4">
                              <div className="text-xs font-semibold text-[#666666] mb-1.5 uppercase tracking-wide">VIN</div>
                              <div className="text-sm font-semibold text-[#333333] break-all">{item.vin}</div>
                            </div>
                            {item.chip && (
                              <div className="flex-1 pl-4">
                                <div className="text-xs font-semibold text-[#666666] mb-1.5 uppercase tracking-wide">Chip</div>
                                <div className="text-sm font-semibold text-[#333333] break-all">{item.chip}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#003F65] bg-[#F8F8F8] px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                          </div>
                          <span className="text-sm text-[#333333]">{item.name || item.vin || item.email}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* <FiBell size={20} className="hover:animate-bounce text-[#003F65]" /> */}
      
      {/* Logout Button */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="flex items-center gap-2 px-3 py-1 text-[#FF0000] hover:bg-red-50 rounded-md transition-colors"
        title="Logout"
      >
        <FiLogOut size={16} />
        <span className="text-sm font-medium">Logout</span>
      </button>
      
      <Image
        src="/dashboard_ion.png"
        alt="Profile"
        width={36}
        height={36}
        className="rounded-full object-cover"
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <FiLogOut size={28} className="text-[#FF0000]" />
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-xl font-bold text-[#333333] mb-2 text-center">
              Logout Confirmation
            </h2>
            
            {/* Message */}
            <p className="text-[#666666] mb-6 text-center text-sm">
              Are you sure you want to logout?
            </p>
            
            {/* Buttons */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2 rounded-lg bg-[#F8F8F8] text-[#333333] hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300 min-w-[90px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="px-5 py-2 rounded-lg bg-[#FF0000] text-white hover:bg-red-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg min-w-[90px]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
