import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../features/userSlice";
import { useTranslation } from "../hooks/useTranslation";
import { useWeatherDisplay } from "../hooks/useWeatherDisplay";

const getOrderStatus = (order) =>
  (order?.orderStatus || order?.status || "").toLowerCase();

function Dashboard() {
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const {
    data: weatherData,
    city,
    status,
    alerts = [],
  } = useSelector((state) => state.weather);
  const fallbackWeather = useWeatherDisplay();
  const weatherLoading = status === "loading";
  const weatherTemperature =
    typeof weatherData?.temperature === "number"
      ? `${Math.round(weatherData.temperature)}°C`
      : fallbackWeather.temperature || "—";
  const weatherDescription =
    weatherData?.description || fallbackWeather.description || "—";
  const weatherLocation = city || fallbackWeather.city || "";
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
  const listItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };
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
      <motion.div
        className={`${bgColor} ${textColor} rounded-xl p-6`}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        whileHover="hover"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {loading ? t("common.loading") : value}
            </p>
            {subtitle && (
              <p className="text-xs mt-1 opacity-70 transition-colors">
                {subtitle}
              </p>
            )}
          </div>
          <motion.div
            className="ml-4"
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            {icon}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {t("weather.errorTitle")}: {error}
      </div>
    );
  }

  return (
    <div className="m-0 p-0">
      <h1 className="text-2xl font-semibold text-green-700 mb-6">
        {t("dashboard.title")}
      </h1>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Orders */}
        <DashboardCard
          title={t("dashboard.totalOrders")}
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
          title={t("dashboard.productsListed")}
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
          title={t("dashboard.revenueMonth")}
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
          title={t("dashboard.weatherStatus")}
          value={weatherLoading ? t("common.loading") : weatherTemperature}
          subtitle={
            weatherLoading
              ? weatherDescription
              : `${weatherDescription}${
                  weatherLocation ? ` · ${weatherLocation}` : ""
                }`
          }
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
              {t("dashboard.recentOrders")}
            </h2>
            <a
              href="#"
              className="text-green-600 hover:text-green-800 text-sm font-semibold"
            >
              {t("common.viewAll")}
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-gray-500 uppercase border-b-2 border-b-gray-300">
                  <th className="px-4 py-3">{t("dashboard.table.order")}</th>
                  <th className="px-4 py-3">{t("dashboard.table.product")}</th>
                  <th className="px-4 py-3">{t("dashboard.table.buyer")}</th>
                  <th className="px-4 py-3">{t("dashboard.table.status")}</th>
                  <th className="px-4 py-3">{t("dashboard.table.amount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center">
                      {t("dashboard.loadingOrders")}
                    </td>
                  </tr>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <motion.tr
                      key={order._id}
                      className="text-gray-700 border-b-2 border-b-gray-300"
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
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
                    </motion.tr>
                  ))
                ) : (
                  <motion.tr
                    variants={listItemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <td colSpan="5" className="px-4 py-3 text-center">
                      {t("dashboard.noOrders")}
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weather Forecast */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {t("dashboard.weatherForecast")}
            </h2>
            <span className="text-sm text-gray-500">
              {weatherLocation || t("weather.city")}
            </span>
          </div>
          <div className="space-y-4">
            {/* Today */}
            <motion.div
              className="flex items-center justify-between bg-sky-50 p-3 rounded-lg"
              variants={listItemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="flex items-center space-x-3">
                <svg
                  className="w-10 h-10 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <div className="font-medium">{t("common.today")}</div>
                  <div className="text-sm text-gray-500">
                    {weatherDescription}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{weatherTemperature}</div>
                <div className="text-sm text-gray-500">
                  {weatherData?.humidity != null
                    ? `${weatherData.humidity}% ${
                        t("weather.humidity") || "Humidity"
                      }`
                    : "—"}
                </div>
              </div>
            </motion.div>

            {/* Weather Alerts (real-time from API) */}
            {/* <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">
                {t("weather.alerts")}
              </h3>
              {alerts && alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <motion.div
                    key={index}
                    className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded"
                    variants={listItemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">
                          {alert.alert}
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          {t("weather.city")}: {alert.city} —{" "}
                          {alert.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  {t("weather.noAlertsAvailable")}
                </p>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
