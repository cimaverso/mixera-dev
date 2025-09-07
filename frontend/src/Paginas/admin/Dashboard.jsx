import React, { useState, useEffect } from "react";
import LayoutAdministrador from "../../Componentes/LayoutAdministrador.jsx";
import ChartCircular from "../../Componentes/dashboard/ChartCircular.jsx";
import ProgressBar from "../../Componentes/dashboard/ProgressBar.jsx";
import "./Dashboard.css";

const Dashboard = () => {
  const [activeKey, setActiveKey] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    totalLibros: 0,
    ventasHoy: 0,
    ventasMes: 0,
    ingresosMes: 0,
    descargas: 0,
    loading: true
  });

  useEffect(() => {
    cargarDashboardData();
  }, []);

  const cargarDashboardData = async () => {
    try {
      // TODO: Conectar con endpoint FastAPI /admin/dashboard
      // const response = await api.get('/admin/dashboard');
      // setDashboardData(response.data);
      
      // Datos simulados para desarrollo
      setTimeout(() => {
        setDashboardData({
          totalUsuarios: 1247,
          usuariosActivos: 892,
          totalLibros: 156,
          ventasHoy: 23,
          ventasMes: 687,
          ingresosMes: 15420.50,
          descargas: 2341,
          loading: false
        });
      }, 1000);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const porcentajeUsuariosActivos = dashboardData.totalUsuarios > 0 
    ? Math.round((dashboardData.usuariosActivos / dashboardData.totalUsuarios) * 100)
    : 0;

  if (dashboardData.loading) {
    return (
      <LayoutAdministrador
        activeKey={activeKey}
        onChange={setActiveKey}
        onLogout={() => alert("Cerrar sesión...")}
      >
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Cargando datos del dashboard...</p>
        </div>
      </LayoutAdministrador>
    );
  }

  return (
    <LayoutAdministrador
      activeKey={activeKey}
      onChange={setActiveKey}
      onLogout={() => alert("Cerrar sesión...")}
    >
      <div className="dashboard-admin">
        <header className="dashboard-header">
          <h1>Dashboard Administrativo</h1>
          <p className="dashboard-subtitle">
            Resumen general del sistema y métricas principales
          </p>
        </header>

        <div className="dashboard-grid">
          {/* Métricas principales */}
          <section className="metrics-cards">
            <div className="metric-card">
              <div className="metric-icon users-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
                </svg>
              </div>
              <div className="metric-content">
                <span className="metric-label">Total Usuarios</span>
                <span className="metric-value">{dashboardData.totalUsuarios.toLocaleString()}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon books-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5 0h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2 2H3a2 2 0 0 1-2-2h1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1H1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1H3a2 2 0 0 1 2-2"/>
                </svg>
              </div>
              <div className="metric-content">
                <span className="metric-label">Total Libros</span>
                <span className="metric-value">{dashboardData.totalLibros}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon sales-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5"/>
                </svg>
              </div>
              <div className="metric-content">
                <span className="metric-label">Ventas Hoy</span>
                <span className="metric-value">{dashboardData.ventasHoy}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon revenue-icon">
                <span>$</span>
              </div>
              <div className="metric-content">
                <span className="metric-label">Ingresos Mes</span>
                <span className="metric-value">${dashboardData.ingresosMes.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Gráfico de usuarios activos */}
          <section className="chart-section">
            <div className="chart-card">
              <h3 className="chart-title">Usuarios Activos</h3>
              <div className="chart-container">
                <ChartCircular 
                  porcentaje={porcentajeUsuariosActivos} 
                  label="Activos %" 
                />
              </div>
              <div className="chart-stats">
                <div className="stat-item">
                  <span className="stat-label">Activos</span>
                  <span className="stat-value">{dashboardData.usuariosActivos}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{dashboardData.totalUsuarios}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Métricas adicionales */}
          <section className="progress-section">
            <div className="progress-card">
              <h3 className="progress-title">Rendimiento Mensual</h3>
              
              <ProgressBar 
                porcentaje={Math.min(100, Math.round((dashboardData.ventasMes / 1000) * 100))} 
                color="#e73180" 
                label="Meta de Ventas (1000)" 
              />
              
              <ProgressBar 
                porcentaje={Math.min(100, Math.round((dashboardData.descargas / 5000) * 100))} 
                color="#2dbb45" 
                label="Meta de Descargas (5000)" 
              />

              <div className="progress-stats">
                <div className="progress-stat">
                  <span>Ventas del mes</span>
                  <strong>{dashboardData.ventasMes}</strong>
                </div>
                <div className="progress-stat">
                  <span>Descargas totales</span>
                  <strong>{dashboardData.descargas.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* Acciones rápidas */}
          <section className="quick-actions">
            <div className="actions-card">
              <h3 className="actions-title">Acciones Rápidas</h3>
              
              <button 
                className="action-btn primary"
                onClick={() => window.location.href = '/admin/libros'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                </svg>
                Agregar Libro
              </button>
              
              <button 
                className="action-btn secondary"
                onClick={() => window.location.href = '/admin/usuarios'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0"/>
                </svg>
                Gestionar Usuarios
              </button>
              
              <button 
                className="action-btn tertiary"
                onClick={() => window.location.href = '/admin/ecommerce'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518z"/>
                </svg>
                Ver Reportes
              </button>
            </div>
          </section>
        </div>
      </div>
    </LayoutAdministrador>
  );
};

export default Dashboard;