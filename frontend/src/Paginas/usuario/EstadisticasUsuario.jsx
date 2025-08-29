// src/Paginas/usuario/EstadisticasUsuario.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import LayoutUsuario from "../../Componentes/LayoutUsuario.jsx";
import ChartCircular from "../../Componentes/dashboard/ChartCircular.jsx";
import ProgressBar from "../../Componentes/dashboard/ProgressBar.jsx";

import { librosAdquiridos, estadisticasPorLibro } from "../../servicios/estadisticas";
import "./EstadisticasUsuario.css";

const EstadisticasUsuario = () => {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState("estadisticas");

  // Libro seleccionado por defecto: primero disponible
  const [libroActivo, setLibroActivo] = useState(
    librosAdquiridos.length ? librosAdquiridos[0].id : null
  );

  const stats = useMemo(() => {
    if (!libroActivo) return null;
    return estadisticasPorLibro[libroActivo] || null;
  }, [libroActivo]);

  const progresoLectura = stats && stats.paginasTotales > 0
    ? Math.min(100, Math.round((stats.paginasLeidas / stats.paginasTotales) * 100))
    : 0;

  return (
    <LayoutUsuario
      activeKey={activeKey}
      onChange={setActiveKey}
      onLogout={() => alert("Cerrar sesión…")}
    >
      <div className="estadisticas-page">
        <header className="stats-header">
          <h1>Estadísticas</h1>
          <p className="stats-sub">Progreso de lectura, notas, tiempo leído e intermitencia.</p>
        </header>

        <hr className="separador" />

        {/* Selector horizontal de libros adquiridos */}
        <section
          className="libros-strip"
          role="tablist"
          aria-label="Libros adquiridos"
        >
          {librosAdquiridos.map((libro) => {
            const isActive = libroActivo === libro.id;
            return (
              <button
                key={libro.id}
                role="tab"
                aria-selected={isActive}
                className={`libro-pill ${isActive ? "activo" : ""}`}
                onClick={() => setLibroActivo(libro.id)}
                title={libro.titulo}
              >
                <span className="pill-thumb">
                  <img
                    src={libro.portada}
                    alt={`Portada de ${libro.titulo}`}
                    loading="lazy"
                  />
                </span>
                <span className="pill-title">{libro.titulo}</span>
              </button>
            );
          })}
        </section>

        {!libroActivo || !stats ? (
          <div className="estado-vacio" role="status">
            No hay libros para mostrar estadísticas. Ve a <b>Catálogo</b> o <b>Mi Biblioteca</b>.
          </div>
        ) : (
          <section className="stats-grid" aria-live="polite">
            {/* Tarjeta grande con el radial y KPIs rápidos */}
            <article className="stats-card stats-card--xl">
              <h2 className="card-title">Progreso de lectura</h2>
              <div className="chart-wrap">
                <ChartCircular porcentaje={progresoLectura} label="Lectura %" />
              </div>
              <div className="kpis">
                <div className="kpi">
                  <span>Páginas</span>
                  <strong>{stats.paginasLeidas}/{stats.paginasTotales}</strong>
                </div>
                <div className="kpi">
                  <span>Intermitencia</span>
                  <strong>{stats.intermitencia || "1 vez/semana"}</strong>
                </div>
              </div>
            </article>

            {/* Barras de progreso */}
            <article className="stats-card">
              <h3 className="card-title">Lectura</h3>
              <ProgressBar porcentaje={progresoLectura} label="Progreso" />
              <p className="card-help">Meta: completar el 100% para habilitar la descarga.</p>
            </article>

            <article className="stats-card">
              <h3 className="card-title">Notas</h3>
              <ProgressBar porcentaje={stats.notasTomadas} color="#2dbb45" label="Notas completadas" />
              <p className="card-help">Recuerda llenar las notas obligatorias.</p>
            </article>

            {/* Tiempo + CTA */}
            <article className="stats-card stats-card--cta">
              <h3 className="card-title">Tiempo leído</h3>
              <div className="stat-time">⏱ {stats.tiempoLectura} h</div>

              <button
                className="btn-seguir"
                onClick={() => navigate(`/lector/${libroActivo}`)}
              >
                Seguir leyendo
              </button>
            </article>
          </section>
        )}
      </div>
    </LayoutUsuario>
  );
};

export default EstadisticasUsuario;
