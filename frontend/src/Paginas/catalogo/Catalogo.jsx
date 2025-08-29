import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LayoutUsuario from "../../Componentes/LayoutUsuario";
import LibroCard from "../../Componentes/LibroCard/LibroCard";
import { getLibros } from "../../servicios/libros";
import "./Catalogo.css";

/**
 * Vista Catálogo:
 * - Reutiliza LayoutUsuario/Sidebar.
 * - Barra de búsqueda simple (filtra en mock o con ?q= en backend).
 * - Grid responsivo de tarjetas.
 */
const Catalogo = () => {
  const [active, setActive] = useState("catalogo");
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [libros, setLibros] = useState([]);

  const navigate = useNavigate();

  async function cargar() {
    setLoading(true);
    try {
      const { data } = await getLibros({ q });
      setLibros(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBuscar = (e) => {
    e.preventDefault();
    cargar();
  };

  return (
    <LayoutUsuario activeKey={active} onChange={setActive} onLogout={() => alert("Cerrar sesión…")}>
      <div className="catalogo-header">
        <h1>Catálogo</h1>
        <form className="catalogo-busqueda" onSubmit={onBuscar}>
          <input
            type="search"
            placeholder="Buscar por título o autor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
      </div>

      <hr className="separador" />

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <section className="catalogo-grid">
          {libros.map((l) => (
            <LibroCard
              key={l.id}
              titulo={l.titulo}
              autor={l.autor}
              precio={l.precio}
              portada={l.portada}
              onClick={() => navigate(`/catalogo/${l.id}`)}
            />
          ))}
        </section>
      )}
    </LayoutUsuario>
  );
};

export default Catalogo;
