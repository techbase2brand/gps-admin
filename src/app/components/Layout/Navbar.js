"use client";
import { useState, useEffect } from "react";
import { FiMenu, FiSearch, FiBell, FiLogOut } from "react-icons/fi";
import { LuPanelLeftOpen } from "react-icons/lu";
import Image from "next/image";
import useGlobalSearch from "../../hooks/useGlobalSearch";
import { useRouter } from "next/navigation";

export default function Navbar({ title, toggleSidebar, collapsed, onLogoutModalChange }) {
  const router = useRouter();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [query, setQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { results, loading, searchAllTables } = useGlobalSearch();

  // Notify parent when logout modal state changes
  useEffect(() => {
    if (onLogoutModalChange) {
      onLogoutModalChange(showLogoutConfirm);
    }
  }, [showLogoutConfirm, onLogoutModalChange]);

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
      
      <span className="text-[#333333] font-bold hover:text-black">{title}</span>

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
            className="bg-black text-white p-2 rounded-full"
          >
            <FiSearch size={18} />
          </button>
        </form>

        {showSearchModal && (
          <>
            {/* Backdrop for outside clicks */}
            <div
              className="fixed inset-0 z-[999998]"
              onClick={() => setShowSearchModal(false)}
            />

            {/* Search Modal - Changed left-0 to right-0 */}
            <div
              className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-2xl overflow-hidden"
              style={{
                width: "400px", // Fixed width is safer than vw for dropdowns
                maxHeight: "60vh",
                zIndex: 999999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-white">
                <h3 className="text-sm font-bold text-gray-900">Search Results</h3>
                <button onClick={() => setShowSearchModal(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              {/* Results List */}
              <div className="overflow-y-auto" style={{ maxHeight: "calc(60vh - 56px)" }}>
                {results.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No results found
                  </div>
                ) : (
                  <ul className="flex flex-col">
                    {results?.map((item) => (
                      <li
                        key={`${item.type}-${item.id}`}
                        className="px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-all"
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
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">{item.type}</span>
                          <span className="text-sm font-medium text-gray-800">{item.name || item.vin}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

      </div>

      {/* <FiBell size={20} className="hover:animate-bounce text-black" /> */}

      {/* Logout Button */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="flex items-center gap-2 px-3 py-1 text-[#FF0000] hover:bg-red-50 rounded-md transition-colors"
        title="Logout"
      >
        <FiLogOut size={16} />
        {/* <span className="text-sm font-medium">Logout</span> */}
      </button>

      {/* <Image
        src="/nissan.png"
        alt="Profile"
        width={36}
        height={36}
        className="rounded-full object-cover"
        unoptimized
      /> */}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] animate-fadeIn"
          onClick={() => setShowLogoutConfirm(false)}
          style={{ width: '100vw', height: '100vh' }}
        >
          <div
            className="bg-white text-black rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 bg-black rounded-full  flex items-center justify-center">
                <FiLogOut size={28} className="text-[#FF0000]" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-black mb-2 text-center">
              Logout Confirmation
            </h2>

            {/* Message */}
            <p className="text-black mb-6 text-center text-sm">
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
