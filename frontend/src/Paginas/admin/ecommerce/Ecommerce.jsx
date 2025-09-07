import React, { useState, useEffect } from "react";
import LayoutAdministrador from "../../../Componentes/LayoutAdministrador.jsx";
import "./Ecommerce.css";

// Componente de pestañas reutilizable
const TabsNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="tabs-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// Componente del iframe de MercadoPago
const MercadoPagoIframe = ({ url, title }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div className="iframe-container">
      {loading && (
        <div className="iframe-loading">
          <div className="loading-spinner"></div>
          <p>Cargando {title}...</p>
        </div>
      )}
      
      {error && (
        <div className="iframe-error">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
          </svg>
          <h3>Error al cargar {title}</h3>
          <p>No se pudo conectar con el servicio. Verifica tu conexión o intenta más tarde.</p>
          <button 
            className="btn-retry"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      )}

      <iframe
        src={url}
        title={title}
        className={`mercadopago-iframe ${loading ? 'hidden' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        allow="payment"
      />
    </div>
  );
};

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
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5"/>
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
          <span className="metrica-value">${datos.ingresosMes?.toLocaleString()}</span>
        </div>
      </div>

      <div className="metrica-card">
        <div className="metrica-icon transacciones-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
            <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2-2zm2 0a2 2 0 0 0-2 2v4a2 2 0 0 0 2-2zm8 0a2 2 0 0 1 2 2v4a2 2 0 0 1-2-2zm2 0a2 2 0 0 0 2 2v4a2 2 0 0 0-2-2z"/>
          </svg>
        </div>
        <div className="metrica-content">
          <span className="metrica-label">Transacciones</span>
          <span className="metrica-value">{datos.transacciones}</span>
        </div>
      </div>

      <div className="metrica-card">
        <div className="metrica-icon comision-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.37 2.37 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.75 0V5.37a.5.5 0 0 0-.12-.325L12.27 2H3.73L1.12 5.045A.5.5 0 0 0 1 5.37v.255a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0M1.5 8.5A.5.5 0 0 1 2 9v6h12V9a.5.5 0 0 1 1 0v6h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1V9a.5.5 0 0 1 .5-.5"/>
          </svg>
        </div>
        <div className="metrica-content">
          <span className="metrica-label">Comisiones</span>
          <span className="metrica-value">${datos.comisiones?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const Ecommerce = () => {
  const [activeKey, setActiveKey] = useState("ecommerce");
  const [activeTab, setActiveTab] = useState("panel");
  const [metricas, setMetricas] = useState({
    ventasHoy: 0,
    ingresosMes: 0,
    transacciones: 0,
    comisiones: 0
  });
  const [loadingMetricas, setLoadingMetricas] = useState(true);

  // URLs de MercadoPago (debes reemplazar con las URLs reales)
  const mercadoPagoUrls = {
    login: "https://www.mercadopago.com.co/developers/panel/login",
    panel: "https://www.mercadopago.com.co/developers/panel",
    ventas: "https://www.mercadopago.com.co/activities",
    configuracion: "https://www.mercadopago.com.co/settings/account"
  };

  const tabs = [
    {
      key: "panel",
      label: "Panel Principal",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M2.5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm5 2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1m-5 1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zm9-1h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1"/>
      </svg>
    },
    {
      key: "ventas", 
      label: "Ventas",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5"/>
      </svg>
    },
    {
      key: "configuracion",
      label: "Configuración", 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52z"/>
      </svg>
    },
    {
      key: "reportes",
      label: "Reportes",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0z"/>
        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
      </svg>
    }
  ];

  useEffect(() => {
    cargarMetricas();
  }, []);

  const cargarMetricas = async () => {
    try {
      setLoadingMetricas(true);
      // TODO: Conectar con endpoint FastAPI /admin/ecommerce/metricas
      // const response = await api.get('/admin/ecommerce/metricas');
      // setMetricas(response.data);

      // Datos simulados
      setTimeout(() => {
        setMetricas({
          ventasHoy: 23,
          ingresosMes: 15420.50,
          transacciones: 487,
          comisiones: 1230.15
        });
        setLoadingMetricas(false);
      }, 1000);
    } catch (error) {
      console.error('Error cargando métricas:', error);
      setLoadingMetricas(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "panel":
        return (
          <div className="tab-content">
            <div className="ecommerce-header">
              <h3>Panel de MercadoPago</h3>
              <p>Accede a tu panel de desarrollador de MercadoPago para gestionar pagos y configuraciones</p>
            </div>
            
            <MetricasVentas loading={loadingMetricas} datos={metricas} />
            
            <MercadoPagoIframe 
              url={mercadoPagoUrls.panel}
              title="Panel de MercadoPago"
            />
          </div>
        );

      case "ventas":
        return (
          <div className="tab-content">
            <div className="ecommerce-header">
              <h3>Actividad de Ventas</h3>
              <p>Revisa todas las transacciones y movimientos de tu cuenta MercadoPago</p>
            </div>
            
            <MercadoPagoIframe 
              url={mercadoPagoUrls.ventas}
              title="Actividad de Ventas MercadoPago"
            />
          </div>
        );

      case "configuracion":
        return (
          <div className="tab-content">
            <div className="ecommerce-header">
              <h3>Configuración de Cuenta</h3>
              <p>Administra tu cuenta de MercadoPago, credenciales y configuraciones de pago</p>
            </div>
            
            <MercadoPagoIframe 
              url={mercadoPagoUrls.configuracion}
              title="Configuración MercadoPago"
            />
          </div>
        );

      case "reportes":
        return (
          <div className="tab-content">
            <div className="placeholder-content">
              <h3>Reportes Personalizados</h3>
              <p>Genera reportes detallados de tus ventas y transacciones</p>
              
              <div className="reportes-grid">
                <div className="reporte-card">
                  <h4>Reporte Mensual</h4>
                  <p>Resumen completo de ventas del mes actual</p>
                  <button className="btn-reporte">Generar PDF</button>
                </div>
                
                <div className="reporte-card">
                  <h4>Análisis de Productos</h4>
                  <p>Productos más vendidos y tendencias</p>
                  <button className="btn-reporte">Ver Análisis</button>
                </div>
                
                <div className="reporte-card">
                  <h4>Estado de Pagos</h4>
                  <p>Pagos pendientes, aprobados y rechazados</p>
                  <button className="btn-reporte">Ver Estado</button>
                </div>
                
                <div className="reporte-card">
                  <h4>Comisiones</h4>
                  <p>Detalle de comisiones cobradas por MercadoPago</p>
                  <button className="btn-reporte">Descargar</button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Contenido no encontrado</div>;
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
          <h1>eCommerce - MercadoPago</h1>
          <p className="page-subtitle">
            Gestión completa de pagos y transacciones a través de MercadoPago
          </p>
        </header>

        <TabsNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {renderTabContent()}
      </div>
    </LayoutAdministrador>
  );
};

export default Ecommerce;