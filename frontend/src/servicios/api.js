// src/servicios/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    // siempre con 'Bearer ' (B mayúscula), sin mezclar con token_type
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
