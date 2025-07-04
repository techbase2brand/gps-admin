
import Sidebar from "../../components/Layout/Sidebar";
import CarsTable from "../../components/CarsTable";

export default function Cars() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">Cars Details</h1>
        <CarsTable />
      </div>
    </div>
  );
}
