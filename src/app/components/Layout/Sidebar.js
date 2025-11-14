// // "use client";

// // import Image from "next/image";
// // import Link from "next/link";
// // import { usePathname } from "next/navigation";

// // export default function Sidebar() {
// //   const pathname = usePathname();

// //   const links = [
// //     {
// //       href: "/admin/dashboard",
// //       label: "DashBoard",
// //       image_white: "/house_white.png",
// //       image_black: "/house_black.png",
// //     },
// //     {
// //       href: "/admin/cars",
// //       label: "Cars Details",
// //       image_white: "/whitecar.jpg",
// //       image_black: "/car.png",
// //     },
// //   ];

// //   return (
// //     <div className="w-60 bg-white text-white min-h-screen p-4 space-y-4">
// //       <Image src="/MAIN_LOGO.png" alt="GPS Dashboard" width={160} height={32} />
// //       <nav className="space-y-2">
// //         {links?.map((link) => (
// //           <Link
// //             key={link.href}
// //             href={link.href}
// //             className={`flex block p-2 gap-2 text-base font-bold rounded text-black ${
// //               pathname === link.href ? "bg-[#FF5E62]" : "hover:bg-[#FF5E62]"
// //             } ${pathname === link.href ? "text-white" : "hover:text-white"}`}
// //           >
// //             <Image
// //               src={
// //                 pathname === link.href ? link?.image_white : link?.image_black
// //               }
// //               alt="GPS Dashboard"
// //               width={20}
// //               height={4}
// //             />

// //             {link.label}
// //           </Link>
// //         ))}
// //       </nav>
// //     </div>
// //   );
// // }

// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// export default function Sidebar() {
//   const pathname = usePathname();

//   const links = [
//     {
//       href: "/admin/dashboard",
//       label: "DashBoard",
//       image_white: "/house_white.png",
//       image_black: "/house_black.png",
//     },
//     {
//       href: "/admin/cars",
//       label: "Cars Details",
//       image_white: "/whitecar.jpg",
//       image_black: "/car.png",
//     },
//     // {
//     //   href: "/admin/cars", 
//     //   label: "Assign Tracker",
//     //   image_white: "/assign_white.png",
//     //   image_black: "/assign_black.png",
//     // },
//     {
//       href: "/admin/assign-tracker",
//       label: "Assign Tracker",
//       image_white: "/assign_white.png",
//       image_black: "/assign_black.png",
//     },
//   ];

//   return (
//     <div className="w-60 bg-white text-white min-h-screen p-4 space-y-4">
//       <Image src="/MAIN_LOGO.png" alt="GPS Dashboard" width={160} height={32} />
//       <nav className="space-y-2">
//         {links?.map((link) => {
//           const isActive =
//             pathname === link?.href || pathname.startsWith(link?.href + "/");
//           return (
//             <Link
//               key={link?.href}
//               href={link?.href}
//               className={`flex block p-2 gap-2 text-base font-bold rounded text-black ${
//                 isActive
//                   ? "bg-[#FF5E62] text-white"
//                   : "hover:bg-[#FF5E62] hover:text-white"
//               }`}
//             >
//               <Image
//                 src={isActive ? link?.image_white : link?.image_black}
//                 alt={link?.label}
//                 width={20}
//                 height={4}
//               />
//               {link?.label}
//             </Link>
//           );
//         })}
//       </nav>
//     </div>
//   );
// }


// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { FiSettings, FiLogOut, FiHome, FiShoppingBag, FiPieChart, FiMessageSquare, FiUsers } from "react-icons/fi";
// import { FaRegSmile,FaCar,FaParking } from "react-icons/fa";
// import { MdDashboard } from "react-icons/md";
// import Image from "next/image";

// export default function Sidebar() {
//   const pathname = usePathname();

//   const links = [
//     {
//       href: "/admin/dashboard",
//       label: "Dashboard",
//       icon: <MdDashboard size={20} />,
//     },
//      {
//       href: "/admin/facility",
//       label: "Facility",
//       icon: <FaParking size={20} />,
//     },
//     {
//       href: "/admin/cars",
//       label: "Vehicles",
//       icon: <FaCar size={20} />,
//     },
//     {
//       href: "/admin/teams",
//       label: "Team Staff",
//       icon: <FiUsers size={20} />,
//     },
//   ];

//   return (
//     <section
//       id="sidebar"
//       className="w-[220px] h-[100vh] bg-white z-[2000] transition-all ease-in-out overflow-x-hidden  flex flex-col justify-between"
//     >
//       {/* Brand */}
//       <div>
//         <Link
//           href="#"
//           className="flex items-center gap-2 text-2xl font-bold text-[#613EEA] h-14 px-4 pl-8 mt-5 sticky top-0 bg-white z-50 "
//         >
//            <Image src="/dashboard_ion.png" alt="GPS Dashboard" width={140} height={32} />
//           {/* <FaRegSmile size={24} />
//           <span>CarTrack</span> */}
//         </Link>

//         {/* Top Menu */}
//         <ul className="mt-12 space-y-2">
//           {links?.map((link) => {
//             const isActive =
//               pathname === link?.href || pathname?.startsWith(link.href + "/");
//             return (
//               <li
//                 key={link.href}
//                 className={`mx-1 rounded-l-full px-1 ${
//                   isActive ? "bg-gray-200 relative" : ""
//                 }`}
//               >
//                 {isActive && (
//                   <>
//                     <span className="absolute -top-10 right-[-4] w-10 h-10 rounded-full shadow-[20px_20px_0_theme(colors.gray.200)] z-[-1]"></span>
//                     <span className="absolute -bottom-10 right-[-4] w-10 h-10 rounded-full shadow-[20px_-20px_0_theme(colors.gray.200)] z-[-1]"></span>
//                   </>
//                 )}
//                 <Link
//                   href={link.href}
//                   className={`flex items-center gap-3 text-[16px] font-medium rounded-full px-4 py-2 whitespace-nowrap ${
//                     isActive
//                       ? "text-[#613EEA]"
//                       : "text-gray-800 hover:text-[#613EEA]"
//                   }`}
//                 >
//                   <span>{link.icon}</span>
//                   <span className="font-bold">{link.label}</span>
//                 </Link>
//               </li>
//             );
//           })}
//         </ul>
//       </div>

//       {/* Bottom Menu */}
//       <ul className="space-y-2 mb-4">
//         <li>
//           {/* <Link
//             // href="/admin/settings"
//             className="flex items-center gap-3 text-[16px] font-medium px-4 py-2 text-gray-800 hover:text-blue-600"
//           > */}
//             {/* <FiSettings size={20} className="hover:animate-spin" />
//             <span className="font-bold">Settings</span> */}
//           {/* </Link> */}
//         </li>
//         <li>
//           <Link
//             href="/"
//             className="flex items-center gap-3 text-[16px] font-medium px-4 py-2 text-red-600 hover:text-red-700"
//           >
//             <FiLogOut size={20} className="hover:animate-pulse" />
//             <span className="font-bold">Logout</span>
//           </Link>
//         </li>
//       </ul>
//     </section>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdDashboard } from "react-icons/md";
import { FaCar, FaParking } from "react-icons/fa";
import { FiUsers, FiLogOut, FiMessageSquare } from "react-icons/fi";
import Image from "next/image";

export default function Sidebar({ collapsed }) {
  const pathname = usePathname();

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
      icon: <FiUsers size={20} />,
    },
    {
      href: "/admin/reports-issues",
      label: "Reports & Issues",
      icon: <FiMessageSquare size={20} />,
    },
  ];

  return (
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
          } text-2xl font-bold text-[#613EEA] h-14 px-4 ${collapsed ?"mt-1" :"mt-5"}`}
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
                  isActive ? "bg-gray-200 relative" : ""
                }`}
              >
 {isActive && (
                  <>
                    <span className="absolute -top-10 right-[-4] w-10 h-10 rounded-full shadow-[20px_20px_0_theme(colors.gray.200)] z-[-1]"></span>
                    <span className="absolute -bottom-10 right-[-4] w-10 h-10 rounded-full shadow-[20px_-20px_0_theme(colors.gray.200)] z-[-1]"></span>
                  </>
                )}
                <Link
                  href={link.href}
                  className={`flex items-center ${
                    collapsed ? "justify-center" : "gap-3 px-4"
                  } text-[16px] font-medium rounded-full py-2 whitespace-nowrap ${
                    isActive
                      ? "text-[#613EEA]"
                      : "text-gray-800 hover:text-[#613EEA]"
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
          <Link
            href="/"
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-3 px-4"
            } text-[16px] font-medium py-2 text-red-600 hover:text-red-700`}
          >
            <FiLogOut size={20} className="hover:animate-pulse" />
            {!collapsed && <span className="font-bold">Logout</span>}
          </Link>
        </li>
      </ul>
    </section>
  );
}
