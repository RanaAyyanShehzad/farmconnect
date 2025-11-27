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
  FiDownload,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
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

  // Handle product status change (multi-vendor system)
  const handleProductStatusChange = async (orderId, productId, newStatus) => {
    try {
      // Make API call to update product status
      const response = await fetch(
        `https://agrofarm-vd8i.onrender.com/api/v1/order/${orderId}/product/${productId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update status: ${response.status}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      toast.success(data.message || "Product status updated successfully");

      // Refresh orders to get updated order status
      await fetchOrders();

      // Update selected order if it's the current one
      if (selectedOrder && selectedOrder._id === orderId) {
        const updatedOrderResponse = await fetch(
          `https://agrofarm-vd8i.onrender.com/api/v1/order/item/${orderId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        if (updatedOrderResponse.ok) {
          const updatedData = await updatedOrderResponse.json();
          if (updatedData.success) {
            setSelectedOrder(updatedData.order);
          }
        }
      }
    } catch (err) {
      console.error("Error updating product status:", err);
      toast.error(err.message || "Failed to update product status");
    }
  };

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
    const orderStatus = order.orderStatus || order.status || "";
    const matchesStatus =
      statusFilter === "all" ||
      orderStatus?.toLowerCase() === statusFilter.toLowerCase();

    const matchesId = order._id?.toLowerCase().includes(searchTermLower);

    const matchesProduct = (order.products || []).some((item) => {
      const product = item.productId || item;
      return product?.name?.toLowerCase().includes(searchTermLower);
    });

    const matchesCustomerName =
      order.customer?.name?.toLowerCase().includes(searchTermLower) || false;
    const matchesCustomerEmail =
      order.customer?.email?.toLowerCase().includes(searchTermLower) || false;
    const matchesCustomerPhone =
      order.customer?.phone?.toLowerCase().includes(searchTermLower) || false;

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
        matchesCustomerName ||
        matchesCustomerEmail ||
        matchesCustomerPhone ||
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
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "pending":
        return { color: "bg-yellow-100 text-yellow-800", text: "Pending" };
      case "processing":
        return { color: "bg-blue-100 text-blue-800", text: "Processing" };
      case "confirmed":
        return { color: "bg-purple-100 text-purple-800", text: "Confirmed" };
      case "shipped":
        return { color: "bg-indigo-100 text-indigo-800", text: "Shipped" };
      case "delivered":
        return { color: "bg-green-100 text-green-800", text: "Delivered" };
      case "canceled":
      case "cancelled":
        return { color: "bg-red-100 text-red-800", text: "Cancelled" };
      case "partially_shipped":
        return {
          color: "bg-indigo-100 text-indigo-800",
          text: "Partially Shipped",
        };
      case "partially_delivered":
        return {
          color: "bg-green-100 text-green-800",
          text: "Partially Delivered",
        };
      case "partially_cancelled":
        return {
          color: "bg-red-100 text-red-800",
          text: "Partially Cancelled",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          text: status || "Unknown",
        };
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

  // Generate and download PDF invoice
  const downloadInvoicePDF = async (order) => {
    if (downloadingInvoice) return; // Prevent multiple clicks

    try {
      setDownloadingInvoice(true);

      // Fetch full order details to ensure we have all customer information
      const response = await fetch(
        `https://agrofarm-vd8i.onrender.com/api/v1/order/item/${order._id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      let orderData = order;
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.order) {
          orderData = data.order;
        }
      }

      const doc = new jsPDF();

      // Set up document
      doc.setFontSize(20);
      doc.text("Order Invoice", 14, 20);

      // Company/Business Info
      doc.setFontSize(12);
      doc.text("FarmConnect", 14, 30);
      doc.setFontSize(10);
      doc.text("Agri-Marketplace", 14, 36);

      // Order Info
      doc.setFontSize(11);
      doc.text(`Order ID: ${orderData._id}`, 14, 50);
      doc.text(`Order Date: ${formatDate(orderData.createdAt)}`, 14, 56);
      doc.text(
        `Status: ${orderData.status?.toUpperCase() || "PENDING"}`,
        14,
        62
      );

      // Customer Info
      const customerY = 72;
      doc.setFontSize(11);
      doc.text("Customer Information:", 14, customerY);
      doc.setFontSize(10);
      doc.text(`Name: ${orderData.customer?.name || "N/A"}`, 14, customerY + 6);
      doc.text(
        `Email: ${orderData.customer?.email || "N/A"}`,
        14,
        customerY + 12
      );
      doc.text(
        `Phone: ${
          orderData.customer?.phone ||
          orderData.shippingAddress?.phoneNumber ||
          "N/A"
        }`,
        14,
        customerY + 18
      );

      const addressText =
        orderData.customer?.address ||
        `${orderData.shippingAddress?.street || ""}, ${
          orderData.shippingAddress?.city || ""
        }, ${orderData.shippingAddress?.zipCode || ""}`.replace(
          /^,\s*|,\s*$/g,
          ""
        );
      const addressLines = doc.splitTextToSize(`Address: ${addressText}`, 180);
      doc.text(addressLines, 14, customerY + 24);

      // Shipping Address (on the right side)
      const shippingY = customerY;
      doc.setFontSize(11);
      doc.text("Shipping Address:", 120, shippingY);
      doc.setFontSize(10);
      const shippingLines = doc.splitTextToSize(
        `${orderData.shippingAddress?.street || "N/A"}, ${
          orderData.shippingAddress?.city || "N/A"
        }, ${orderData.shippingAddress?.zipCode || "N/A"}`,
        70
      );
      doc.text(shippingLines, 120, shippingY + 6);
      doc.text(
        `Phone: ${orderData.shippingAddress?.phoneNumber || "N/A"}`,
        120,
        shippingY + 18
      );

      // Payment Info
      const paymentY = customerY + 40;
      doc.setFontSize(11);
      doc.text("Payment Information:", 14, paymentY);
      doc.setFontSize(10);
      doc.text(
        `Method: ${
          orderData.paymentInfo?.method?.replace(/-/g, " ").toUpperCase() ||
          "N/A"
        }`,
        14,
        paymentY + 6
      );
      doc.text(
        `Status: ${orderData.paymentInfo?.status?.toUpperCase() || "N/A"}`,
        14,
        paymentY + 12
      );

      // Prepare table data
      const products = orderData.products || [];
      let tableY = paymentY + 25;

      // Table header
      doc.setFontSize(11);
      doc.setFillColor(34, 139, 34);
      doc.rect(14, tableY, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Product", 16, tableY + 6);
      doc.text("Quantity", 90, tableY + 6);
      doc.text("Price", 140, tableY + 6);
      doc.text("Total", 175, tableY + 6);

      tableY += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);

      // Table rows
      products.forEach((item, index) => {
        const product = item.productId || item;
        const productName = product.name || "Unknown Product";
        const quantity = item.quantity || 0;
        const unitPrice = product.price || 0;
        const total = quantity * unitPrice;
        const unit = product.unit || "";

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, tableY - 2, 180, 8, "F");
        }

        // Truncate long product names
        const maxWidth = 65;
        let displayName = productName;
        if (doc.getTextWidth(displayName) > maxWidth) {
          displayName = doc.splitTextToSize(displayName, maxWidth)[0] + "...";
        }

        doc.text(displayName, 16, tableY + 5);
        doc.text(`${quantity} ${unit}`, 90, tableY + 5);
        doc.text(`Rs. ${unitPrice.toLocaleString()}`, 140, tableY + 5);
        doc.text(`Rs. ${total.toLocaleString()}`, 175, tableY + 5);

        tableY += 10;
      });

      const finalY = tableY;

      // Order notes
      if (orderData.notes) {
        doc.setFontSize(10);
        doc.text(`Order Notes: ${orderData.notes}`, 14, finalY + 10);
      }

      // Total
      doc.setFontSize(12);
      doc.text(
        `Total: Rs. ${orderData.totalPrice?.toLocaleString() || "0"}`,
        120,
        finalY + 15,
        { align: "right" }
      );

      // Footer
      doc.setFontSize(8);
      doc.text("Thank you for your business!", 105, 280, { align: "center" });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, {
        align: "center",
      });

      // Save the PDF
      doc.save(`Invoice-${orderData._id.substring(0, 8)}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate invoice PDF");
    } finally {
      setDownloadingInvoice(false);
    }
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
              placeholder="Search by order ID, customer name, product, address, or phone..."
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
                      "confirmed",
                      "shipped",
                      "delivered",
                      "partially_shipped",
                      "partially_delivered",
                      "partially_cancelled",
                      "canceled",
                      "cancelled",
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
                  Customer
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer?.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.customer?.email || order.customer?.phone || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.products.length} items
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.products[0]?.productId?.name ||
                          order.products[0]?.name ||
                          "N/A"}
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
                          getStatusInfo(order.orderStatus || order.status).color
                        }`}
                      >
                        {getStatusInfo(order.orderStatus || order.status).text}
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
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
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
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Order Status</span>
                          <span
                            className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                              getStatusInfo(
                                selectedOrder.status ||
                                  selectedOrder.orderStatus
                              ).color
                            }`}
                          >
                            {
                              getStatusInfo(
                                selectedOrder.status ||
                                  selectedOrder.orderStatus
                              ).text
                            }
                          </span>
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
                          <span className="text-gray-500">Name</span>
                          <span className="font-medium text-gray-800">
                            {selectedOrder.customer?.name || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email</span>
                          <span className="font-medium text-gray-800">
                            {selectedOrder.customer?.email || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phone</span>
                          <span className="font-medium text-gray-800">
                            {selectedOrder.customer?.phone ||
                              selectedOrder.shippingAddress?.phoneNumber ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Address</span>
                          <span className="text-right font-medium text-gray-800">
                            {selectedOrder.customer?.address ||
                              `${
                                selectedOrder.shippingAddress?.street || "N/A"
                              }, ${
                                selectedOrder.shippingAddress?.city || "N/A"
                              }`}
                          </span>
                        </div>
                        {selectedOrder.notes && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Order Notes</span>
                            <span className="text-right font-medium text-gray-800">
                              {selectedOrder.notes}
                            </span>
                          </div>
                        )}
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
                            <th className="px-4 py-3 text-left font-medium">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedOrder.products.map((item, index) => {
                            const product = item.productId || item;
                            const productStatus = item.status || "processing";
                            const vendorName =
                              item.farmerId?.name ||
                              item.supplierId?.name ||
                              product.upLoadedBy?.uploaderName ||
                              "N/A";
                            const isCancelled =
                              productStatus === "cancelled" ||
                              productStatus === "canceled";

                            return (
                              <tr key={item._id || index}>
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
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`font-medium ${
                                            product.isDeleted ||
                                            product.isActive === false
                                              ? "text-gray-400 line-through"
                                              : "text-gray-800"
                                          }`}
                                        >
                                          {product.name || "Unknown Product"}
                                        </div>
                                        {(product.isDeleted ||
                                          product.isActive === false) && (
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                            Deleted
                                          </span>
                                        )}
                                      </div>
                                      <div
                                        className={`text-xs ${
                                          product.isDeleted ||
                                          product.isActive === false
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        Vendor: {vendorName}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-gray-600">
                                  {item.quantity}{" "}
                                  {product.unit ? product.unit : ""}
                                </td>
                                <td className="px-4 py-4 text-right font-medium text-gray-800">
                                  {formatCurrency(product.price || item.price)}{" "}
                                  / {product.unit || ""}
                                </td>
                                <td className="px-4 py-4">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      getStatusInfo(productStatus).color
                                    }`}
                                  >
                                    {getStatusInfo(productStatus).text}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <select
                                    value={productStatus}
                                    onChange={(e) => {
                                      if (!isCancelled) {
                                        handleProductStatusChange(
                                          selectedOrder._id,
                                          item._id,
                                          e.target.value
                                        );
                                      }
                                    }}
                                    disabled={isCancelled}
                                    className={`border rounded px-2 py-1 text-xs focus:ring-green-500 focus:border-green-500 ${
                                      isCancelled
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    <option value="processing">
                                      Processing
                                    </option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
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
                    onClick={() => downloadInvoicePDF(selectedOrder)}
                    disabled={downloadingInvoice}
                    className="inline-flex items-center px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingInvoice ? (
                      <>
                        <FiRefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiDownload className="mr-2 h-5 w-5" />
                        Download Invoice PDF
                      </>
                    )}
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
