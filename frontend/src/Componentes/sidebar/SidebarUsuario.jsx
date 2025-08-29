import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./sidebar.css";

const SidebarUsuario = ({
  items = [],
  activeKey,
  onChange,
  onLogout,
  logoSrc,
  fotoPerfil,
}) => {
  const [colapsado, setColapsado] = useState(false);
  const navigate = useNavigate();

  // key -> ruta (asegúrate de tener estas rutas en App.jsx)
  const rutas = {
    perfil: "/perfil",
    catalogo: "/catalogo",
    biblioteca: "/biblioteca",
    tutoriales: "/tutoriales",
    estadisticas: "/estadisticas",
  };

  const handleNav = (key) => {
    onChange?.(key); // mantiene resaltado activo en el layout
    const path = rutas[key];
    if (path) navigate(path); // navega por URL real
  };

  return (
    <aside className={`sidebar-usuario ${colapsado ? "colapsado" : ""}`}>
      {/* Avatar / Ir a Perfil */}
      <div className="usuario">
        <div
          className="imagen-perfil"
          onClick={() => handleNav("perfil")}
          title="Mi Perfil"
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && handleNav("perfil")
          }
          aria-label="Ir a Mi Perfil"
        >
          {fotoPerfil ? (
            <img
              src={fotoPerfil}
              alt="Foto de perfil"
              className="avatar-imagen"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="white"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
              <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1" />
            </svg>
          )}
        </div>
      </div>

      {/* Menú */}
      <nav className="sidebar-menu">
        {items.map((it) => (
          <button
            key={it.key}
            className={activeKey === it.key ? "activo" : ""}
            onClick={() => handleNav(it.key)}
            title={it.label}
          >
            {it.icon}
            {!colapsado && <span>{it.label}</span>}
          </button>
        ))}

        <button onClick={() => onLogout?.()}>
          <CerrarIcon />
          {!colapsado && <span>Cerrar sesión</span>}
        </button>
      </nav>

      {/* Botón colapsar */}
      <button className="toggle-btn" onClick={() => setColapsado(!colapsado)}>
        {colapsado ? "➡" : "⬅"}
      </button>

      {/* Logo */}
      <div className="logo-footer">
        {logoSrc ? (
          <img src={logoSrc} alt="Logo" className="logo-imagen" />
        ) : (
          <div className="logo-placeholder">Logo</div>
        )}
      </div>
    </aside>
  );
};

export default SidebarUsuario;

/* === Íconos mínimos === */
export const CatalogoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M2.5 0a.5.5 0 0 1 .5.5V2h10V.5a.5.5 0 0 1 1 0v15a.5.5 0 0 1-1 0V15H3v.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 .5-.5M3 14h10v-3H3zm0-4h10V7H3zm0-4h10V3H3z" />
  </svg>
);

export const BibliotecaIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M5 0h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2 2H3a2 2 0 0 1-2-2h1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1H1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1H3a2 2 0 0 1 2-2" />
  </svg>
);

export const TutorialesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6zm6.258-6.437a.5.5 0 0 1 .507.013l4 2.5a.5.5 0 0 1 0 .848l-4 2.5A.5.5 0 0 1 6 12V7a.5.5 0 0 1 .258-.437" />
  </svg>
);

export const EstadisticasIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M2.5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm5 2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1m-5 1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zm9-1h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1" />
  </svg>
);

const CerrarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
    <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
  </svg>
);
