import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadWeather } from "../features/weatherSlice";
import { useAuth } from "../context/AuthContext";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

function WeatherBootstrap() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || loading) {
      return undefined;
    }
    dispatch(loadWeather());
    const intervalId = setInterval(() => {
      dispatch(loadWeather());
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [dispatch, isAuthenticated, loading]);

  return null;
}

export default WeatherBootstrap;
