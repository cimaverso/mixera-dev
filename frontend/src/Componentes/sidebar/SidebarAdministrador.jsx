import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./sidebar.css";

const SidebarAdministrador = ({
  items = [],
  activeKey,
  onChange,
  onLogout,
  logoSrc,
  fotoPerfil,
}) => {
  const [colapsado, setColapsado] = useState(false);
  const navigate = useNavigate();

  // key -> ruta (rutas del administrador)
  const rutas = {
    dashboard: "/admin/dashboard",
    usuarios: "/admin/usuarios",
    libros: "/admin/libros", 
    ecommerce: "/admin/ecommerce",
  };

  const handleNav = (key) => {
    onChange?.(key); // mantiene resaltado activo en el layout
    const path = rutas[key];
    if (path) navigate(path); // navega por URL real
  };

  const handleCollapse = () => {
    const newColapsado = !colapsado;
    setColapsado(newColapsado);
    
    // Sincronizar el estado colapsado con el contenido
    const contenido = document.querySelector('.contenido-usuario');
    if (contenido) {
      if (newColapsado) {
        contenido.classList.add('sidebar-colapsado');
      } else {
        contenido.classList.remove('sidebar-colapsado');
      }
    }
  };

  return (
    <aside className={`sidebar-usuario ${colapsado ? "colapsado" : ""}`}>
      {/* Avatar / Ir a Perfil Admin */}
      <div className="usuario">
        <div
          className="imagen-perfil"
          onClick={() => navigate("/admin/perfil")} // TODO: Crear página perfil admin
          title="Mi Perfil Admin"
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && navigate("/admin/perfil")
          }
          aria-label="Ir a Mi Perfil de Administrador"
        >
          {fotoPerfil ? (
            <img
              src={fotoPerfil}
              alt="Foto de perfil administrador"
              className="avatar-imagen"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="white"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              {/* Corona de admin */}
              <path d="M2 2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm1 0v1h10V2z" fill="#f39c12"/>
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
      <button className="toggle-btn" onClick={handleCollapse}>
        {colapsado ? "➡" : "⬅"}
      </button>

      {/* Logo */}
      <div className="logo-footer">
        {logoSrc ? (
          <img src={logoSrc} alt="Logo Admin" className="logo-imagen" />
        ) : (
          <div className="logo-placeholder">Logo Admin</div>
        )}
      </div>
    </aside>
  );
};

export default SidebarAdministrador;

/* === Iconos de Administrador === */
export const DashboardIcon = () => (
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

export const UsuariosIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    fill="white" 
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
  </svg>
);

export const LibrosIcon = () => (
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

export const EcommerceIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    fill="white" 
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5M3.14 5l.5 2H5V5zM6 5v2h2V5zm3 0v2h2V5zm3 0v2h1.36l.5-2zm1.11 3H12v2h.61zM11 8H9v2h2zM8 8H6v2h2zM5 8H3.89l.5 2H5zm0 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0"/>
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