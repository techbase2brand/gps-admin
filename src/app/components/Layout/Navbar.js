"use client";

import { useState } from "react";
import { FiMenu, FiSearch, FiBell, FiSun, FiMoon } from "react-icons/fi";
import Image from "next/image";

export default function Navbar({title}) {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleNotifications = () => setShowNotifications(!showNotifications);
  const toggleProfile = () => setShowProfile(!showProfile);

  return (
    <nav className="sticky top-0 left-0 z-[1000] bg-white  flex items-center px-6 h-14 gap-6">
      {/* Menu Icon */}
      <FiMenu size={20} className="cursor-pointer text-black " />

      {/* Categories Link */}
      <span  className="text-black text-bold hover:text-blue-600">
        {title}
      </span>

      {/* Search Form */}
      <form className="flex items-center bg-gray-100 rounded-full ml-auto max-w-md w-full">
        <input
          type="search"
          placeholder="Search..."
          className="bg-transparent px-4 py-2 outline-none flex-grow text-black placeholder-black"
        />
        <button
          type="submit"
          className="bg-[#613EEA] text-white p-2 rounded-full"
        >
          <FiSearch size={18} />
        </button>
      </form>

      {/* Dark Mode Switch */}
      {/* <div className="flex items-center">
        <input
          type="checkbox"
          id="switch-mode"
          className="hidden"
          checked={darkMode}
          onChange={toggleDarkMode}
        />
        <label
          htmlFor="switch-mode"
          className="bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-between p-1 w-12 cursor-pointer relative"
        >
          <FiMoon className="text-yellow-500" size={14} />
          <FiSun className="text-orange-500" size={14} />
          <div
            className={`bg-blue-600 rounded-full w-5 h-5 absolute top-0.5 transform transition-transform ${
              darkMode ? "translate-x-6" : "translate-x-0.5"
            }`}
          ></div>
        </label>
      </div> */}

      {/* Notification Bell */}
      <div className="relative">
        <button onClick={toggleNotifications} className="relative text-gray-800 dark:text-white">
          <FiBell size={20} className="hover:animate-bounce text-[#613EEA]" />
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            8
          </span>
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 bg-white dark:bg-gray-700 rounded-xl shadow-lg w-64 max-h-72 overflow-y-auto z-50">
            <ul className="text-gray-800 dark:text-white">
              {[
                "New message from John",
                "Your order has been shipped",
                "New comment on your post",
                "Update available for your app",
                "Reminder: Meeting at 3PM",
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button onClick={toggleProfile}>
          <Image
            src="/dashboard_ion.png"
            alt="Profile"
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        </button>

        {showProfile && (
          <div className="absolute right-0 top-12 bg-white dark:bg-gray-700 rounded-xl shadow-lg w-48 z-50">
            <ul className="text-gray-800 dark:text-white">
              <li className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
                <a href="#">My Profile</a>
              </li>
              <li className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
                <a href="#">Settings</a>
              </li>
              <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                <a href="#">Log Out</a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
