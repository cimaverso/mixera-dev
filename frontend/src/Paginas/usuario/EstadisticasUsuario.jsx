import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LayoutUsuario from "../../Componentes/LayoutUsuario.jsx";
import ChartCircular from "../../Componentes/dashboard/ChartCircular.jsx";
import {
  getLibrosAdquiridos,
  getTiempoTotalLectura,
  getIntermitenciaLectura,
} from "../../servicios/estadisticas";
import api from "../../servicios/api";
import "./EstadisticasUsuario.css";
import { textosAPI } from "../../servicios/textosAPI";

const EstadisticasUsuario = () => {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState("estadisticas");
  const [librosAdquiridos, setLibrosAdquiridos] = useState([]);
  const [libroActivo, setLibroActivo] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [porcentajeNotas, setPorcentajeNotas] = useState(0);

  useEffect(() => {
    getLibrosAdquiridos().then((data) => {
      setLibrosAdquiridos(data);
      if (data.length) setLibroActivo(data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!libroActivo) {
      setStats(null);
      return;
    }
    setLoadingStats(true);

    Promise.all([
      api.get(`/libros/${libroActivo}`),
      getTiempoTotalLectura(libroActivo),
      getIntermitenciaLectura(libroActivo),
    ])
      .then(([resLibro, tiempo, intermitencia]) => {
        const libro = resLibro.data;
        setStats({
          paginasLeidas: libro.progreso_pagina_actual,
          paginasTotales: libro.progreso_pagina_total,
          notasTomadas: libro.notasTomadas || 0,
          porcentajeNotas: libro.porcentajeNotas || 0,
          tiempoLectura: tiempo.horas ?? 0,
          minutosLectura: tiempo.minutos ?? 0,
          intermitencia: Math.round(intermitencia.dias ?? 0), // Redondeado a días enteros
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [libroActivo]);

  useEffect(() => {
    if (!libroActivo || !stats?.paginasTotales) {
      setPorcentajeNotas(0);
      return;
    }
    textosAPI.getTextos(libroActivo).then((textos) => {
      const paginasConNotas = new Set(textos.map((t) => t.txt_pagina));
      const porcentaje =
        paginasConNotas.size > 0 && stats.paginasTotales > 0
          ? Math.round((paginasConNotas.size / stats.paginasTotales) * 100)
          : 0;
      setPorcentajeNotas(porcentaje);
    });
  }, [libroActivo, stats?.paginasTotales]);

  const progresoLectura =
    stats && stats.paginasTotales > 0
      ? Math.min(100, Math.round((stats.paginasLeidas / stats.paginasTotales) * 100))
      : 0;

  // Progreso total simple
  const progresoTotal = Math.round((progresoLectura + porcentajeNotas) / 2);

  // Iconos SVG optimizados
  const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8.5 2.687c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
    </svg>
  );

  const NotesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
      <path fillRule="evenodd" d="M6 1h6v7a.5.5 0 0 1-.757.429L9 7.083 6.757 8.43A.5.5 0 0 1 6 8z"/>
      <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2"/>
      <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z"/>
    </svg>
  );

  const TimeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
    </svg>
  );

  const ProgressIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
      <path fillRule="evenodd" d="M0 0h1v15h15v1H0V0Zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5Z"/>
    </svg>
  );

  const IntermitenciaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
      <path d="M4 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4m2.625.547a3 3 0 0 0-5.584.953H.5a.5.5 0 0 0 0 1h.541A3 3 0 0 0 7 8a1 1 0 0 1 2 0 3 3 0 0 0 5.959.5h.541a.5.5 0 0 0 0-1h-.541a3 3 0 0 0-5.584-.953A2 2 0 0 0 8 6c-.532 0-1.016.208-1.375.547M14 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/>
    </svg>
  );

  return (
    <LayoutUsuario
      activeKey={activeKey}
      onChange={setActiveKey}
      onLogout={() => alert("Cerrar sesión…")}
    >
      <div className="estadisticas-page">
        <header className="stats-header">
          <h1>Estadísticas</h1>
          <p className="stats-sub">
            Progreso de lectura, notas, tiempo leído e intermitencia.
          </p>
        </header>

        <hr className="separador" />

        {loading ? (
          <div className="loading-state">Cargando libros...</div>
        ) : (
          <section className="libros-strip" role="tablist" aria-label="Libros adquiridos">
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
        )}

        {!libroActivo ? (
          <div className="estado-vacio" role="status">
            Selecciona un libro para ver sus estadísticas.
          </div>
        ) : loadingStats ? (
          <div className="estado-vacio" role="status">
            Cargando estadísticas…
          </div>
        ) : !stats ? (
          <div className="estado-vacio" role="status">
            No hay estadísticas disponibles para este libro.
          </div>
        ) : (
          <section className="stats-grid" aria-live="polite">
            {/* Tarjeta de progreso */}
            <article className="stats-card stats-card--progreso">
              <header className="card-header">
                <ProgressIcon />
                <h3 className="card-title">Progreso</h3>
              </header>
              
              <div className="card-content">
                <div className="stat-display">
                  <span className="stat-number">{progresoTotal}%</span>
                </div>
              </div>
              
              <footer className="card-footer">
                <p className="card-help">
                  Lectura: {progresoLectura}% | Notas: {porcentajeNotas}%
                </p>
              </footer>
            </article>

            {/* Tarjeta de lectura */}
            <article className="stats-card stats-card--lectura">
              <header className="card-header">
                <BookIcon />
                <h3 className="card-title">Lectura</h3>
              </header>
              
              <div className="card-content">
                <div className="stat-display">
                  <span className="stat-number">{progresoLectura}%</span>
                </div>
              </div>
              
              <footer className="card-footer">
                <p className="card-help">
                  Meta: completar el 100% para habilitar la descarga.
                </p>
              </footer>
            </article>

            {/* Tarjeta de notas */}
            <article className="stats-card stats-card--notas">
              <header className="card-header">
                <NotesIcon />
                <h3 className="card-title">Notas</h3>
              </header>
              
              <div className="card-content">
                <div className="stat-display">
                  <span className="stat-number">{porcentajeNotas}%</span>
                </div>
              </div>
              
              <footer className="card-footer">
                <p className="card-help">
                  Tienes notas en {porcentajeNotas}% de las páginas
                </p>
              </footer>
            </article>

            {/* Tarjeta de tiempo */}
            <article className="stats-card stats-card--tiempo">
              <header className="card-header">
                <TimeIcon />
                <h3 className="card-title">Tiempo leído</h3>
              </header>
              
              <div className="card-content">
                <div className="stat-display">
                  <span className="stat-number">
                    {stats.tiempoLectura < 1
                      ? `${stats.minutosLectura} min`
                      : `${Math.floor(stats.tiempoLectura)} h`}
                  </span>
                </div>
              </div>
              
              <footer className="card-footer">
                <button
                  className="btn-seguir"
                  onClick={() => navigate(`/lector/${libroActivo}`)}
                >
                  Seguir leyendo
                </button>
              </footer>
            </article>

            {/* Tarjeta de intermitencia */}
            <article className="stats-card stats-card--intermitencia">
              <header className="card-header">
                <IntermitenciaIcon />
                <h3 className="card-title">Intermitencia</h3>
              </header>
              
              <div className="card-content">
                <div className="stat-display">
                  <span className="stat-number">{stats.intermitencia}</span>
                </div>
              </div>
              
              <footer className="card-footer">
                <p className="card-help">
                  {stats.intermitencia === 0 
                    ? "¡Excelente constancia en la lectura!" 
                    : stats.intermitencia === 1 
                    ? "1 día sin leer" 
                    : `${stats.intermitencia} días sin leer consecutivos`}
                </p>
              </footer>
            </article>
          </section>
        )}
      </div>
    </LayoutUsuario>
  );
};

export default EstadisticasUsuario;