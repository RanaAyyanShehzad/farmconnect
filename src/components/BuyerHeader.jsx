import { useState, useEffect } from "react";
import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useWeatherDisplay } from "../hooks/useWeatherDisplay";
import LanguageToggle from "./LanguageToggle";
import { useTranslation } from "../hooks/useTranslation";

function BuyerHeader({ sidebarOpen, setSidebarOpen }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Get the name from Redux store
  const { name, img } = useSelector((state) => state.user);
  const weather = useWeatherDisplay();
  const weatherLabel =
    weather.status === "loading" ? "..." : weather.temperature;
  const { t } = useTranslation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setNotificationsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <header className="bg-green-700 shadow-md sticky top-0 z-30 ">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Hamburger menu */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:text-yellow-400 focus:outline-none"
              aria-label="Open sidebar"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center space-x-2">
            <svg
              className="w-7 h-7 text-yellow-400"
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
            <span className="text-white font-semibold text-lg">
              {t("app.brand")}
            </span>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3 ml-auto">
            <LanguageToggle />
            {/* Weather */}
            <span className="hidden md:flex items-center text-white">
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
              <span title={weather.description}>{weatherLabel}</span>
            </span>

            {/* Notifications */}
            <div className="relative">
              <button
                className="text-white hover:text-yellow-400 relative"
                onClick={(e) => {
                  e.preventDefault();
                  stopPropagation(e);
                  setNotificationsOpen(!notificationsOpen);
                }}
                aria-label="Notifications"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-0 right-0 h-4 w-4 bg-yellow-400 text-xs text-green-800 font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                  onClick={stopPropagation}
                >
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    New order received
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Weather alert
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Market price update
                  </a>
                </div>
              )} */}
            </div>

            {/* User Avatar + Name (No dropdown) */}
            <div className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center">
                {img ? (
                  <img
                    src={img}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
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
                )}
              </div>
              <Link to={"/buyer/buyerprofile"}>
                <span className="hidden md:inline">
                  {name || t("roles.buyer")}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default BuyerHeader;
