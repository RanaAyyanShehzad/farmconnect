// AuthModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../features/userSlice";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { fetchProfileForRole } from "../services/profileService";

const API_MAP = {
  Farmer: "https://agrofarm-vd8i.onrender.com/api/farmers",
  Buyer: "https://agrofarm-vd8i.onrender.com/api/buyers",
  Supplier: "https://agrofarm-vd8i.onrender.com/api/suppliers",
};

const roleVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const inputVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};
const AuthModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState("Farmer");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
  });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("auth"); // auth | otp | forgot | reset
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    if (step === "forgot") {
      if (!formData.email && !formData.phone) {
        setErrorMessage("Email or phone is required");
        return false;
      }
      return true;
    }

    if (step === "reset") {
      if (!newPassword || newPassword.length < 6) {
        setErrorMessage("Password must be at least 6 characters");
        return false;
      }
      if (!otp || otp.length < 6) {
        setErrorMessage("Please enter a valid OTP");
        return false;
      }
      return true;
    }

    if (!formData.email || !formData.password) {
      setErrorMessage("Email and password are required");
      return false;
    }
    if (!validateEmail(formData.email)) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }
    if (isSignup && (!formData.name || !formData.phone || !formData.address)) {
      setErrorMessage("All fields are required for signup");
      return false;
    }
    return true;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const apiBase = API_MAP[role];
      if (!apiBase) throw new Error("Invalid role selected");

      const endpoint = isSignup ? `${apiBase}/new` : `${apiBase}/login`;

      const body = isSignup
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            address: formData.address,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Authentication failed");

      if (isSignup) {
        setSuccessMessage(
          "✅ Registered successfully! Please verify your email."
        );
        setStep("otp");
      } else {
        const normalizedRole = role.toLowerCase();
        try {
          const profile = await fetchProfileForRole(normalizedRole);
          dispatch(setUser({ name: profile.name, img: profile.img }));
        } catch (profileError) {
          toast.error(profileError.message);
        }
        login(normalizedRole);

        setSuccessMessage("✅ Logged in successfully!");
        setTimeout(() => {
          onClose();
          if (normalizedRole === "farmer") navigate("/farmer");
          else if (normalizedRole === "buyer") navigate("/buyer");
          else navigate("/supplier");
        }, 1500);
      }
    } catch (err) {
      setErrorMessage(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const apiBase = API_MAP[role];
      const response = await fetch(`${apiBase}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to send reset instructions");

      setSuccessMessage("📨 Reset instructions sent! Check your email/phone.");
      setStep("reset");
    } catch (err) {
      setErrorMessage(err.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const apiBase = API_MAP[role];
      const response = await fetch(`${apiBase}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          otp,
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Password reset failed");

      setSuccessMessage("✅ Password reset successfully! You can now login.");
      setTimeout(() => {
        setStep("auth");
        setIsSignup(false);
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_MAP[role]}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");

      setSuccessMessage("✅ Email verified! Please log in.");
      setTimeout(() => {
        setStep("auth");
        setIsSignup(false);
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_MAP[role]}/resendOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");

      setSuccessMessage("📨 OTP resent to your email.");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAuthForm = () => (
    <AnimatePresence mode="wait">
      <motion.form
        key={isSignup ? "signup" : "login"}
        onSubmit={handleAuth}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {isSignup && (
          <AnimatePresence>
            {["name", "phone", "address"].map((field, i) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <input
                  type={field === "phone" ? "tel" : "text"}
                  name={field}
                  placeholder={
                    field === "name"
                      ? "Full Name"
                      : field === "phone"
                      ? "Phone Number"
                      : "Address"
                  }
                  value={formData[field]}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 border border-white/20"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isSignup ? 0.4 : 0.1 }}
        >
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 border border-white/20"
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isSignup ? 0.5 : 0.2 }}
        >
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 border border-white/20"
            required
          />
        </motion.div>

        {!isSignup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-right"
          >
            <button
              type="button"
              onClick={() => {
                setStep("forgot");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="text-sm text-green-300 hover:text-green-200 underline focus:outline-none"
            >
              Forgot Password?
            </button>
          </motion.div>
        )}

        <FormMessages error={errorMessage} success={successMessage} />

        <motion.button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg flex items-center justify-center font-medium ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
          } text-white transition-all shadow-lg`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isSignup ? 0.6 : 0.4 }}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <span className="flex items-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
              />
              Processing...
            </span>
          ) : isSignup ? (
            "Create Account"
          ) : (
            "Sign In"
          )}
        </motion.button>
      </motion.form>
    </AnimatePresence>
  );

  const renderForgotPasswordForm = () => (
    <motion.form
      onSubmit={handleForgotPassword}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-white/80 text-center mb-4"
      >
        Enter your email or phone number to receive password reset instructions
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 border border-white/20"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center"
      >
        <div className="flex-grow border-t border-white/20"></div>
        <span className="px-3 text-white/50 text-sm">OR</span>
        <div className="flex-grow border-t border-white/20"></div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 border border-white/20"
        />
      </motion.div>

      <FormMessages error={errorMessage} success={successMessage} />

      <motion.div
        className="flex space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
              />
              Sending...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </motion.button>

        <motion.button
          type="button"
          onClick={() => {
            setStep("auth");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className="flex-1 py-3 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.form>
  );

  const renderResetPasswordForm = () => (
    <motion.form
      onSubmit={handleResetPassword}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-white/80 text-center mb-4"
      >
        Enter the OTP you received and your new password
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 border border-white/20"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 border border-white/20"
        />
      </motion.div>

      <FormMessages error={errorMessage} success={successMessage} />

      <motion.div
        className="flex space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
              />
              Resetting...
            </span>
          ) : (
            "Reset Password"
          )}
        </motion.button>

        <motion.button
          type="button"
          onClick={() => {
            setStep("auth");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className="flex-1 py-3 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
      </motion.div>
    </motion.form>
  );

  const renderOTPForm = () => (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-white/80 mb-4"
      >
        We've sent a 6-digit code to {formData.email}
      </motion.div>

      <motion.input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
        className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 border border-white/20"
        initial="hidden"
        animate="visible"
        variants={inputVariants}
        transition={{ delay: 0.5 }}
      />

      <FormMessages error={errorMessage} success={successMessage} />

      <motion.div
        className="flex space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.button
          onClick={handleVerifyOTP}
          disabled={loading}
          className="flex-1 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
              />
              Verifying...
            </span>
          ) : (
            "Verify OTP"
          )}
        </motion.button>

        <motion.button
          onClick={handleResendOTP}
          disabled={loading}
          className="flex-1 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? "Resending..." : "Resend OTP"}
        </motion.button>
      </motion.div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-white/20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-y-auto scrollbar-hide"
        >
          {/* Decorative elements */}
          <motion.div
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-green-500/20 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-blue-500/20 blur-xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />

          <div className="relative z-10">
            <motion.h2
              className="text-3xl font-bold text-center text-white mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {step === "otp"
                ? "Verify Your Email"
                : step === "forgot"
                ? "Reset Password"
                : step === "reset"
                ? "Create New Password"
                : isSignup
                ? `Join as ${role}`
                : `Welcome Back ${role}`}
            </motion.h2>

            {step === "auth" && (
              <motion.div
                className="flex justify-center space-x-3 mb-6"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {["Farmer", "Buyer", "Supplier"].map((r) => (
                  <motion.button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      role === r
                        ? "bg-green-500/90 text-white shadow-lg shadow-green-500/20"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    variants={roleVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {r}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {step === "otp"
              ? renderOTPForm()
              : step === "forgot"
              ? renderForgotPasswordForm()
              : step === "reset"
              ? renderResetPasswordForm()
              : renderAuthForm()}

            {step === "auth" && (
              <motion.p
                className="text-center text-white/70 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {isSignup ? "Already have an account?" : "New to FarmConnect?"}
                <motion.button
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="ml-2 text-green-300 hover:text-green-200 font-medium focus:outline-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSignup ? "Sign In" : "Create Account"}
                </motion.button>
              </motion.p>
            )}

            {(step === "forgot" || step === "reset" || step === "otp") && (
              <motion.button
                onClick={() => {
                  setStep("auth");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="mt-4 w-full py-2 rounded-lg bg-gray-500/80 hover:bg-gray-600 text-white font-medium transition-all flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to {isSignup ? "Sign Up" : "Login"}
              </motion.button>
            )}

            <motion.button
              onClick={onClose}
              className="mt-6 w-full  py-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-white font-medium transition-all flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FormMessages = ({ error, success }) => (
  <AnimatePresence>
    {error && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="text-red-300 text-sm p-3 bg-red-900/30 rounded-lg border border-red-500/30 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {error}
      </motion.div>
    )}

    {success && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="text-green-300 text-sm p-3 bg-green-900/30 rounded-lg border border-green-500/30 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        {success}
      </motion.div>
    )}
  </AnimatePresence>
);

export default AuthModal;
