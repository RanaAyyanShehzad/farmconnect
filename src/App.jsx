import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./App/store";

// Layouts
import LandingPage from "./pages/LandingPage";
import AdminLayout from "./components/AdminLayout";
import BuyerLayout from "./components/BuyerLayout";
import SupplierLayout from "./components/SupplierLayout";

// Farmer Pages
import Dashboard from "./pages/Dashboard";
import WeatherAlerts from "./pages/WeatherAlerts";
import ProductManagement from "./pages/ProductManagement";
import OrderManagement from "./pages/OrderManagement";
import ShoppingCart from "./pages/ShoppingCart";
import FarmerProfile from "./pages/FarmerProfile";
import Whishlist from "./pages/Whishlist";
import MyOrders from "./pages/MyOrders";
import FarmerProducts from "./pages/FarmerProducts";

// Buyer Pages
import BuyerDashboard from "./pages/BuyerDashboard";
import BuyerProducts from "./pages/BuyerProducts";
import BuyerCart from "./pages/BuyerCart";
import BuyerProfile from "./pages/BuyerProfile";

// Supplier Pages
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierProfile from "./pages/SupplierProfile";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatBotWidget from "./components/ChatBotWidget";
import WeatherBootstrap from "./components/WeatherBootstrap";
import { LanguageProvider } from "./context/LanguageContext";

// Auth Context
// import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <WeatherBootstrap />
            <ToastContainer
              position="top-right"
              autoClose={4000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
            <ChatBotWidget />
            <Routes>
              {/* Public Route */}
              <Route path="/" element={<LandingPage />} />

              {/* Protected Farmer Routes */}
              <Route
                path="/farmer"
                element={
                  <ProtectedRoute allowedRoles={["farmer"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="weather" element={<WeatherAlerts />} />
                <Route path="farmerProducts" element={<FarmerProducts />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="wishlist" element={<Whishlist />} />
                <Route path="cart" element={<ShoppingCart />} />
                <Route path="myorders" element={<MyOrders />} />
                <Route path="farmerprofile" element={<FarmerProfile />} />
              </Route>
              {/* Protected Buyer Routes */}
              <Route
                path="/buyer"
                element={
                  <ProtectedRoute allowedRoles={["buyer"]}>
                    <BuyerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<BuyerDashboard />} />
                <Route path="products" element={<BuyerProducts />} />
                <Route path="cart" element={<BuyerCart />} />
                <Route path="myorders" element={<MyOrders />} />
                <Route path="wishlist" element={<Whishlist />} />
                <Route path="buyerprofile" element={<BuyerProfile />} />
              </Route>
              {/* Protected Supplier Routes */}
              <Route
                path="/supplier"
                element={
                  <ProtectedRoute>
                    <SupplierLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SupplierDashboard />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="weather" element={<WeatherAlerts />} />
                <Route path="profile" element={<SupplierProfile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </Provider>
  );
}
