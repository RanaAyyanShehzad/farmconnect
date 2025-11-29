import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  Gavel,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const API_BASE = "https://agrofarm-vd8i.onrender.com/api/v1/admin";

function AdminDisputeManagement() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showRulingModal, setShowRulingModal] = useState(false);
  const [ruling, setRuling] = useState({ decision: "", notes: "" });

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      // Use correct admin disputes endpoint from API docs: /api/v1/admin/disputes
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("page", "1");
      params.append("limit", "50");

      const response = await axios.get(
        `${API_BASE}/disputes?${params.toString()}`,
        { withCredentials: true }
      );

      // Handle response according to API docs structure
      if (response.data.success && response.data.disputes) {
        setDisputes(response.data.disputes);
      } else {
        // Fallback for different response structure
        setDisputes(response.data.disputes || response.data || []);
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
      if (error.response?.status === 404) {
        toast.info(
          "Admin disputes endpoint not found. This feature may not be implemented yet."
        );
      } else if (error.response?.status === 500) {
        toast.error(
          "Server error while fetching disputes. Please try again later."
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to fetch disputes"
        );
      }
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRuling = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    try {
      // Admin ruling endpoint: /api/v1/order/dispute/:disputeId/admin-ruling
      const response = await axios.put(
        `https://agrofarm-vd8i.onrender.com/api/v1/order/dispute/${selectedDispute._id}/admin-ruling`,
        ruling,
        { withCredentials: true }
      );
      toast.success(response.data.message || "Dispute resolved successfully");
      setShowRulingModal(false);
      setSelectedDispute(null);
      setRuling({ decision: "", notes: "" });
      fetchDisputes();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resolve dispute");
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
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </span>
    );
  };

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.orderId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dispute Management</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search disputes..."
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
            <option value="open">Open</option>
            <option value="pending_admin_review">Pending Review</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={fetchDisputes}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          </div>
        ) : filteredDisputes.length > 0 ? (
          filteredDisputes.map((dispute) => (
            <motion.div
              key={dispute._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Gavel className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dispute #{dispute._id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Order: {dispute.orderId?.slice(-8) || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {dispute.disputeType?.replace("_", " ") || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Buyer</p>
                      <p className="text-sm font-medium text-gray-900">
                        {dispute.buyerId?.name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Seller</p>
                      <p className="text-sm font-medium text-gray-900">
                        {dispute.sellerId?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                  {dispute.reason && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Reason</p>
                      <p className="text-sm text-gray-700">{dispute.reason}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    {getStatusBadge(dispute.status)}
                    <span className="text-xs text-gray-500">
                      Created:{" "}
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {dispute.status === "pending_admin_review" && (
                  <button
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setShowRulingModal(true);
                    }}
                    className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Gavel className="w-4 h-4" />
                    Make Ruling
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500 bg-white rounded-lg shadow-md">
            <Gavel className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No disputes found</p>
            <p className="text-sm mt-2">
              Note: Admin disputes endpoint may need to be implemented
            </p>
          </div>
        )}
      </div>

      {/* Admin Ruling Modal */}
      {showRulingModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-4">Admin Ruling</h2>
            <form onSubmit={handleAdminRuling} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decision *
                </label>
                <select
                  required
                  value={ruling.decision}
                  onChange={(e) =>
                    setRuling({ ...ruling, decision: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select decision</option>
                  <option value="buyer_win">Buyer Wins</option>
                  <option value="seller_win">Seller Wins</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={ruling.notes}
                  onChange={(e) =>
                    setRuling({ ...ruling, notes: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your ruling notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Submit Ruling
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRulingModal(false);
                    setSelectedDispute(null);
                    setRuling({ decision: "", notes: "" });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AdminDisputeManagement;
