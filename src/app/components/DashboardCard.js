import Image from "next/image";
import { FiCalendar } from "react-icons/fi";
export default function DashboardCard({ title, count, iconSrc, progressColor }) {
  return (

     <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
      {/* Icon Container */}
      <div className="bg-orange-100 p-3 rounded-lg">
        {iconSrc}
      </div>

      {/* Content */}
      <div>
        <div className="text-lg font-bold text-black">{count}</div>
        <div className="text-black text-sm ">{title}</div>
      </div>
    </div>
    // <div className="bg-white rounded-lg shadow p-4 w-64">
    //   <div className="flex justify-between items-center mb-2">
    //     <div>
    //       <h3 className="text-md font-medium text-black">{title}</h3>
    //       <p className="text-2xl font-bold text-black">{count.toLocaleString()}</p>
    //     </div>
    //     <Image src={iconSrc} alt={"title"} width={40} height={40} />
    //   </div>
    //   <div className="w-full bg-gray-200 rounded-full h-1.5">
    //     <div
    //       className={`h-1.5 rounded-full ${progressColor}`}
    //       style={{ width: "50%" }} // adjust progress as needed
    //     ></div>
    //   </div>
    // </div>
  );
}
