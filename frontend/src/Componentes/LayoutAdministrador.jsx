import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SidebarAdministrador, {
  DashboardIcon,
  UsuariosIcon,
  LibrosIcon,
  EcommerceIcon,
} from "./sidebar/SidebarAdministrador.jsx";
import "./sidebar/sidebar.css";
import Logo from "/assets/LogoLogin.webp";
import api from "../servicios/api";

// Ícono para cerrar sesión en bottom nav
const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
    width="20"
    height="20"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
    <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
  </svg>
);

// Ícono de perfil de admin para bottom nav
const PerfilAdminIcon = () => (
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
);

const LayoutAdministrador = ({ children, activeKey, onChange, onLogout }) => {
  const [fotoPerfil, setFotoPerfil] = useState("");
  const bottomNavRef = useRef(null);
  const navigate = useNavigate();

  // MAPEO DE RUTAS
  const rutas = {
    perfil: "/admin/perfil", // Perfil de admin
    dashboard: "/admin/dashboard",
    usuarios: "/admin/usuarios",
    libros: "/admin/libros", 
    ecommerce: "/admin/ecommerce",
  };

  // FUNCIÓN PARA MANEJAR NAVEGACIÓN
  const handleNav = (key) => {
    if (key === "logout") {
      handleLogout();
      return;
    }
    
    onChange?.(key); // mantiene resaltado activo en el layout
    const path = rutas[key];
    if (path) navigate(path); // navega por URL real
  };

  useEffect(() => {
    const cargarFoto = async () => {
      try {
        // TODO: Conectar con endpoint FastAPI /admin/perfil
        const { data } = await api.get("/usuarios/perfil");
        const url = data.usu_imagen
          ? `${api.defaults.baseURL}${data.usu_imagen}`
          : "";
        setFotoPerfil(url);
      } catch (e) {
        setFotoPerfil("");
      }
    };
    cargarFoto();

    const onFotoActualizada = (e) => setFotoPerfil(e.detail?.urlAbs || "");
    window.addEventListener("perfil:foto-actualizada", onFotoActualizada);
    return () =>
      window.removeEventListener("perfil:foto-actualizada", onFotoActualizada);
  }, []);

  const items = [
    { key: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { key: "usuarios", label: "Usuarios", icon: <UsuariosIcon /> },
    { key: "libros", label: "Libros", icon: <LibrosIcon /> },
    { key: "ecommerce", label: "eCommerce", icon: <EcommerceIcon /> },
  ];

  // Items para el bottom nav móvil (incluye perfil y logout)
  const bottomNavItems = [
    {
      key: "perfil",
      label: "Perfil",
      icon: <PerfilAdminIcon />,
      isPerfil: true
    },
    ...items,
    {
      key: "logout",
      label: "Salir",
      icon: <LogoutIcon />,
      isLogout: true
    }
  ];

  const handleLogout = () => {
    // TODO: Llamar endpoint FastAPI /auth/logout si es necesario
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role"); // Limpiar rol almacenado
    window.location.href = "/login";
  };

  // Función para manejar el touch scroll en bottom nav
  const handleBottomNavTouch = (e) => {
    // Permitir scroll horizontal natural del contenedor
    e.stopPropagation();
  };

  return (
    <div className="layout-usuario">
      <SidebarAdministrador
        items={items}
        activeKey={activeKey}
        onChange={handleNav}
        onLogout={handleLogout}
        logoSrc={Logo}
        fotoPerfil={fotoPerfil}
      />

      <main className="contenido-usuario">{children}</main>

      {/* ===== BOTTOM NAV RESPONSIVE CON CONTENEDOR SCROLLEABLE ===== */}
      <nav className="bottom-nav-usuario">
        <div 
          className="bottom-nav-container"
          ref={bottomNavRef}
          onTouchStart={handleBottomNavTouch}
          onTouchMove={handleBottomNavTouch}
        >
          {bottomNavItems.map((item) => (
            <button
              key={item.key}
              className={`${activeKey === item.key ? "activo" : ""} ${item.isPerfil ? "perfil" : ""}`}
              onClick={() => handleNav(item.key)}
              title={item.label}
              aria-label={`Ir a ${item.label}`}
            >
              {item.isPerfil ? (
                <>
                  <div className="perfil-imagen">
                    {fotoPerfil ? (
                      <img src={fotoPerfil} alt="Perfil Admin" />
                    ) : (
                      <PerfilAdminIcon />
                    )}
                  </div>
                  <span>{item.label}</span>
                </>
              ) : (
                <>
                  {item.icon}
                  <span>{item.label}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default LayoutAdministrador;