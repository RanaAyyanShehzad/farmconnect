import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  Settings,
  Save,
  RefreshCw,
  Thermometer,
  Clock,
  HelpCircle,
} from "lucide-react";

const API_BASE = "https://agrofarm-vd8i.onrender.com/api/v1/admin";

function AdminSystemConfig() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formValue, setFormValue] = useState("");

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/config`, {
        withCredentials: true,
      });
      setConfigs(response.data.configs || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch configs");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (configKey) => {
    try {
      const value =
        typeof editingConfig.configValue === "number"
          ? Number(formValue)
          : formValue;

      const response = await axios.put(
        `${API_BASE}/config`,
        { configKey, configValue: value },
        { withCredentials: true }
      );
      toast.success(response.data.message || "Configuration updated");
      setEditingConfig(null);
      setFormValue("");
      fetchConfigs();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update configuration"
      );
    }
  };

  const getConfigIcon = (key) => {
    if (key.includes("TEMP")) return Thermometer;
    if (key.includes("MINUTES") || key.includes("DAYS")) return Clock;
    return Settings;
  };

  const getConfigType = (key) => {
    if (key.includes("TEMP") || key.includes("MINUTES") || key.includes("DAYS"))
      return "number";
    return "text";
  };

  const startEditing = (config) => {
    setEditingConfig(config);
    setFormValue(
      Array.isArray(config.configValue)
        ? JSON.stringify(config.configValue)
        : String(config.configValue)
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          System Configuration
        </h1>
        <button
          onClick={fetchConfigs}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          </div>
        ) : (
          configs.map((config) => {
            const Icon = getConfigIcon(config.configKey);
            const isEditing = editingConfig?._id === config._id;
            const inputType = getConfigType(config.configKey);

            return (
              <motion.div
                key={config._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {config.configKey.replace(/_/g, " ")}
                      </h3>
                      {config.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {config.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value
                        </label>
                        {inputType === "number" ? (
                          <input
                            type="number"
                            value={formValue}
                            onChange={(e) => setFormValue(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <textarea
                            value={formValue}
                            onChange={(e) => setFormValue(e.target.value)}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateConfig(config.configKey)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingConfig(null);
                            setFormValue("");
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Current Value
                        </p>
                        <p className="text-lg font-semibold text-gray-900 break-all">
                          {Array.isArray(config.configValue)
                            ? JSON.stringify(config.configValue)
                            : String(config.configValue)}
                        </p>
                      </div>
                      <button
                        onClick={() => startEditing(config)}
                        className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>

                {config.updatedBy && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Last updated:{" "}
                      {new Date(config.updatedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      By: {config.updatedBy.name || "Admin"}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {configs.length === 0 && !loading && (
        <div className="p-12 text-center text-gray-500 bg-white rounded-lg shadow-md">
          <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>No configurations found</p>
        </div>
      )}
    </div>
  );
}

export default AdminSystemConfig;
