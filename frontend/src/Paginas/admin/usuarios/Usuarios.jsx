import React, { useState, useEffect } from "react";
import LayoutAdministrador from "../../../Componentes/LayoutAdministrador.jsx";
import "./Usuarios.css";
import api from "../../../servicios/api.js";
import {
  getTiempoTotalLectura,
  getIntermitenciaLectura,
} from "../../../servicios/estadisticas";

// Componente de pestañas reutilizable
const TabsNavigation = ({ tabs, activeTab, onTabChange }) => (
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

// Convierte una fecha ISO a formato legible
function formatearFecha(fechaISO) {
  if (!fechaISO) return "Sin datos";
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function convertirMinutosAHoras(minutos) {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return `${horas}h ${minutosRestantes}min`;
}

// Tabla de usuarios
const TablaUsuarios = ({ usuarios, onUsuarioClick, loading }) => {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }
  if (!usuarios.length) {
    return (
      <div className="table-empty">
        <p>No hay usuarios registrados</p>
      </div>
    );
  }
  return (
    <div className="table-container">
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>País</th>
            <th>Ciudad</th>
            <th>Estado</th>
            <th>Fecha Registro</th>
            <th>Última Actividad</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr
              key={u.usu_id}
              className="usuario-row"
              onClick={() => onUsuarioClick(u)}
            >
              <td>{u.usu_usuario}</td>
              <td>{u.usu_nombre}</td>
              <td>{u.usu_apellido}</td>
              <td>{u.usu_correo}</td>
              <td>{u.usu_pais}</td>
              <td>{u.usu_ciudad}</td>
              <td>
                <span
                  className={`status-badge ${
                    u.usu_verificado ? "active" : "pending"
                  }`}
                >
                  {u.usu_verificado ? "Activo" : "Pendiente"}
                </span>
              </td>
              <td>{new Date(u.usu_fecharegistro).toLocaleDateString()}</td>
              <td>{u.ultima_actividad || "Nunca"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Historial de compras
const HistorialUsuario = ({ usuario, onBack }) => {
  const [historial, setHistorial] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    const cargar = async () => {
      setLoadingHist(true);
      try {
        const res = await api.get(
          `/usuarios/${usuario.usu_id}/historial-compras`
        );
        setHistorial(res.data);
      } catch {
        setHistorial([]);
      } finally {
        setLoadingHist(false);
      }
    };
    cargar();
  }, [usuario]);

  if (!usuario) {
    return <p>Selecciona un usuario para ver su historial.</p>;
  }

  return (
    <div className="historial-usuario">
      <div className="actividad-header">
        <div className="usuario-info-header">
          <h3>
            {usuario.usu_nombre} {usuario.usu_apellido}
          </h3>
          <p>{usuario.usu_correo}</p>
        </div>
        <button className="btn-back" onClick={onBack}>
          ← Volver
        </button>
      </div>
      {loadingHist ? (
        <p>Cargando historial…</p>
      ) : historial.length === 0 ? (
        <p>No hay compras.</p>
      ) : (
        <div className="table-container">
          <table className="historial-table">
            <thead>
              <tr>
                <th>Libro</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Descarga</th>
                <th>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((c) => (
                <tr key={c.id}>
                  <td>{c.libro_titulo}</td>
                  <td>{new Date(c.fecha_compra).toLocaleDateString()}</td>
                  <td>${c.monto}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        c.descargado ? "downloaded" : "pending"
                      }`}
                    >
                      {c.descargado ? "Descargado" : "Pendiente"}
                    </span>
                  </td>
                  <td>{c.progreso_porcentaje || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Usuarios = () => {
  // 1) MOCKS para Actividad

  // 2) Estados generales
  const [activeKey, setActiveKey] = useState("usuarios");
  const [activeTab, setActiveTab] = useState("datos");
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioSel, setUsuarioSel] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: "",
    estado: "todos",
    fechaDesde: "",
    fechaHasta: "",
  });
  const [librosUsuario, setLibrosUsuario] = useState([]); // empieza vacío
  const [loadingLibros, setLoadingLibros] = useState(false);
  const [libroActivo, setLibroActivo] = useState(null);

  const [estadisticasLibro, setEstadisticasLibro] = useState(null);

  useEffect(() => {
    if (!libroActivo) return;

    // Asignamos datos simulados básicos, siempre.
    const stats = {
      paginasLeidas: 50,
      paginasTotales: 100,
      notasTomadas: 3,
      tiempoMinutos: 45,
      intermitenciaDias: 2,
    };

    setEstadisticasLibro(stats);
  }, [libroActivo]);

  // 5) Carga lista de usuarios
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const res = await api.get("/administradores/usuarios");
        setUsuarios(res.data);
      } catch {}
      setLoading(false);
    };
    cargar();
  }, [filtros]);

  const [actividadUsuario, setActividadUsuario] = useState([]);
  const [loadingActividad, setLoadingActividad] = useState(false);

  // 6) Handlers comunes

  const handleUsuarioClick = async (u) => {
    setUsuarioSel(u);
    setActiveTab("actividad");

    setLoadingActividad(true);
    try {
      const res = await api.get(
        `/administradores/usuarios/${u.usu_id}/actividad`
      );
      setActividadUsuario(res.data); // res.data es un array de libros con progreso
    } catch (err) {
      console.error("Error al cargar actividad:", err);
      setActividadUsuario([]);
    } finally {
      setLoadingActividad(false);
    }
  };

  const handleUsuarioDeselect = () => {
    setUsuarioSel(null); // quita el usuario
    setActiveTab("datos"); // vuelve a la pestaña Datos
  };

  const handleFiltroChange = (campo, val) =>
    setFiltros((f) => ({ ...f, [campo]: val }));

  const handleTabChange = (key) => {
    // Si intentan ir a Actividad o Historial sin usuario seleccionado:
    if ((key === "actividad" || key === "historial") && !usuarioSel) {
      return; // cancela el cambio de pestaña
    }
    if (key === "datos") {
      setUsuarioSel(null);
    }
    setActiveTab(key);
  };

  // 7) Definición de pestañas
  const tabs = [
    {
      key: "datos",
      label: "Datos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
        </svg>
      ),
    },
    {
      key: "actividad",
      label: "Actividad",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0" />
        </svg>
      ),
    },
    {
      key: "historial",
      label: "Historial",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1.001.025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z" />
          <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
          <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
        </svg>
      ),
    },
  ];

  // Render según pestaña
  const renderTabContent = () => {
    switch (activeTab) {
      case "datos":
        return (
          <div className="tab-content">
            <div className="filtros-row">
              <input
                placeholder="Buscar por nombre, email o usuario..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange("busqueda", e.target.value)}
                className="filtro-input"
              />
              <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange("estado", e.target.value)}
                className="filtro-select"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="pendiente">Pendientes</option>
                <option value="eliminado">Eliminados</option>
              </select>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) =>
                  handleFiltroChange("fechaDesde", e.target.value)
                }
                className="filtro-date"
              />
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) =>
                  handleFiltroChange("fechaHasta", e.target.value)
                }
                className="filtro-date"
              />
            </div>
            <TablaUsuarios
              usuarios={usuarios}
              onUsuarioClick={handleUsuarioClick}
              loading={loading}
            />
          </div>
        );

      case "actividad":
        return (
          <div className="tab-content actividad-tab">
            {!usuarioSel ? (
              <div className="actividad-empty">
                <p>
                  Selecciona un usuario en la pestaña Datos para ver su
                  actividad.
                </p>
              </div>
            ) : (
              <div className="actividad-usuario">
                <div className="actividad-header">
                  <div className="usuario-info-header">
                    <h3>
                      {usuarioSel.usu_nombre} {usuarioSel.usu_apellido}
                    </h3>
                    <p>{usuarioSel.usu_correo}</p>
                  </div>
                  <button className="btn-back" onClick={handleUsuarioDeselect}>
                    ← Volver
                  </button>
                </div>

                {loadingActividad ? (
                  <p>Cargando actividad…</p>
                ) : actividadUsuario.length === 0 ? (
                  <p>No hay libros en progreso.</p>
                ) : (
                  <div className="actividad-libros-grid">
                    {actividadUsuario.map((libro) => {
                      const porcentaje =
                        (libro.paginas_leidas / libro.paginas_totales) * 100 ||
                        0;

                      return (
                        <div
                          className="actividad-libro-card"
                          key={libro.lib_id}
                        >
                          <h2 className="libro-titulo">{libro.lib_titulo}</h2>

                          <div className="barra-progreso">
                            <div
                              className="relleno"
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                          <p className="porcentaje">{porcentaje.toFixed(0)}%</p>

                          <div className="actividad-kpis">
                            <div className="kpi">
                              <span>Páginas</span>
                              <strong>
                                {libro.paginas_leidas}/{libro.paginas_totales}
                              </strong>
                            </div>
                            <div className="kpi">
                              <span>Horas Leídas</span>
                              <strong>
                                {convertirMinutosAHoras(libro.tiempo_minutos)}
                              </strong>
                            </div>
                            <div className="kpi">
                              <span>Notas</span>
                              <strong>{libro.notas}</strong>
                            </div>
                            <div className="kpi">
                              <span>Última sesión</span>
                              <strong>
                                {libro.ultima_sesion
                                  ? formatearFecha(libro.ultima_sesion)
                                  : "Sin datos"}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "historial":
        return (
          <div className="tab-content">
            <HistorialUsuario
              usuario={usuarioSel}
              onBack={handleUsuarioDeselect}
            />
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
      <div className="usuarios-admin">
        <header className="page-header">
          <h1>Gestión de Usuarios</h1>
          <p className="page-subtitle">
            Administración completa de usuarios, actividad y historial
          </p>
        </header>
        <TabsNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        {renderTabContent()}
      </div>
    </LayoutAdministrador>
  );
};

export default Usuarios;
