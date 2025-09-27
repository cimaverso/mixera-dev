import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SidebarUsuario, {
  CatalogoIcon,
  BibliotecaIcon,
  TutorialesIcon,
  EstadisticasIcon,
  SoporteIcon,
} from "./sidebar/SidebarUsuario.jsx";
import "./sidebar/sidebar.css";
import api from "../servicios/api";

// Iconos para el header móvil del lector
const MenuHamburguesaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
  </svg>
);

const PerfilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 16 16">
    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
    <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1" />
  </svg>
);

// Icono para cerrar sesión en bottom nav
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

const LayoutUsuario = ({ children, activeKey, onChange, onLogout }) => {
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [usuarioInfo, setUsuarioInfo] = useState({ nombre: "", email: "" });
  
  // Estados para el scroll horizontal del bottom nav
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);
  const bottomNavRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Detectar si estamos en el lector
  const esLector = location.pathname.includes('/lector/');

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
    const cargarDatosUsuario = async () => {
      try {
        const { data } = await api.get("/usuarios/perfil");
        const url = data.usu_imagen
          ? `${api.defaults.baseURL}${data.usu_imagen}`
          : "";
        setFotoPerfil(url);
        setUsuarioInfo({
          nombre: data.usu_nombre || "Usuario",
          email: data.usu_email || ""
        });
      } catch (e) {
        setFotoPerfil("");
        setUsuarioInfo({ nombre: "Usuario", email: "" });
      }
    };
    cargarDatosUsuario();

    const onFotoActualizada = (e) => setFotoPerfil(e.detail?.urlAbs || "");
    window.addEventListener("perfil:foto-actualizada", onFotoActualizada);
    return () =>
      window.removeEventListener("perfil:foto-actualizada", onFotoActualizada);
  }, []);

  // Cerrar menú móvil al hacer clic fuera (solo si NO es lector)
  useEffect(() => {
    if (esLector) return; // No aplicar en lector

    const handleClickOutside = (event) => {
      if (menuMovilAbierto && !event.target.closest('.sidebar-movil') && !event.target.closest('.btn-menu-hamburguesa')) {
        setMenuMovilAbierto(false);
      }
    };

    if (menuMovilAbierto) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuMovilAbierto, esLector]);

  // Detectar scroll en bottom nav móvil
  useEffect(() => {
    const checkScrollIndicators = () => {
      if (bottomNavRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = bottomNavRef.current;
        setShowLeftIndicator(scrollLeft > 0);
        setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 5);
      }
    };

    const bottomNav = bottomNavRef.current;
    if (bottomNav) {
      bottomNav.addEventListener('scroll', checkScrollIndicators);
      // Verificar inicialmente
      setTimeout(checkScrollIndicators, 100);
      
      return () => {
        bottomNav.removeEventListener('scroll', checkScrollIndicators);
      };
    }
  }, []);

  const items = [
    { key: "catalogo", label: "Catálogo", icon: <CatalogoIcon /> },
    { key: "biblioteca", label: "Mi Biblioteca", icon: <BibliotecaIcon /> },
    { key: "tutoriales", label: "Tutoriales", icon: <TutorialesIcon /> },
    { key: "estadisticas", label: "Estadísticas", icon: <EstadisticasIcon /> },
    { key: "soporte", label: "Soporte", icon: <SoporteIcon /> },
  ];

  // Items para el bottom nav móvil (incluye perfil y logout)
  const bottomNavItems = [
    {
      key: "perfil",
      label: "Perfil",
      icon: <PerfilIcon />,
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
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  };

  // Función para navegación
  const handleNav = (key) => {
    if (key === "logout") {
      handleLogout();
      return;
    }
    
    onChange?.(key);
    const path = rutas[key];
    if (path) {
      navigate(path);
    }
    // Cerrar menú móvil después de navegar
    setMenuMovilAbierto(false);
  };

  const toggleMenuMovil = () => {
    setMenuMovilAbierto(!menuMovilAbierto);
  };

  // Función para manejar el touch scroll en bottom nav
  const handleBottomNavTouch = (e) => {
    // Permitir scroll horizontal natural del contenedor
    e.stopPropagation();
  };

  return (
    <div className={`layout-usuario ${esLector ? 'en-lector-pdf' : ''}`}>
      {/* HEADER MÓVIL - SOLO PARA LECTOR */}
      {esLector && (
        <header className="header-movil">
          <button 
            className="btn-menu-hamburguesa"
            onClick={() => navigate('/biblioteca')}
            aria-label="Volver a biblioteca"
            title="Volver a biblioteca"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
            </svg>
          </button>
          
          <h1 className="titulo-app-movil">
            Lector PDF
          </h1>
          
          <div 
            className="perfil-movil"
            onClick={() => handleNav("perfil")}
          >
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Perfil" />
            ) : (
              <PerfilIcon />
            )}
          </div>
        </header>
      )}

      {/* SIDEBAR MÓVIL OVERLAY - SOLO PARA SECCIONES NORMALES */}
      {!esLector && (
        <div className={`sidebar-movil-overlay ${menuMovilAbierto ? 'abierto' : ''}`}>
          <aside className={`sidebar-movil ${menuMovilAbierto ? 'abierto' : ''}`}>
            {/* Perfil en el drawer */}
            <div className="perfil-movil-drawer">
              <div className="imagen-perfil">
                {fotoPerfil ? (
                  <img src={fotoPerfil} alt="Foto de perfil" />
                ) : (
                  <PerfilIcon />
                )}
              </div>
              <div className="info-usuario">
                <h4>{usuarioInfo.nombre}</h4>
                <p>{usuarioInfo.email}</p>
              </div>
            </div>

            {/* Menú de navegación */}
            <nav className="sidebar-menu">
              {items.map((item) => (
                <button
                  key={item.key}
                  className={activeKey === item.key ? "activo" : ""}
                  onClick={() => handleNav(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}

              <button onClick={handleLogout}>
                <LogoutIcon />
                <span>Cerrar sesión</span>
              </button>
            </nav>

            {/* Logo en el drawer */}
            <div className="logo-footer">
              <img src="/assets/LogoLogin.webp" alt="Logo" className="logo-imagen" />
            </div>
          </aside>
        </div>
      )}

      {/* SIDEBAR DESKTOP - OCULTO EN LECTOR MÓVIL */}
      <SidebarUsuario
        items={items}
        activeKey={activeKey}
        onChange={onChange}
        onLogout={handleLogout}
        logoSrc={"/assets/LogoLogin.webp"}
        fotoPerfil={fotoPerfil}
      />

      <main className="contenido-usuario">{children}</main>

      {/* BOTTOM NAV MÓVIL CON SCROLL HORIZONTAL - SOLO PARA SECCIONES NORMALES */}
      {!esLector && (
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
              >
                {item.isPerfil ? (
                  <>
                    <div className="perfil-imagen">
                      {fotoPerfil ? (
                        <img src={fotoPerfil} alt="Perfil" />
                      ) : (
                        <PerfilIcon />
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
      )}
    </div>
  );
};

export default LayoutUsuario;