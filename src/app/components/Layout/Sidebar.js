// import Link from "next/link";

// export default function Sidebar() {
//   return (
//     <div className="w-60 bg-gray-800 text-white min-h-screen p-4 space-y-4">
//       <h2 className="text-lg font-bold">GPS Dashboard</h2>
//       <nav className="space-y-2">
//         <Link href="/admin/dashboard" className="block hover:bg-gray-700 p-2 rounded">Facility</Link>
//         <Link href="/admin/cars" className="block hover:bg-gray-700  p-2 rounded">Cars Details</Link>
//       </nav>
//     </div>
//   );
// }

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin/dashboard", label: "DashBoard", image_white:"/house_white.png", image_black:"/house_black.png" },
    { href: "/admin/cars", label: "Cars Details",image_white:"/house_white.png", image_black:"/house_black.png" },
  ];

  return (
    <div className="w-60 bg-white text-white min-h-screen p-4 space-y-4">
      <Image
        src="/MAIN_LOGO.png" 
        alt="GPS Dashboard"
        width={160} 
        height={32} 
      />
      <nav className="space-y-2">
        {links?.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex block p-2 gap-2 text-base font-bold rounded text-black ${
              pathname === link.href ? "bg-[#FF5E62]" : "hover:bg-[#FF5E62]"
            } ${pathname === link.href ? "text-white" : "hover:text-white"}`}
          >
            <Image
              src={ pathname === link.href ? link?.image_white : link?.image_black}
              alt="GPS Dashboard"
              width={20} 
              height={4} 
            />
            
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
