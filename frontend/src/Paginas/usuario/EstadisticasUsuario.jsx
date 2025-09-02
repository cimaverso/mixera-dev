import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LayoutUsuario from "../../Componentes/LayoutUsuario.jsx";
import ChartCircular from "../../Componentes/dashboard/ChartCircular.jsx";
import ProgressBar from "../../Componentes/dashboard/ProgressBar.jsx";
import {
  getLibrosAdquiridos,
  getTiempoTotalLectura,
  getIntermitenciaLectura,
} from "../../servicios/estadisticas";
import api from "../../servicios/api"; // para traer el libro por id
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
  // Nuevo estado para porcentaje de notas reales
  const [porcentajeNotas, setPorcentajeNotas] = useState(0);

  // Cargar libros adquiridos al montar
  useEffect(() => {
    getLibrosAdquiridos().then((data) => {
      setLibrosAdquiridos(data);
      if (data.length) setLibroActivo(data[0].id);
      setLoading(false);
    });
  }, []);

  // Cargar estadísticas del libro activo
  useEffect(() => {
    if (!libroActivo) {
      setStats(null);
      return;
    }
    setLoadingStats(true);

    // Traer datos del libro + tiempo de lectura en paralelo
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
          tiempoLectura: tiempo.horas ?? 0, // ahora sí el tiempo viene del endpoint correcto
          minutosLectura: tiempo.minutos ?? 0,
          intermitencia: intermitencia.dias ?? 0,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [libroActivo]);

  // Calcular porcentaje de páginas con notas del usuario
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
      ? Math.min(
          100,
          Math.round((stats.paginasLeidas / stats.paginasTotales) * 100)
        )
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
          <p className="stats-sub">
            Progreso de lectura, notas, tiempo leído e intermitencia.
          </p>
        </header>

        <hr className="separador" />

        {/* Selector horizontal de libros adquiridos */}
        {loading ? (
          <div>Cargando libros...</div>
        ) : (
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
        )}

        {/* Estadísticas del libro seleccionado */}
        {!libroActivo ? (
          <div className="estado-vacio" role="status" style={{ marginTop: 40 }}>
            Selecciona un libro para ver sus estadísticas.
          </div>
        ) : loadingStats ? (
          <div className="estado-vacio" role="status" style={{ marginTop: 40 }}>
            Cargando estadísticas…
          </div>
        ) : !stats ? (
          <div className="estado-vacio" role="status" style={{ marginTop: 40 }}>
            No hay estadísticas disponibles para este libro.
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
                  <strong>
                    {stats.paginasLeidas}/{stats.paginasTotales}
                  </strong>
                </div>
                <div className="kpi">
                  <span>Frecuencia de lectura</span>
                  <strong>
                    {stats.intermitencia === 0
                      ? "Sin datos"
                      : stats.intermitencia < 1
                      ? "Varias veces al día"
                      : stats.intermitencia < 7
                      ? `${Math.round(7 / stats.intermitencia)} día(s)/semana`
                      : `1 vez cada ${Math.round(stats.intermitencia)} días`}
                  </strong>
                </div>
              </div>
            </article>

            {/* Barras de progreso */}
            <article className="stats-card">
              <h3 className="card-title">Lectura</h3>
              <ProgressBar porcentaje={progresoLectura} label="Progreso" />
              <p className="card-help">
                Meta: completar el 100% para habilitar la descarga.
              </p>
            </article>

            <article className="stats-card">
              <h3 className="card-title">Notas</h3>
              <ProgressBar
                porcentaje={porcentajeNotas}
                color="#2dbb45"
                label="Notas completadas"
              />
              <p className="card-help">
                {`Tienes notas en ${porcentajeNotas}% de las páginas`}
              </p>
            </article>

            {/* Tiempo + CTA */}
            <article className="stats-card stats-card--cta">
              <h3 className="card-title">Tiempo leído</h3>
              <div className="stat-time">
                ⏱{" "}
                {stats.tiempoLectura < 1
                  ? `${stats.minutosLectura} min`
                  : `${Math.floor(stats.tiempoLectura)} h`}
              </div>
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
