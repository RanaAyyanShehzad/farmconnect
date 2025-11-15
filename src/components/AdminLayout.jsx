import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import ChatBot from "./Chat";

// export default function AdminLayout() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="flex h-screen bg-green-200">
//       <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
//       <div className="flex flex-col flex-1 overflow-hidden">
//         <Header setSidebarOpen={setSidebarOpen} />
//         <main className="flex-1 overflow-y-auto scrollbar-hide bg-green-200 p-4  md:p-6">
//           <Outlet /> {/* 👈 renders nested routes here */}
//         </main>
//       </div>
//     </div>
//   );
// }
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-green-200">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-green-200 p-4 md:p-6">
          <Outlet /> {/* 👈 renders nested routes here */}
        </main>

        {/* 👇 Add chatbot here */}
       
      </div>
    </div>
  );
}
