import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../features/userSlice";
import {
  FiEdit,
  FiCamera,
  FiX,
  FiLogOut,
  FiLock,
  FiTrash2,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FarmerProfile = () => {
  // Cloudinary configuration
  const CLOUD_NAME = "dn5edjpzg";
  const UPLOAD_PRESET = "FarmConnect";
  const dispatch = useDispatch();
  // State management
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    img: "",
  });

  const [tempData, setTempData] = useState({
    ...profileData,
    imgPreview: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Refs
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();

    return () => {
      if (tempData.imgPreview) {
        URL.revokeObjectURL(tempData.imgPreview);
      }
    };
  }, []);
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://agrofarm-vd8i.onrender.com/api/farmers/me",
        { credentials: "include" }
      );

      if (!response.ok) throw new Error("Failed to fetch profile data");

      const data = await response.json();
      const { name, email, phone, address, img } = data.user;

      setProfileData({ name, email, phone, address, img });
      setTempData({ name, email, phone, address, img, imgPreview: "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      toast.error("Image upload failed");
      throw error;
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setTempData((prev) => ({ ...prev, img: file, imgPreview: previewUrl }));
    }
  };

  // Handle profile save
  const handleSave = async () => {
    try {
      setLoading(true);

      let imgUrl = tempData.img;

      // Upload new image if selected
      if (tempData.img instanceof File) {
        imgUrl = await uploadToCloudinary(tempData.img);
      }

      // Update profile
      const response = await fetch(
        "https://agrofarm-vd8i.onrender.com/api/farmers/update",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: tempData.name,
            email: tempData.email,
            phone: tempData.phone,
            address: tempData.address,
            img: imgUrl,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Update failed");
      }

      const updatedData = await response.json();
      const { name, email, phone, address, img } =
        updatedData.user || updatedData;

      setProfileData({ name, email, phone, address, img });
      setTempData({ name, email, phone, address, img, imgPreview: "" });
      setIsEditing(false);
      toast.success("Profile updated successfully");
      //dispatch(setUser({name,img}));
      fetchProfileData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://agrofarm-vd8i.onrender.com/api/farmers/logout",
        { method: "GET", credentials: "include" }
      );

      if (!response.ok) throw new Error("Logout failed");

      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://agrofarm-vd8i.onrender.com/api/farmers/changepassword",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Password change failed");
      }

      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setTempData({ ...profileData, imgPreview: "" });
    setIsEditing(false);
    setIsChangingPassword(false);
  };

  // Handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle password field changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const confirmMessage =
      "⚠️ WARNING: Account Deletion\n\n" +
      "Are you sure you want to delete your account? This action will:\n\n" +
      "• Mark your account as deleted (soft delete)\n" +
      "• Soft delete all your products (they will be removed from listings)\n" +
      "• Your existing orders will remain intact for record keeping\n\n" +
      "Your data will be preserved but your account will be inactive.\n\n" +
      "This action cannot be undone. Continue?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://agrofarm-vd8i.onrender.com/api/farmers/delete",
        { method: "DELETE", credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Account deletion failed");
      }

      toast.success(
        data.message ||
          "Account deleted successfully. All your products have been removed."
      );
      setTimeout(() => {
        dispatch(setUser(null));
        navigate("/");
      }, 2000);
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  // Get image URL for display
  const getImageUrl = () => {
    if (tempData.imgPreview) return tempData.imgPreview;
    if (typeof tempData.img === "string") return tempData.img;
    return null;
  };

  // Loading state
  if (loading && !profileData.name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-gray-800"
          >
            Farmer Profile
          </motion.h1>

          <div className="flex gap-3 w-full sm:w-auto">
            {!isEditing && !isChangingPassword && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex-1 sm:flex-none justify-center"
                >
                  <FiEdit className="text-green-600" />
                  <span className="text-gray-700">Edit Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex-1 sm:flex-none justify-center"
                >
                  <FiLogOut className="text-red-600" />
                  <span className="text-gray-700">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          <div className="relative">
            {/* Profile Picture */}
            <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg relative">
                  {getImageUrl() ? (
                    <img
                      src={getImageUrl()}
                      alt="Farmer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}

                  {isEditing && (
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors mb-1"
                      >
                        <FiCamera className="text-gray-700" />
                      </button>

                      {getImageUrl() && (
                        <button
                          onClick={() =>
                            setTempData((prev) => ({
                              ...prev,
                              img: "",
                              imgPreview: "",
                            }))
                          }
                          className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                        >
                          <FiX className="text-gray-700" />
                        </button>
                      )}

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 w-full">
                {isChangingPassword ? (
                  <div
                    className="space-y-4 max-h-96 overflow-y-auto p-2"
                    ref={formRef}
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Change Password
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Old Password
                        </label>
                        <input
                          type="password"
                          name="oldPassword"
                          value={passwordData.oldPassword}
                          onChange={handlePasswordChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                    </div>
                  </div>
                ) : isEditing ? (
                  <div
                    className="space-y-4 max-h-96 overflow-y-auto p-2"
                    ref={formRef}
                  >
                    <h3 className="text-xl font-bold text-gray-800">
                      Edit Profile
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={tempData.name}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={tempData.email}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={tempData.phone}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={tempData.address}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {profileData.name}
                        </h2>
                        <div className="flex items-center gap-1 text-gray-500 mt-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{profileData.address}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-800 font-medium">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span>{profileData.email}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-3 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </div>
                        <span>{profileData.phone}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 flex justify-end gap-3">
              {isEditing || isChangingPassword ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-500 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={
                      isChangingPassword ? handleChangePassword : handleSave
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : isChangingPassword ? (
                      "Change Password"
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <FiLock />
                    Change Password
                  </button>

                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <FiTrash2 />
                    Delete Account
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <ToastContainer position="bottom-right" autoClose={5000} />
    </motion.div>
  );
};

export default FarmerProfile;
