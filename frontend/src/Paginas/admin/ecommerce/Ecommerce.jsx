import React, { useState, useEffect } from "react";
import LayoutAdministrador from "../../../Componentes/LayoutAdministrador.jsx";
import "./Ecommerce.css";
import api from "../../../servicios/api.js";

// Métricas de ventas
const MetricasVentas = ({ loading, datos }) => {
  if (loading) {
    return (
      <div className="metricas-loading">
        <div className="loading-spinner"></div>
        <p>Cargando métricas...</p>
      </div>
    );
  }

  return (
    <div className="metricas-ventas">
      <div className="metrica-card">
        <div className="metrica-icon ventas-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5" />
          </svg>
        </div>
        <div className="metrica-content">
          <span className="metrica-label">Ventas Hoy</span>
          <span className="metrica-value">{datos.ventasHoy}</span>
        </div>
      </div>

      <div className="metrica-card">
        <div className="metrica-icon ingresos-icon">
          <span>$</span>
        </div>
        <div className="metrica-content">
          <span className="metrica-label">Ingresos Mes</span>
          <span className="metrica-value">
            ${datos.ingresosMes?.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="metrica-card">
        <div className="metrica-icon transacciones-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
            <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2-2zm2 0a2 2 0 0 0-2 2v4a2 2 0 0 0 2-2zm8 0a2 2 0 0 1 2 2v4a2 2 0 0 1-2-2zm2 0a2 2 0 0 0 2 2v4a2 2 0 0 0-2-2z" />
          </svg>
        </div>
        <div className="metrica-content">
          <span className="metrica-label">Transacciones</span>
          <span className="metrica-value">{datos.transacciones}</span>
        </div>
      </div>

      <div className="metrica-card">
        <div className="metrica-icon comision-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.37 2.37 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.75 0V5.37a.5.5 0 0 0-.12-.325L12.27 2H3.73L1.12 5.045A.5.5 0 0 0 1 5.37v.255a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0M1.5 8.5A.5.5 0 0 1 2 9v6h12V9a.5.5 0 0 1 1 0v6h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1V9a.5.5 0 0 1 .5-.5" />
          </svg>
        </div>
        <div className="metrica-content">
          <span className="metrica-label">Comisiones</span>
          <span className="metrica-value">
            ${datos.comisiones?.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const Ecommerce = () => {
  const [activeKey, setActiveKey] = useState("ecommerce");
  const [metricas, setMetricas] = useState({
    ventasHoy: 0,
    ingresosMes: 0,
    transacciones: 0,
    comisiones: 0,
  });
  const [loadingMetricas, setLoadingMetricas] = useState(true);

  useEffect(() => {
    cargarMetricas();
  }, []);

  const cargarMetricas = async () => {
    try {
      setLoadingMetricas(true);

      // Llamada real al backend
      const response = await api.get("/estadisticas/");

      // Ajustar los nombres si es necesario
      setMetricas({
        ventasHoy: response.data.ventas_hoy,
        ingresosMes: response.data.ingresos_mes,
        transacciones: response.data.transacciones,
        comisiones: response.data.comisiones,
      });

      setLoadingMetricas(false);
    } catch (error) {
      console.error("Error cargando métricas:", error);
      setLoadingMetricas(false);
    }
  };

  return (
    <LayoutAdministrador
      activeKey={activeKey}
      onChange={setActiveKey}
      onLogout={() => alert("Cerrar sesión...")}
    >
      <div className="ecommerce-admin">
        <header className="page-header">
          <h1>eCommerce - Panel Principal</h1>
          <p className="page-subtitle">
            Resumen de métricas de ventas y transacciones
          </p>
        </header>

        <div className="main-content">
          <div className="ecommerce-header">
            <h3>Panel de Control</h3>
            <p>
              Visualiza las métricas principales de tu negocio en tiempo real
            </p>
          </div>

          <MetricasVentas loading={loadingMetricas} datos={metricas} />
{/* 
          <div className="desarrollo-section">
            <div className="desarrollo-card">
              <div className="desarrollo-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52z" />
                </svg>
              </div>
              <div className="desarrollo-content">
                <h4>Funcionalidades en Desarrollo</h4>
                <p>
                  Las próximas funciones incluirán gestión de productos, reportes detallados,
                  integración completa con MercadoPago y análisis avanzados.
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </LayoutAdministrador>
  );
};

export default Ecommerce;