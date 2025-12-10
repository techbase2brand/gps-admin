
export default function DashboardCard({ title, count, iconSrc, progressColor }) {
  return (

     <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
      {/* Icon Container */}
      <div className="bg-[#F8F8F8] p-3 rounded-lg">
        {iconSrc}
      </div>

      {/* Content */}
      <div>
        <div className="text-lg font-bold text-[#333333]">{count}</div>
        <div className="text-[#333333] text-sm ">{title}</div>
      </div>
    </div>
  );
}
