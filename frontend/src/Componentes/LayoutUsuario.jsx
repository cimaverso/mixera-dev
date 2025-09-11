import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarUsuario, {
  CatalogoIcon,
  BibliotecaIcon,
  TutorialesIcon,
  EstadisticasIcon,
  SoporteIcon,
} from "./sidebar/SidebarUsuario.jsx";
import "./sidebar/sidebar.css";
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

const LayoutUsuario = ({ children, activeKey, onChange, onLogout }) => {
  const [fotoPerfil, setFotoPerfil] = useState("");
  const navigate = useNavigate();

  // Mapeo de rutas
  const rutas = {
    perfil: "/perfil",
    catalogo: "/catalogo",
    biblioteca: "/biblioteca",
    tutoriales: "/tutoriales",
    estadisticas: "/estadisticas",
    soporte: "/soporte",
  };

  useEffect(() => {
    const cargarFoto = async () => {
      try {
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
    { key: "catalogo", label: "Catálogo", icon: <CatalogoIcon /> },
    { key: "biblioteca", label: "Mi Biblioteca", icon: <BibliotecaIcon /> },
    { key: "tutoriales", label: "Tutoriales", icon: <TutorialesIcon /> },
    { key: "estadisticas", label: "Estadísticas", icon: <EstadisticasIcon /> },
    { key: "soporte", label: "Soporte", icon: <SoporteIcon /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  };

  // Función mejorada para navegación
  const handleNav = (key) => {
    onChange?.(key); // mantiene resaltado activo
    const path = rutas[key];
    if (path) {
      navigate(path); // navega a la ruta correspondiente
    }
  };

  return (
    <div className="layout-usuario">
      <SidebarUsuario
        items={items}
        activeKey={activeKey}
        onChange={onChange}
        onLogout={handleLogout}
        logoSrc={"/assets/LogoLogin.webp"}
        fotoPerfil={fotoPerfil}
      />

      <main className="contenido-usuario">{children}</main>

      {/* === BOTTOM NAV SOLO PARA MOBILE === */}
      <nav className="bottom-nav-usuario">
        <button
          className={activeKey === "catalogo" ? "activo" : ""}
          onClick={() => handleNav("catalogo")}
          title="Catálogo"
        >
          <CatalogoIcon />
          <span>Catálogo</span>
        </button>
        <button
          className={activeKey === "biblioteca" ? "activo" : ""}
          onClick={() => handleNav("biblioteca")}
          title="Mi Biblioteca"
        >
          <BibliotecaIcon />
          <span>Biblioteca</span>
        </button>
        <button
          className={activeKey === "tutoriales" ? "activo" : ""}
          onClick={() => handleNav("tutoriales")}
          title="Tutoriales"
        >
          <TutorialesIcon />
          <span>Tutoriales</span>
        </button>
        <button
          className={activeKey === "estadisticas" ? "activo" : ""}
          onClick={() => handleNav("estadisticas")}
          title="Estadísticas"
        >
          <EstadisticasIcon />
          <span>Estadísticas</span>
        </button>
        <button
          className={activeKey === "soporte" ? "activo" : ""}
          onClick={() => handleNav("soporte")}
          title="Soporte"
        >
          <SoporteIcon />
          <span>Soporte</span>
        </button>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogoutIcon />
          <span>Salir</span>
        </button>
      </nav>
    </div>
  );
};

export default LayoutUsuario;