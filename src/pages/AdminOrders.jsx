import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Search,
  RefreshCw,
  Eye,
  Package,
  Truck,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = "https://agrofarm-vd8i.onrender.com/api/v1/admin";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Use correct admin orders endpoint from API docs: /api/v1/admin/orders
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("page", "1");
      params.append("limit", "50");

      const response = await axios.get(
        `${API_BASE}/orders?${params.toString()}`,
        { withCredentials: true }
      );

      // Handle response according to API docs structure
      if (response.data.success && response.data.orders) {
        // Ensure orders array is properly set
        const ordersData = Array.isArray(response.data.orders)
          ? response.data.orders
          : [];
        setOrders(ordersData);
      } else {
        // Fallback for different response structure
        const ordersData = Array.isArray(response.data.orders)
          ? response.data.orders
          : Array.isArray(response.data)
          ? response.data
          : [];
        setOrders(ordersData);
      }
    } catch (error) {
      // Handle 404 - endpoint doesn't exist
      if (error.response?.status === 404) {
        console.warn(
          "Admin orders endpoint not found. This feature may not be implemented yet."
        );
        toast.info(
          "Admin orders endpoint is not available yet. Please contact the backend team."
        );
        setOrders([]);
      } else {
        console.error("Error fetching orders:", error);
        toast.error(error.response?.data?.message || "Failed to fetch orders");
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
      processing: { bg: "bg-blue-100", text: "text-blue-800" },
      shipped: { bg: "bg-purple-100", text: "text-purple-800" },
      delivered: { bg: "bg-green-100", text: "text-green-800" },
      received: { bg: "bg-green-200", text: "text-green-900" },
      canceled: { bg: "bg-red-100", text: "text-red-800" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
      >
        {status}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
      complete: { bg: "bg-green-100", text: "text-green-800" },
      refunded: { bg: "bg-red-100", text: "text-red-800" },
      cancelled: { bg: "bg-gray-100", text: "text-gray-800" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
      >
        {status}
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (!order) return false;

    // Handle both customerId (object) and buyerId (string/object) structures
    const customerName =
      (order.customerId &&
        typeof order.customerId === "object" &&
        order.customerId.name) ||
      (order.buyerId &&
        typeof order.buyerId === "object" &&
        order.buyerId.name) ||
      "";
    const orderId = order._id?.toLowerCase() || "";

    // If search term is empty, show all orders
    if (!searchTerm.trim()) return true;

    const matchesSearch =
      orderId.includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewOrder = async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE}/orders/${orderId}`, {
        withCredentials: true,
      });
      if (response.data.success && response.data.order) {
        setSelectedOrder(response.data.order);
        setShowOrderModal(true);
      } else {
        toast.error("Failed to load order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error(
        error.response?.data?.message || "Failed to load order details"
      );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="received">Received</option>
            <option value="canceled">Canceled</option>
          </select>
          <button
            onClick={fetchOrders}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order._id.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {(() => {
                          // Handle customerId (object with name)
                          if (
                            order.customerId &&
                            typeof order.customerId === "object" &&
                            order.customerId.name
                          ) {
                            return order.customerId.name;
                          }
                          // Handle buyerId (object with name)
                          if (
                            order.buyerId &&
                            typeof order.buyerId === "object" &&
                            order.buyerId.name
                          ) {
                            return order.buyerId.name;
                          }
                          // Handle buyerId as string (old format)
                          if (typeof order.buyerId === "string") {
                            return "Buyer ID: " + order.buyerId.slice(-8);
                          }
                          return "Unknown";
                        })()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(() => {
                          if (
                            order.customerId &&
                            typeof order.customerId === "object" &&
                            order.customerId.email
                          ) {
                            return order.customerId.email;
                          }
                          if (
                            order.buyerId &&
                            typeof order.buyerId === "object" &&
                            order.buyerId.email
                          ) {
                            return order.buyerId.email;
                          }
                          return "";
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.products?.length || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ₨ {Number(order.totalPrice || 0).toLocaleString()}
                      </div>
                      {order.orderType && (
                        <div className="text-xs text-gray-500 mt-1">
                          {order.orderType === "multivendor"
                            ? "Multi-vendor"
                            : "Standard"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status || order.orderStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentBadge(
                        (() => {
                          // Try paymentInfo.status first (new format)
                          if (
                            order.paymentInfo &&
                            typeof order.paymentInfo === "object" &&
                            order.paymentInfo.status
                          ) {
                            return order.paymentInfo.status;
                          }
                          // Fallback to payment_status
                          if (order.payment_status) {
                            return order.payment_status;
                          }
                          return "pending";
                        })()
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewOrder(order._id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No orders found</p>
            <p className="text-sm mt-2">
              Note: Admin orders endpoint may need to be implemented
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Order Details #{selectedOrder._id.slice(-8)}
              </h2>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedOrder.customerId?.name ||
                        (selectedOrder.buyerId &&
                        typeof selectedOrder.buyerId === "object"
                          ? selectedOrder.buyerId.name
                          : "Unknown")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-base text-gray-900">
                      {selectedOrder.customerId?.email ||
                        (selectedOrder.buyerId &&
                        typeof selectedOrder.buyerId === "object"
                          ? selectedOrder.buyerId.email
                          : "N/A")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-base text-gray-900">
                      {selectedOrder.customerId?.phone ||
                        (selectedOrder.buyerId &&
                        typeof selectedOrder.buyerId === "object"
                          ? selectedOrder.buyerId.phone
                          : "N/A")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-base text-gray-900">
                      {selectedOrder.shippingAddress?.street || "N/A"}
                      {selectedOrder.shippingAddress?.city &&
                        `, ${selectedOrder.shippingAddress.city}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order Status</p>
                  {getStatusBadge(
                    selectedOrder.status || selectedOrder.orderStatus
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                  {getPaymentBadge(
                    selectedOrder.paymentInfo?.status ||
                      selectedOrder.payment_status ||
                      "pending"
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dispute Status</p>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {selectedOrder.dispute_status || "none"}
                  </span>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Products ({selectedOrder.products?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedOrder.products?.map((product, index) => (
                    <div
                      key={product._id || index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {product.productId?.name || "Unknown Product"}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Quantity: {product.quantity} × ₨
                            {product.price?.toLocaleString()}
                          </p>
                          {product.farmerId && (
                            <p className="text-xs text-gray-500 mt-1">
                              Farmer:{" "}
                              {product.farmerId.name || product.farmerId.email}
                            </p>
                          )}
                          {product.supplierId && (
                            <p className="text-xs text-gray-500 mt-1">
                              Supplier:{" "}
                              {product.supplierId.name ||
                                product.supplierId.email}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₨
                            {(
                              product.quantity * product.price
                            ).toLocaleString()}
                          </p>
                          <span className="text-xs text-gray-500">
                            {product.status || "processing"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    ₨{Number(selectedOrder.totalPrice || 0).toLocaleString()}
                  </span>
                </div>
                {selectedOrder.paymentInfo && (
                  <div className="mt-2 text-sm text-gray-600">
                    Payment Method: {selectedOrder.paymentInfo.method || "N/A"}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
