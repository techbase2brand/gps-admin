"use client";

import useGlobalSearch from "../../hooks/useGlobalSearch";
import { useState } from "react";

export default function Header({ searchQuery, setSearchQuery }) {
  const carsApiUrl = "/api/cars"; // your cars api endpoint
  const otherApiUrl = "/api/facilities"; // your second CRUD api endpoint

  // const { searchQuery, setSearchQuery, filteredResults, loading } =
  //   useGlobalSearch(carsApiUrl, otherApiUrl);

  return (
    <header className="p-4 border-b flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-[#666666] px-3 py-2 text-[#333333] rounded w-full placeholder-[#666666]"
        />
      </div>

      {/* {loading && <div>Loading data...</div>} */}

      {/* {searchQuery &&  (
        <div className="absolute top-20 right-6 bg-white shadow rounded p-4 z-10 w-[50%]">
          <h2 className="font-bold mb-2 text-black">Search Results:</h2>
          {filteredResults.length === 0 ? (
            <div className="text-black">No results found</div>
          ) : (
            <ul className="space-y-2">
              {filteredResults?.map((item, index) => (
                <li key={index} className="border-b pb-2">
                  <div className="text-black">
                  </div>
                  <div>{JSON.stringify(item)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )} */}
    </header>
  );
}
