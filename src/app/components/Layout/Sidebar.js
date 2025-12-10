"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { MdDashboard } from "react-icons/md";
import { FaCar, FaParking, FaUsers, FaComments } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import Image from "next/image";

export default function Sidebar({ collapsed }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    router.push("/");
  };

  const links = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <MdDashboard size={20} />,
    },
    {
      href: "/admin/facility",
      label: "Facility",
      icon: <FaParking size={20} />,
    },
    {
      href: "/admin/cars",
      label: "Vehicles",
      icon: <FaCar size={20} />,
    },
    {
      href: "/admin/teams",
      label: "Team Staff",
      icon: <FaUsers size={20} />,
    },
    {
      href: "/admin/reports-issues",
      label: "Reports & Issues",
      icon: <FaComments size={20} />,
    },
  ];

  return (
    <>
      <section
        id="sidebar"
        className={`${
          collapsed ? "w-[80px]" : "w-[220px]"
        } min-h-[100vh] bg-white z-[2000] transition-all duration-300 ease-in-out overflow-x-hidden flex flex-col`}
      >
        {/* Brand */}
        <div className="flex-shrink-0">
          <Link
            href="#"
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-2 pl-8"
            } text-2xl font-bold text-[#003F65] h-14 px-4 ${collapsed ?"mt-1" :"mt-5"}`}
          >
            <Image
              src="/dashboard_ion.png"
              alt="GPS Dashboard"
              width={collapsed ? 60 : 140}
              height={32}
            />
          </Link>

          {/* Top Menu */}
          <ul className="mt-12 space-y-2">
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <li
                  key={link.href}
                  className={`mx-1 rounded-l-full px-1 ${
                    isActive ? "bg-[#F8F8F8] relative" : ""
                  }`}
                >
                  <Link
                    href={link.href}
                    className={`flex items-center ${
                      collapsed ? "justify-center" : "gap-3 px-4"
                    } text-[16px] font-medium rounded-full py-2 whitespace-nowrap ${
                      isActive
                        ? "text-[#003F65]"
                        : "text-[#333333] hover:text-[#003F65]"
                    }`}
                  >
                    <span>{link.icon}</span>
                    {!collapsed && <span className="font-bold">{link.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Menu */}
        <ul className="space-y-2 mb-4 mt-auto">
          <li>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`flex items-center ${
                collapsed ? "justify-center" : "gap-3 px-4"
              } text-[16px] font-medium py-2 text-[#FF0000] hover:text-[#FF0000] w-full`}
            >
              <FiLogOut size={20} className="hover:animate-pulse" />
              {!collapsed && <span className="font-bold">Logout</span>}
            </button>
          </li>
        </ul>
      </section>

      {/* Logout Confirmation Modal - Outside sidebar to prevent re-render issues */}
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
    </>
  );
}
