import React, { useState, useEffect } from "react";
import axios from "axios";

function getOrderStatus(order) {
  return (order?.orderStatus || order?.status || "").toLowerCase();
}

function SupplierDashboard() {
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch active orders count
        const ordersResponse = await axios.get(
          "https://agrofarm-vd8i.onrender.com/api/v1/order/supplier-orders",
          {
            withCredentials: true,
          }
        );

        const ordersData = ordersResponse.data || {};
        let orders = [];

        if (ordersData.success !== undefined) {
          if (ordersData.success) {
            orders = ordersData.orders || [];
          } else {
            throw new Error(ordersData.message || "Failed to load orders");
          }
        } else {
          orders = ordersData.orders || ordersData || [];
        }

        setActiveOrdersCount(orders.length);

        // Calculate revenue from completed orders in current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const completedOrders = orders.filter((order) => {
          const status = getOrderStatus(order);
          return (
            status === "delivered" &&
            new Date(order.createdAt).getMonth() === currentMonth &&
            new Date(order.createdAt).getFullYear() === currentYear
          );
        });

        const monthlyRevenue = completedOrders.reduce(
          (sum, order) => sum + (order.totalPrice || 0),
          0
        );
        setRevenue(monthlyRevenue);

        // Set recent orders (latest 3)
        const sortedOrders = [...orders].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setRecentOrders(sortedOrders.slice(0, 3));

        // Fetch products count
        const productsResponse = await axios.get(
          "https://agrofarm-vd8i.onrender.com/api/products/my_product",
          {
            withCredentials: true,
          }
        );
        setProductsCount(productsResponse.data.products?.length || 0);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
  }, []);

  function DashboardCard({ title, value, subtitle, icon, bgColor, textColor }) {
    return (
      <div
        className={`${bgColor} ${textColor} rounded-lg shadow-xl transform transition duration-300 ease-in-out hover:shadow-2xl hover:scale-105 p-6`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {loading ? "Loading..." : value}
            </p>
            {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
          </div>
          <div className="ml-4">{icon}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">Error loading dashboard: {error}</div>
    );
  }

  return (
    <div className="m-0 p-0">
      <h1 className="text-2xl font-semibold text-green-700 mb-6">
        Supplier Dashboard
      </h1>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Orders */}
        <DashboardCard
          title="Total Orders"
          value={activeOrdersCount}
          icon={
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          bgColor="bg-green-50"
          textColor="text-green-700"
        />

        {/* Products Listed */}
        <DashboardCard
          title="Products Listed"
          value={productsCount}
          icon={
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          }
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />

        {/* Revenue This Month */}
        <DashboardCard
          title="Revenue (Month)"
          value={`₨ ${revenue.toLocaleString()}`}
          icon={
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          bgColor="bg-yellow-50"
          textColor="text-yellow-700"
        />

        {/* Weather Status */}
        <DashboardCard
          title="Weather Status"
          value="Clear"
          subtitle="28°C - Islamabad"
          icon={
            <svg
              className="w-8 h-8 text-sky-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
          }
          bgColor="bg-sky-50"
          textColor="text-sky-700"
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Orders
            </h2>
            <a
              href="#"
              className="text-green-600 hover:text-green-800 text-sm font-semibold"
            >
              View All
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-gray-500 uppercase border-b-2 border-b-gray-300">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center">
                      Loading orders...
                    </td>
                  </tr>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="text-gray-700 border-b-2 border-b-gray-300"
                    >
                      <td className="px-4 py-3">#{order._id.slice(-6)}</td>
                      <td className="px-4 py-3">
                        {order.products[0]?.productId?.name ||
                          order.products[0]?.name ||
                          "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const customer =
                            order.customer ||
                            (order.buyerId && typeof order.buyerId === "object"
                              ? order.buyerId
                              : null);
                          return (
                            customer?.name ||
                            customer?.email ||
                            customer?.phone ||
                            "N/A"
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full ${(() => {
                            const status = getOrderStatus(order);
                            if (status === "delivered")
                              return "text-green-700 bg-green-100";
                            if (
                              status === "processing" ||
                              status === "confirmed"
                            )
                              return "text-blue-700 bg-blue-100";
                            if (status === "pending")
                              return "text-yellow-700 bg-yellow-100";
                            if (status === "cancelled" || status === "canceled")
                              return "text-red-700 bg-red-100";
                            return "text-gray-700 bg-gray-100";
                          })()}`}
                        >
                          {(
                            order.orderStatus ||
                            order.status ||
                            "pending"
                          ).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        ₨ {(order.totalPrice || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center">
                      No recent orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierDashboard;
