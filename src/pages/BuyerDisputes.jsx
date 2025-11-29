import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Gavel,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
} from "lucide-react";
import DisputeModal from "../components/DisputeModal";
import DisputeResolveModal from "../components/DisputeResolveModal";
import { toast } from "react-toastify";

const API_BASE = "https://agrofarm-vd8i.onrender.com/api/v1/order";

function BuyerDisputes() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch buyer's orders
      const ordersResponse = await axios.get(`${API_BASE}/user-orders`, {
        withCredentials: true,
      });
      const allOrders = ordersResponse.data.orders || [];
      setOrders(allOrders);

      // Extract disputes from orders
      const orderDisputes = [];
      for (const order of allOrders) {
        if (
          order.dispute_status &&
          order.dispute_status !== "none" &&
          order.dispute_status !== "closed"
        ) {
          // Try to fetch full dispute details
          let fullDispute = null;
          try {
            const disputeResponse = await axios.get(
              `https://agrofarm-vd8i.onrender.com/api/v1/admin/disputes?orderId=${order._id}`,
              { withCredentials: true }
            );
            if (
              disputeResponse.data.success &&
              disputeResponse.data.disputes.length > 0
            ) {
              fullDispute = disputeResponse.data.disputes[0];
            }
          } catch (err) {
            console.error("Error fetching dispute details:", err);
          }

          const dispute = fullDispute || {
            _id: order.dispute_id || order._id + "_dispute",
            orderId: order._id,
            status: order.dispute_status,
            order: order,
            buyerId: order.customerId || order.buyerId,
            sellerId:
              order.products?.[0]?.farmerId || order.products?.[0]?.supplierId,
            sellerRole: order.products?.[0]?.farmerId ? "farmer" : "supplier",
            disputeType: order.dispute_type || "other",
            reason: order.dispute_reason || "Dispute on order",
            buyerProof: order.proofOfFault || null,
            sellerResponse: order.dispute_response || null,
          };

          // Apply status filter
          if (statusFilter === "all" || dispute.status === statusFilter) {
            orderDisputes.push(dispute);
          }
        }
      }
      setDisputes(orderDisputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toast.error("Failed to fetch disputes");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      pending_admin_review: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        icon: AlertCircle,
      },
      closed: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;

    return (
      <span
        className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}
      >
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, " ").toUpperCase()}
      </span>
    );
  };

  const getDisputeTypeLabel = (type) => {
    const types = {
      non_delivery: "Non-Delivery",
      product_fault: "Product Fault",
      wrong_item: "Wrong Item",
      other: "Other",
    };
    return types[type] || type;
  };

  const canCreateDispute = (order) => {
    const status = order.orderStatus || order.status;
    return (
      (status === "shipped" ||
        status === "delivered" ||
        status === "received") &&
      (!order.dispute_status || order.dispute_status === "none")
    );
  };

  const getOrdersForDispute = () => {
    return orders.filter(canCreateDispute);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Gavel className="w-8 h-8 text-orange-600" />
            My Disputes
          </h1>
          <p className="text-gray-600 mt-2">
            Manage disputes on your orders and create new disputes if needed
          </p>
        </div>
        {getOrdersForDispute().length > 0 && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create Dispute
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-gray-700 font-medium">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Disputes</option>
            <option value="open">Open</option>
            <option value="pending_admin_review">Pending Admin Review</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Gavel className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg">No disputes found</p>
          <p className="text-gray-500 text-sm mt-2">
            {statusFilter !== "all"
              ? `No disputes with status "${statusFilter}"`
              : "You don't have any active disputes"}
          </p>
          {getOrdersForDispute().length > 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Create Your First Dispute
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {disputes.map((dispute) => (
            <motion.div
              key={dispute._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Gavel className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dispute #{dispute._id?.slice(-8) || "N/A"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Order:{" "}
                        {typeof dispute.orderId === "string"
                          ? dispute.orderId.slice(-8)
                          : dispute.orderId?._id?.slice(-8) || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm font-medium text-gray-900">
                        {getDisputeTypeLabel(dispute.disputeType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      {getStatusBadge(dispute.status)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Seller</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {dispute.sellerRole || "Unknown"}
                      </p>
                    </div>
                  </div>

                  {dispute.reason && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Reason</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {dispute.reason}
                      </p>
                    </div>
                  )}

                  {dispute.sellerResponse && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        Seller's Response
                      </p>
                      {dispute.sellerResponse.proposal && (
                        <p className="text-sm text-gray-700">
                          {dispute.sellerResponse.proposal}
                        </p>
                      )}
                      {dispute.sellerResponse.respondedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Responded:{" "}
                          {new Date(
                            dispute.sellerResponse.respondedAt
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-4 h-4" />
                    Created:{" "}
                    {new Date(
                      dispute.createdAt || dispute.order?.createdAt
                    ).toLocaleString()}
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {dispute.status === "open" && dispute.sellerResponse && (
                    <button
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setShowResolveModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve
                    </button>
                  )}
                  {dispute.status === "open" && !dispute.sellerResponse && (
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                      Awaiting Seller Response
                    </span>
                  )}
                  {dispute.status === "pending_admin_review" && (
                    <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium">
                      Awaiting Admin Review
                    </span>
                  )}
                  {dispute.status === "closed" && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dispute Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Select Order to Create Dispute
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {getOrdersForDispute().map((order) => (
                  <div
                    key={order._id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowCreateForm(false);
                      setShowDisputeModal(true);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Order #{order._id.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.products?.length || 0} item(s) • ₨{" "}
                          {order.totalPrice?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {order.orderStatus || order.status}
                        </p>
                      </div>
                      <Eye className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dispute Create Modal */}
      {showDisputeModal && selectedOrder && (
        <DisputeModal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSuccess={() => {
            fetchData();
            toast.success("Dispute created successfully");
          }}
        />
      )}

      {/* Dispute Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <DisputeResolveModal
          isOpen={showResolveModal}
          onClose={() => {
            setShowResolveModal(false);
            setSelectedDispute(null);
          }}
          dispute={selectedDispute}
          onSuccess={() => {
            fetchData();
            toast.success("Dispute resolved successfully");
          }}
        />
      )}
    </div>
  );
}

export default BuyerDisputes;
