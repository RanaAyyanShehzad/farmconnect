import React from "react";
import { Link, useLocation } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";
import { useTranslation } from "../hooks/useTranslation";
import { useWeatherDisplay } from "../hooks/useWeatherDisplay";

function BuyerSidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const { t } = useTranslation();
  const weather = useWeatherDisplay();
  const weatherLabel =
    weather.status === "loading" ? "..." : weather.temperature;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed z-40 overflow-y-auto scrollbar-hide left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 transform h-screen  w-64 flex-shrink-0 transition-transform duration-200 ease-in-out shadow-lg 
          bg-gradient-to-b from-green-700 to-green-600 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-64"
          }`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between items-center h-14 px-6 bg-gradient-to-b from-green-800 to-green-600  border-b border-green-600">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-400 p-2 rounded-full">
              <svg
                className="w-6 h-6 text-green-800"
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
            </div>
            <Link
              to="/"
              className="text-xl font-bold text-white tracking-wider"
            >
              FarmConnect
            </Link>
          </div>
          <button
            className="lg:hidden text-white hover:text-yellow-400 transition-colors duration-150"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Close sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center px-6 py-4 border-b border-green-600">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-white font-medium">{t("nav.welcome")}</p>
            <p className="text-green-200 text-sm">{t("nav.account.buyer")}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-green-600">
          <LanguageToggle direction="row" className="justify-between" />
        </div>

        {/* Navigation */}
        <div className="px-3 py-4 space-y-1">
          <p className="text-xs font-semibold text-green-200 uppercase tracking-wider px-3 mb-2">
            {t("nav.section.main")}
          </p>
          <NavItem to="" icon="grid" active={location.pathname === "/"}>
            {t("nav.dashboard")}
          </NavItem>
          <NavItem
            to="products"
            icon="search"
            active={location.pathname === "/products"}
          >
            {t("nav.browse")}
          </NavItem>
          <NavItem
            to="cart"
            icon="shopping-cart"
            active={location.pathname === "/cart"}
          >
            {t("nav.cart")}
          </NavItem>
          <NavItem
            to="wishlist"
            icon="heart"
            active={location.pathname === "/wishlist"}
          >
            {t("nav.wishlist")}
          </NavItem>
          <NavItem
            to="myorders"
            icon="file-text"
            active={location.pathname === "/myorders"}
          >
            {t("nav.myOrders")}
          </NavItem>

          <p className="text-xs font-semibold text-green-200 uppercase tracking-wider px-3 mt-6 mb-2">
            {t("nav.section.account")}
          </p>
          <NavItem
            to="buyerprofile"
            icon="profile"
            active={location.pathname === "/buyerprofile"}
          >
            {t("nav.profile")}
          </NavItem>
          <NavItem
            to="/"
            icon="logout"
            active={location.pathname === "/reports"}
          >
            {t("nav.logout")}
          </NavItem>
        </div>

        {/* Weather widget at bottom */}
      </div>
    </>
  );
}

// Navigation Item component
function NavItem({ to, icon, active, children }) {
  const icons = {
    grid: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
    "shopping-cart": (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    search: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    heart: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    "file-text": (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    profile: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    logout: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
    ),
  };

  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-3 rounded-lg overflow-y-auto scrollbar-hide transition-all duration-200 ease-out hover:-translate-y-0.5 ${
        active
          ? "bg-green-500 text-white font-medium shadow-md"
          : "text-green-100 hover:bg-green-600 hover:text-white"
      }`}
    >
      <div className={`flex-shrink-0 mr-3 ${active ? "text-yellow-400" : ""}`}>
        {icons[icon]}
      </div>
      <div className="flex-grow">{children}</div>
      {active && (
        <div className="w-1.5 h-8 bg-yellow-400 rounded-l-full -mr-3"></div>
      )}
    </Link>
  );
}

export default BuyerSidebar;
