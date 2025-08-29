import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LayoutUsuario from "../../Componentes/LayoutUsuario";
import { getLibroById } from "../../servicios/libros";
import "./BookDetail.css";
import { getLinkPago } from "../../servicios/pago";

function calcularPorcentajeLeido(actual, total) {
  if (!total || isNaN(actual) || isNaN(total)) return 0;
  return Math.round((actual / total) * 100);
}

const BookDetail = () => {
  const [active, setActive] = useState("catalogo");
  const [loading, setLoading] = useState(false);
  const [libro, setLibro] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const [linkPago, setLinkPago] = useState(null);
  const [loadingPago, setLoadingPago] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await getLibroById(id);
        setLibro(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePagar = async () => {
    setLoadingPago(true);
    try {
      const resp = await getLinkPago(libro.id);

      if (!resp.link_pago) {
        alert("No se pudo generar el enlace de pago: respuesta vacía");
        setLoadingPago(false);
        return;
      }
      window.open(resp.link_pago, "_blank");
      setLinkPago(resp.link_pago);
    } catch (e) {
      alert("No se pudo generar el enlace de pago");
    }
    setLoadingPago(false);
  };

  const porcentajeLeido = libro
    ? calcularPorcentajeLeido(
        libro.progreso_pagina_actual,
        libro.progreso_pagina_total
      )
    : 0;

  return (
    <LayoutUsuario
      activeKey={active}
      onChange={setActive}
      onLogout={() => alert("Cerrar sesión…")}
    >
      <button className="btn-volver" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      {loading || !libro ? (
        <p>Cargando…</p>
      ) : (
        <section className="detalle">
          <div className="detalle__portada">
            {libro.portada ? (
              <img src={libro.portada} alt={`Portada de ${libro.titulo}`} />
            ) : (
              <div className="detalle__placeholder" />
            )}
          </div>

          <div className="detalle__info">
            <h2 className="detalle__titulo">{libro.titulo}</h2>
            <p className="detalle__sub">{libro.autor}</p>

            <ul className="detalle__datos">
              <li>
                <b>Editorial:</b> {libro.editorial}
              </li>
              <li>
                <b>Edición:</b> {libro.edicion}
              </li>
              <li>
                <b>Año:</b> {libro.publicacion}
              </li>

              <li>
                <b>Categoria:</b> {libro.categoria}
              </li>

              <li>
                <b>Sección:</b> Psicología
              </li>
              <li>
                <b>Descripción:</b> {libro.descripcion}
              </li>

              <li>
                <b>Idioma:</b> Español
              </li>
            </ul>

            {libro.comprado && (
              <div className="detalle__progreso">
                <div className="barra">
                  <div
                    className="barra__llena"
                    style={{ width: `${porcentajeLeido}%` }}
                  />
                </div>
                <span>
                  {libro.progreso_pagina_actual}/{libro.progreso_pagina_total}
                </span>
                <span>· Progreso: {porcentajeLeido}%</span>
                <button className="btn-descargar" title="Descargar (mock)">
                  ⬇
                </button>
              </div>
            )}

            <p className="detalle__sinopsis">{libro.sinopsis}</p>

            <div className="detalle__acciones">
              {libro.comprado && (
                <button
                  className="btn-accion"
                  onClick={() => navigate(`/lector/${libro.id}`)}
                >
                  Leer / Seguir leyendo…
                </button>
              )}

              <button
                className="btn-comprar"
                onClick={handlePagar}
                disabled={loadingPago}
                title="Comprar este libro"
              >
                {loadingPago
                  ? "Generando pago..."
                  : `Comprar $${libro.precio.toLocaleString("es-CO")}`}
              </button>
            </div>
          </div>
        </section>
      )}
    </LayoutUsuario>
  );
};

export default BookDetail;
