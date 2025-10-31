import { useState, useEffect } from "react";
import {
  FiSearch,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiPrinter,
  FiEdit,
  FiEye,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const navigate = useNavigate();


  

  // Fetch orders from API with authentication
  const fetchOrders = async () => {
    

    try {
      setLoading(true);
      const response = await fetch(
        "https://agrofarm-vd8i.onrender.com/api/v1/order/supplier-orders",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
        setError(err.message);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle status change with authentication
  const handleStatusChange = async (orderId, newStatus) => {
   
    try {
      // First update locally for instant UI feedback
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }

      // Then make API call to persist the change
      const response = await fetch(
        `https://agrofarm-vd8i.onrender.com/api/v1/order/update-status/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
           
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update status");
      }
      if (data.success) {
        toast.success(data.message || "Updated successfully");
      }
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
      // Revert local changes if API call fails
      setOrders((prevOrders) => [...prevOrders]);
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: selectedOrder.status }));
      }
      // Show error to user
      setError(err.message);
    }
  };

  // Filter orders based on status and search term
  // In your filtering logic, replace the current filteredOrders with this:
  const searchTermLower = (searchTerm || "").toLowerCase();
  const filteredOrders = (orders || []).filter((order) => {
    const matchesStatus =
      statusFilter === "all" ||
      order.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesId = order._id?.toLowerCase().includes(searchTermLower);

    const matchesProduct = (order.products || []).some((product) =>
      product?.name?.toLowerCase().includes(searchTermLower)
    );

    const matchesAddress =
      order.shippingAddress?.street?.toLowerCase().includes(searchTermLower) ||
      false;

    const matchesCity =
      order.shippingAddress?.city?.toLowerCase().includes(searchTermLower) ||
      false;

    const phoneDigits =
      order.shippingAddress?.phoneNumber?.replace(/\D/g, "") || "";
    const matchesPhone = phoneDigits.includes(searchTerm.replace(/\D/g, ""));

    return (
      matchesStatus &&
      (matchesId ||
        matchesProduct ||
        matchesAddress ||
        matchesCity ||
        matchesPhone)
    );
  });
  

  // View order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Get status color and display text
  const getStatusInfo = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { color: "bg-yellow-100 text-yellow-800", text: "Pending" };
      case "processing":
        return { color: "bg-blue-100 text-blue-800", text: "Processing" };
      case "shipped":
        return { color: "bg-indigo-100 text-indigo-800", text: "Shipped" };
      case "delivered":
        return { color: "bg-green-100 text-green-800", text: "Delivered" };
      case "canceled":
        return { color: "bg-red-100 text-red-800", text: "Canceled" };
      default:
        return { color: "bg-gray-100 text-gray-800", text: status };
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toLocaleString() || "0"}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  // Add this to your modal component (outside the return)
  useEffect(() => {
    if (showOrderDetails) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showOrderDetails]);
  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Refresh orders
  const refreshOrders = async () => {
   

    try {
      setLoading(true);
      const response = await fetch(
        "https://agrofarm-vd8i.onrender.com/api/v1/order/supplier-orders",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
           
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-start">
          <FiAlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button
              onClick={refreshOrders}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-green-700">
              Order Management
            </h1>
            <p className="text-gray-600">Manage and track all your orders</p>
          </div>
          <button
            onClick={refreshOrders}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FiRefreshCw className="animate-spin" />
            Refresh Orders
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by order ID, address, product, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <FiFilter />
              Filter Orders
              {isFilterOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-10 mt-2 w-56 bg-white rounded-md shadow-lg overflow-hidden"
                >
                  <div className="p-4 space-y-2 border-b">
                    <h3 className="text-sm font-medium text-gray-700">
                      Order Status
                    </h3>
                    {[
                      "all",
                      "pending",
                      "processing",
                      "shipped",
                      "delivered",
                      "canceled",
                    ].map((status) => (
                      <label
                        key={status}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          name="status"
                          checked={statusFilter === status}
                          onChange={() => setStatusFilter(status)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {status === "all" ? "All Statuses" : status}
                        </span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Orders List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden "
      >
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.length > 0 ? (
                currentOrders.map((order) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order._id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.products.length} items
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.products[0]?.name || "N/A"}
                        {order.products.length > 1
                          ? ` +${order.products.length - 1} more`
                          : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getStatusInfo(order.status).color
                        }`}
                      >
                        {getStatusInfo(order.status).text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.paymentInfo.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.paymentInfo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition"
                          title="View Details"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order._id, e.target.value);
                          }}
                          className="border rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="text-gray-500 py-8">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium">
                        No orders found
                      </h3>
                      <p className="mt-1 text-sm">
                        Try adjusting your search or filter to find what you're
                        looking for.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstOrder + 1}</span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(indexOfLastOrder, filteredOrders.length)}
            </span>{" "}
            of <span className="font-medium">{filteredOrders.length}</span>{" "}
            orders
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    currentPage === pageNum
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-300 hover:bg-gray-50"
                  } transition`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-3 py-1 text-sm">...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition"
              >
                {totalPages}
              </button>
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40">
            <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25 }}
                className="inline-block bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:align-middle sm:max-w-4xl sm:w-full"
                role="dialog"
                aria-modal="true"
              >
                <div className="px-6 py-4 sm:px-8 sm:py-6">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Order Details
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedOrder._id}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowOrderDetails(false)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Grid Content */}
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    {/* Order Info */}
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">
                        ORDER INFORMATION
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date</span>
                          <span className="font-medium text-gray-800">
                            {formatDate(selectedOrder.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          <select
                            value={selectedOrder.status}
                            onChange={(e) =>
                              handleStatusChange(
                                selectedOrder._id,
                                e.target.value
                              )
                            }
                            className="border rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="canceled">Canceled</option>
                          </select>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment Method</span>
                          <span className="font-medium capitalize text-gray-800">
                            {selectedOrder.paymentInfo.method || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment Status</span>
                          <span
                            className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                              selectedOrder.paymentInfo.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {selectedOrder.paymentInfo.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">
                        CUSTOMER INFORMATION
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phone</span>
                          <span className="font-medium text-gray-800">
                            {selectedOrder.shippingAddress?.phoneNumber ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Address</span>
                          <span className="text-right font-medium text-gray-800">
                            {selectedOrder.shippingAddress?.street || "N/A"},{" "}
                            {selectedOrder.shippingAddress?.city || "N/A"}
                          </span>
                        </div>
                        {selectedOrder.deliveryInfo?.notes && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Delivery Notes
                            </span>
                            <span className="text-right font-medium text-gray-800">
                              {selectedOrder.deliveryInfo.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-600 mb-3">
                      ORDER ITEMS
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100 text-gray-600 uppercase">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-right font-medium">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedOrder.products.map((product, index) => (
                            <tr key={index}>
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-3">
                                  {product.images?.[0] && (
                                    <img
                                      src={product.images[0]}
                                      alt={product.name}
                                      className="h-10 w-10 rounded object-cover"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-800">
                                      {product.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Supplier:{" "}
                                      {product.supplier?.name || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-gray-600">
                                {product.quantity}
                              </td>
                              <td className="px-4 py-4 text-right font-medium text-gray-800">
                                {formatCurrency(product.price)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50">
                            <td
                              colSpan="2"
                              className="px-4 py-4 text-right text-gray-500"
                            >
                              Subtotal
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-gray-800">
                              {formatCurrency(selectedOrder.totalPrice)}
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td
                              colSpan="2"
                              className="px-4 py-4 text-right text-gray-500"
                            >
                              Delivery Fee
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-gray-800">
                              {formatCurrency(0)}
                            </td>
                          </tr>
                          <tr className="bg-gray-100">
                            <td
                              colSpan="2"
                              className="px-4 py-4 text-right font-bold text-gray-800"
                            >
                              Total
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-gray-800">
                              {formatCurrency(selectedOrder.totalPrice)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                  >
                    <FiPrinter className="mr-2 h-5 w-5" />
                    Print Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOrderDetails(false)}
                    className="inline-flex items-center px-4 py-2 rounded-md bg-white text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OrderManagement;
