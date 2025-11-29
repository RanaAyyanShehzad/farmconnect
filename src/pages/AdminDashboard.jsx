import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API_BASE = "https://agrofarm-vd8i.onrender.com/api/v1/admin";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    inactiveProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userChartData, setUserChartData] = useState([]);
  const [orderChartData, setOrderChartData] = useState([]);
  const [productStatusData, setProductStatusData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersRes = await axios.get(`${API_BASE}/users`, {
        withCredentials: true,
      });
      const users = usersRes.data.users || [];
      const activeUsers = users.filter(
        (u) => u.isActive && !u.isAccountDeleted
      );
      setStats((prev) => ({
        ...prev,
        totalUsers: users.length,
        activeUsers: activeUsers.length,
      }));

      // Prepare user chart data by role
      const roleCounts = {};
      users.forEach((user) => {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
      });
      setUserChartData(
        Object.entries(roleCounts).map(([name, value]) => ({ name, value }))
      );

      // Fetch products
      const productsRes = await axios.get(`${API_BASE}/products?status=all`, {
        withCredentials: true,
      });
      const products = productsRes.data.products || [];
      const inactiveProducts = products.filter((p) => !p.isActive);
      setStats((prev) => ({
        ...prev,
        totalProducts: products.length,
        inactiveProducts: inactiveProducts.length,
      }));

      // Prepare product status data
      const statusCounts = {
        active: products.filter((p) => p.isActive && p.quantity > 0).length,
        inactive: inactiveProducts.length,
        zeroStock: products.filter((p) => p.quantity === 0).length,
      };
      setProductStatusData(
        Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
      );

      // Fetch orders (we'll need to create an admin orders endpoint or use existing)
      // For now, let's calculate from what we have
      setStats((prev) => ({
        ...prev,
        totalOrders: 0, // Will be updated when order endpoint is available
        totalRevenue: 0,
      }));

      // Prepare revenue chart data (last 6 months)
      const revenueChartData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        revenueChartData.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          revenue: 0, // Will be updated when order data is available
        });
      }
      setRevenueData(revenueChartData);

      // Prepare order chart data
      setOrderChartData(revenueChartData);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error("Error fetching dashboard data:", err);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    hover: {
      y: -6,
      scale: 1.01,
      boxShadow: "0 20px 40px rgba(16, 185, 129, 0.15)",
    },
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m-0 p-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <motion.div
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 opacity-80">
                Total Users
              </p>
              <p className="text-3xl font-bold text-blue-700 mt-1">
                {loading ? "..." : stats.totalUsers}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {stats.activeUsers} active
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 opacity-80">
                Total Products
              </p>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {loading ? "..." : stats.totalProducts}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stats.inactiveProducts} inactive
              </p>
            </div>
            <Package className="w-12 h-12 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-lg"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 opacity-80">
                Total Orders
              </p>
              <p className="text-3xl font-bold text-purple-700 mt-1">
                {loading ? "..." : stats.totalOrders}
              </p>
            </div>
            <ShoppingCart className="w-12 h-12 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-lg"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 opacity-80">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-yellow-700 mt-1">
                {loading ? "..." : `₨ ${stats.totalRevenue.toLocaleString()}`}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-yellow-500" />
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-lg"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 opacity-80">
                Inactive Products
              </p>
              <p className="text-3xl font-bold text-red-700 mt-1">
                {loading ? "..." : stats.inactiveProducts}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 shadow-lg"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600 opacity-80">
                Active Users
              </p>
              <p className="text-3xl font-bold text-indigo-700 mt-1">
                {loading ? "..." : stats.activeUsers}
              </p>
              <p className="text-xs text-indigo-600 mt-1">
                {stats.totalUsers > 0
                  ? `${Math.round(
                      (stats.activeUsers / stats.totalUsers) * 100
                    )}%`
                  : "0%"}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-indigo-500" />
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Users by Role Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Users by Role
          </h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : userChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No user data available
            </div>
          )}
        </div>

        {/* Product Status Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Product Status
          </h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : productStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No product data available
            </div>
          )}
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Revenue Trend (Last 6 Months)
          </h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `₨ ${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Orders Trend (Last 6 Months)
          </h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            to="/admin/users"
            className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-center"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">Users</span>
          </Link>
          <Link
            to="/admin/categories"
            className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-center"
          >
            <Package className="w-6 h-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">
              Categories
            </span>
          </Link>
          <Link
            to="/admin/products"
            className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition text-center"
          >
            <Package className="w-6 h-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">
              Products
            </span>
          </Link>
          <Link
            to="/admin/orders"
            className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition text-center"
          >
            <ShoppingCart className="w-6 h-6 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">Orders</span>
          </Link>
          <Link
            to="/admin/disputes"
            className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition text-center"
          >
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <span className="text-sm font-medium text-red-700">Disputes</span>
          </Link>
          <Link
            to="/admin/config"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-center"
          >
            <TrendingUp className="w-6 h-6 text-gray-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Config</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
