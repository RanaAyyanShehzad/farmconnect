import { useState, useEffect } from "react";

function WeatherAlerts() {
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("Lahore");
  const [weatherData, setWeatherData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null); // Add error state
  const API_KEY = "9d2990de3238b8b057918969498b2447";

  // ------------------------------------------
  // 1) GET CITY FROM DEVICE LOCATION
  // ------------------------------------------
  const detectLocationCity = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log("📍 Geolocation not supported, using fallback city");
        return resolve("Multan");
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            console.log("📍 Detected coords:", latitude, longitude);

          

            // ✔️ Reverse geocoding from OpenWeather
            const res = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
            );

            const data = await res.json();
            console.log("📍 OpenWeather reverse geocode:", data);

            const detected = data[0]?.name || data[0]?.state || "Multan";

            console.log("📍 Final detected city:", detected);
            resolve(detected);
          } catch (err) {
            console.log("📍 Location error:", err);
            resolve("Multan");
          }
        },
        (error) => {
          console.log("📍 Permission denied:", error);
          resolve("Multan");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // ------------------------------------------
  // 2) WEATHER API CALL
  // ------------------------------------------
  const fetchWeather = async (cityName) => {
    try {
      console.log("🌤️ Fetching weather for:", cityName);
      const res = await fetch(
        `https://agrofarm-vd8i.onrender.com/api/weather/${cityName}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🌤️ Weather API status:", res.status);

      if (!res.ok) {
        throw new Error(`Weather API failed with status: ${res.status}`);
      }

      const json = await res.json();
      console.log("🌤️ Weather API response:", json);
      return json.data;
    } catch (err) {
      console.log("🌤️ Weather API error:", err);
      throw err;
    }
  };

  // ------------------------------------------
  // 3) USER ALERTS API CALL
  // ------------------------------------------
  const fetchUserAlerts = async () => {
    try {
      console.log("⚠️ Fetching user alerts");
      const res = await fetch(
        "https://agrofarm-vd8i.onrender.com/api/weather/alerts/user",
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("⚠️ Alerts API status:", res.status);

      if (!res.ok) {
        throw new Error(`Alerts API failed with status: ${res.status}`);
      }

      const json = await res.json();
      console.log("⚠️ Alerts API response:", json);
      return json.alerts || [];
    } catch (err) {
      console.log("⚠️ Alerts API error:", err);
      return [];
    }
  };

  // ------------------------------------------
  // 4) LOAD ALL WEATHER DATA
  // ------------------------------------------
  const loadWeather = async (manual = false) => {
    try {
      console.log("🚀 Starting loadWeather...");
      setError(null); // Clear previous errors

      if (manual) setRefreshing(true);
      else setLoading(true);

      const detectedCity = await detectLocationCity();
      setCity(detectedCity);
      console.log(detectedCity);
      console.log(city);

      const weather = await fetchWeather(detectedCity);
      const userAlerts = await fetchUserAlerts();

      console.log("✅ All data loaded:", { weather, userAlerts });

      setWeatherData(weather);
      setAlerts(userAlerts);
    } catch (err) {
      console.log("❌ loadWeather error:", err);
      setError(err.message);
      // Set fallback data to prevent blank page
      setWeatherData({
        temperature: 25,
        description: "Clear",
        humidity: 50,
        windSpeed: 5,
      });
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ------------------------------------------
  // 5) INITIAL LOAD
  // ------------------------------------------
  useEffect(() => {
    console.log("🔹 Component mounted, loading weather...");
    loadWeather();
  }, []);

  // ------------------------------------------
  // WEATHER ICON
  // ------------------------------------------
  const WeatherIcon = ({ description }) => {
    const map = {
      Clear: "☀️",
      Sunny: "☀️",
      Clouds: "⛅",
      Rain: "🌧️",
      Smoke: "🌫️",
      Haze: "🌫️",
      Mist: "🌫️",
    };

    return <div className="text-4xl">{map[description] || "🌤️"}</div>;
  };

  // ------------------------------------------
  // SKELETON LOADER
  // ------------------------------------------
  if (loading) {
    console.log("🔹 Showing loading state...");
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 w-40 bg-gray-200 rounded"></div>
        <div className="h-20 w-full bg-gray-200 rounded"></div>
        <div className="h-16 w-full bg-gray-200 rounded"></div>
        <div className="h-12 w-full bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Show error state if something failed
  if (error) {
    console.log("🔹 Showing error state:", error);
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error loading weather data:</strong>
          <p>{error}</p>
          <button
            onClick={() => loadWeather(true)}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if weatherData exists before rendering
  if (!weatherData) {
    console.log("🔹 No weather data available");
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No weather data available</p>
          <button
            onClick={() => loadWeather(true)}
            className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  console.log("🔹 Rendering main component with data:", {
    weatherData,
    alerts,
  });

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-green-700">
          Weather Alerts
        </h1>

        {/* Manual Refresh Button */}
        <button
          onClick={() => loadWeather(true)}
          className={`px-4 py-2 rounded-lg text-white shadow ${
            refreshing ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Current Weather */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-4 mb-6">
        <div className="flex items-center">
          <WeatherIcon description={weatherData.description} />

          <div className="ml-4">
            <h2 className="text-3xl font-bold text-gray-800">
              {weatherData.temperature?.toFixed(1)}°C
            </h2>
            <p className="text-gray-600 capitalize">
              {weatherData.description}
            </p>
            <p className="text-sm text-gray-500">{city}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Alerts</h2>

        {alerts.length === 0 && (
          <p className="text-gray-500 text-sm">No alerts available.</p>
        )}

        {alerts.map((alert, index) => (
          <div
            key={index}
            className="bg-yellow-50 border-l-4 border-yellow-400 mb-3 p-4 rounded"
          >
            <h3 className="font-medium text-gray-800">{alert.alert}</h3>
            <p className="text-xs text-gray-500 mt-1">
              City: {alert.city} — {alert.description}
            </p>
          </div>
        ))}
      </div>

      
    </div>
  );
}

export default WeatherAlerts;
