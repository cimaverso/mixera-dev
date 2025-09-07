import React, { useEffect, useState } from "react";
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
    width="24"
    height="24"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
    <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
  </svg>
);

const LayoutAdministrador = ({ children, activeKey, onChange, onLogout }) => {
  const [fotoPerfil, setFotoPerfil] = useState("");

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

  const handleLogout = () => {
    // TODO: Llamar endpoint FastAPI /auth/logout si es necesario
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role"); // Limpiar rol almacenado
    window.location.href = "/login";
  };

  return (
    <div className="layout-usuario">
      <SidebarAdministrador
        items={items}
        activeKey={activeKey}
        onChange={onChange}
        onLogout={handleLogout}
        logoSrc={Logo}
        fotoPerfil={fotoPerfil}
      />

      <main className="contenido-usuario">{children}</main>

      {/* ===== BOTTOM NAV RESPONSIVE (SOLO MOBILE) ===== */}
      <nav className="bottom-nav-usuario">
        <button
          className={activeKey === "dashboard" ? "activo" : ""}
          onClick={() => onChange?.("dashboard")}
          title="Dashboard"
          aria-label="Ir a Dashboard"
        >
          <DashboardIcon />
          <span>Dashboard</span>
        </button>
        
        <button
          className={activeKey === "usuarios" ? "activo" : ""}
          onClick={() => onChange?.("usuarios")}
          title="Usuarios"
          aria-label="Ir a Usuarios"
        >
          <UsuariosIcon />
          <span>Usuarios</span>
        </button>
        
        <button
          className={activeKey === "libros" ? "activo" : ""}
          onClick={() => onChange?.("libros")}
          title="Libros"
          aria-label="Ir a Libros"
        >
          <LibrosIcon />
          <span>Libros</span>
        </button>
        
        <button
          className={activeKey === "ecommerce" ? "activo" : ""}
          onClick={() => onChange?.("ecommerce")}
          title="eCommerce"
          aria-label="Ir a eCommerce"
        >
          <EcommerceIcon />
          <span>eCommerce</span>
        </button>
        
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogoutIcon />
          <span>Salir</span>
        </button>
      </nav>
    </div>
  );
};

export default LayoutAdministrador;