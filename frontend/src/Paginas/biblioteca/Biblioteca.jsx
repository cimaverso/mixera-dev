import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LayoutUsuario from "../../Componentes/LayoutUsuario";
import { getMisLibros } from "../../servicios/libros";
import LibroBibliotecaCard from "../../Componentes/LibroCard/LibroBibliotecaCard";
import "./Biblioteca.css";

const Biblioteca = () => {
  const [active, setActive] = useState("biblioteca");
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [libros, setLibros] = useState([]);

  const navigate = useNavigate();

  async function cargar() {
    setLoading(true);
    try {
      const data = await getMisLibros({ q }); // <-- ahora retorna un array directo
      setLibros(Array.isArray(data) ? data : []);
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
      <div className="biblio-header">
        <h1>Mi Biblioteca</h1>
        <form className="biblio-busqueda" onSubmit={onBuscar}>
          <input
            type="search"
            placeholder="Buscar en mis libros…"
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
        <section className="biblio-grid">
          {Array.isArray(libros) && libros.length > 0 ? (
            libros.map((l) => (
              <LibroBibliotecaCard
                key={l.id}
                titulo={l.titulo}
                autor={l.autor}
                portada={l.portada}
                progresoLeido={l.progreso_pagina_actual}
                progresoTotal={l.progreso_pagina_total}
                onLeer={() => navigate(`/lector/${l.id}`)}
              />
            ))
          ) : (
            <p>No tienes libros aún. Ve al Catálogo para adquirir alguno.</p>
          )}
        </section>
      )}
    </LayoutUsuario>
  );
};

export default Biblioteca;
