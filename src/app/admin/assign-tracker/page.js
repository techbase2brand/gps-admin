"use client"
import Header from '../../components/Layout/Header'
import Sidebar from '../../components/Layout/Sidebar'
import React, { useState } from 'react'

function page() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex bg-[#f7f8fb]">
    <Sidebar />

    <div className="flex-1 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4 text-black">
        Assign Tracker
        </h1>
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery}  />
      </div>
    </div>
  </div>
    // <div>AssignTracker</div>
  )
}

export default page