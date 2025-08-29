import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");

  if (!token) return <Navigate to="/login" replace />;

  try {
    const { exp } = jwtDecode(token);
    if (Date.now() >= exp * 1000) {
      localStorage.removeItem("access_token");
      return <Navigate to="/login" replace />;
    }
  } catch {
    localStorage.removeItem("access_token");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
