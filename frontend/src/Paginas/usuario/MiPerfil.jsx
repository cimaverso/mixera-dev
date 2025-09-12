import React, { useState, useEffect } from "react";
import LayoutUsuario from "../../Componentes/LayoutUsuario.jsx";
import ProfileWelcomeModal from "../../Componentes/ProfileWelcomeModal.jsx";
import { useProfileWelcome } from "../../Componentes/hooks/useProfileWelcome.js";
import "./MiPerfil.css";
import api from "../../servicios/api.js";
import { data } from "react-router-dom";
import { getLibrosAdquiridos } from "../../servicios/libros";

const MiPerfil = () => {
  const [active, setActive] = useState("perfil");
  const [mensajePerfil, setMensajePerfil] = useState({ texto: "", tipo: "" });
  const [mensajeContrasena, setMensajeContrasena] = useState({
    texto: "",
    tipo: "",
  });

  // Hook para la ventana de bienvenida
  const {
    showProfileWelcome,
    isInitialized,
    closeProfileWelcome,
    markAsViewed,
    resetProfileWelcome
  } = useProfileWelcome();

  const [usuario, setUsuario] = useState({
    nombre: "",
    apellido: "",
    usuario: "",
    ciudad: "",
    pais: "",
  });

  const [contrasena, setContrasena] = useState({ actual: "", nueva: "" });

  const fetchPerfil = async () => {
    try {
      const { data } = await api.get("/usuarios/perfil");
      setUsuario({
        nombre: data.usu_nombre || "",
        apellido: data.usu_apellido || "",
        usuario: data.usu_usuario || "",
        ciudad: data.usu_ciudad || "",
        pais: data.usu_pais || "",
        imagen: data.usu_imagen
          ? `${api.defaults.baseURL}${data.usu_imagen}`
          : "",
      });
    } catch (error) {
      console.error("Error obteniendo perfil", error);
    }
  };

  useEffect(() => {
    fetchPerfil();
  }, []);

  const guardarPerfil = async () => {
    try {
      const { data } = await api.put("/usuarios/perfil", {
        usu_usuario: usuario.usuario,
        usu_nombre: usuario.nombre,
        usu_apellido: usuario.apellido,
        usu_ciudad: usuario.ciudad,
        usu_pais: usuario.pais,
      });
      setMensajePerfil({
        texto: data.mensaje || "Perfil actualizado correctamente",
        tipo: "exito",
      });
      setTimeout(() => setMensajePerfil({ texto: "", tipo: "" }), 10000);
    } catch (error) {
      setMensajePerfil({
        texto: data.error || "Error al actualizar el perfil",
        tipo: "error",
      });

      setTimeout(() => setMensajePerfil({ texto: "", tipo: "" }), 10000);
    }
  };

  const cambiarContrasena = async () => {
    try {
      const { data } = await api.put("/usuarios/clave", {
        actual: contrasena.actual,
        nueva: contrasena.nueva,
      });

      setMensajeContrasena({ texto: data.mensaje, tipo: "exito" });
      setContrasena({ actual: "", nueva: "" });

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensajeContrasena({ texto: "", tipo: "" }), 10000);
    } catch (error) {
      if (error.response) {
        setMensajeContrasena({
          texto: error.response.data.detail || "Error al cambiar la contraseña",
          tipo: "error",
        });
      } else if (error.request) {
        setMensajeContrasena({
          texto: "No hubo respuesta del servidor",
          tipo: "error",
        });
      } else {
        setMensajeContrasena({
          texto: "Error de conexión",
          tipo: "error",
        });
      }
      setContrasena({ actual: "", nueva: "" });

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensajeContrasena({ texto: "", tipo: "" }), 3000);
    }
  };

  const [archivoImagen, setArchivoImagen] = useState(null);
  const [mensajeImagen, setMensajeImagen] = useState({ texto: "", tipo: "" });

  const subirImagen = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/usuarios/imagen", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const nuevaUrlAbs = `${api.defaults.baseURL}${data.url}?v=${Date.now()}`; // cache-busting
      setMensajeImagen({ texto: "Imagen subida correctamente", tipo: "exito" });
      setUsuario((prev) => ({ ...prev, imagen: nuevaUrlAbs }));

      window.dispatchEvent(
        new CustomEvent("perfil:foto-actualizada", {
          detail: { urlAbs: nuevaUrlAbs },
        })
      );

      setTimeout(() => setMensajeImagen({ texto: "", tipo: "" }), 3000);
    } catch (error) {
      setMensajeImagen({
        texto:
          error.response?.data?.detail ||
          "Error al subir la imagen. Revisa tamaño o extensión.",
        tipo: "error",
      });
    }
  };

  const [librosAdquiridos, setLibrosAdquiridos] = useState([]);
  const [loadingLibros, setLoadingLibros] = useState(true);

  const fetchLibrosAdquiridos = async () => {
    setLoadingLibros(true);
    try {
      const data = await getLibrosAdquiridos();
      setLibrosAdquiridos(data);
    } catch (e) {
      setLibrosAdquiridos([]);
    } finally {
      setLoadingLibros(false);
    }
  };

  useEffect(() => {
    fetchPerfil();
    fetchLibrosAdquiridos();
  }, []);

  // Función para manejar el cierre de la ventana de bienvenida
  const handleCloseWelcome = () => {
    closeProfileWelcome();
  };

  return (
    <>
      {/* Ventana de bienvenida */}
      <ProfileWelcomeModal
        isOpen={showProfileWelcome && isInitialized}
        onClose={handleCloseWelcome}
      />

      <LayoutUsuario
        activeKey={active}
        onChange={setActive}
        onLogout={() => alert("Cerrar sesión…")}
        usuario={usuario}
      >
        <h1>Mi Perfil</h1>
        <hr className="separador" />

        {/* Fila 1: Datos personales + Cambiar contraseña */}
        <section className="fila fila-1">
          <div className="col">
            <h2 className="seccion-titulo">Datos Personales</h2>

            <div className="grupo-inputs">
              <label className="input-imagen">
                📷 Subir imagen de perfil
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setArchivoImagen(file); // guardamos el archivo seleccionado
                      subirImagen(file); // subimos la imagen
                    }
                  }}
                />
              </label>

              {/* Mostrar mensaje de subida */}
              {mensajeImagen.texto && (
                <div className={`mensaje ${mensajeImagen.tipo}`}>
                  {mensajeImagen.texto}
                </div>
              )}

              <input
                placeholder="Nombre"
                value={usuario.nombre}
                onChange={(e) =>
                  setUsuario({ ...usuario, nombre: e.target.value })
                }
              />
              <input
                placeholder="Apellido"
                value={usuario.apellido}
                onChange={(e) =>
                  setUsuario({ ...usuario, apellido: e.target.value })
                }
              />
              <input
                placeholder="Usuario"
                value={usuario.usuario}
                onChange={(e) =>
                  setUsuario({ ...usuario, usuario: e.target.value })
                }
              />
              <input
                placeholder="Ciudad"
                value={usuario.ciudad}
                onChange={(e) =>
                  setUsuario({ ...usuario, ciudad: e.target.value })
                }
              />
              <input
                placeholder="País"
                value={usuario.pais}
                onChange={(e) => setUsuario({ ...usuario, pais: e.target.value })}
              />
            </div>

            <button
              className="btn-perfil"
              style={{ marginTop: 20 }}
              onClick={guardarPerfil}
            >
              Guardar Cambios
            </button>
            {mensajePerfil.texto && (
              <div className={`mensaje ${mensajePerfil.tipo}`}>
                {mensajePerfil.texto}
              </div>
            )}
          </div>

          <div className="col">
            <h2 className="seccion-titulo">Cambiar Contraseña</h2>
            <div className="grupo-inputs">
              <input
                type="password"
                placeholder="Contraseña actual"
                value={contrasena.actual}
                onChange={(e) =>
                  setContrasena({ ...contrasena, actual: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={contrasena.nueva}
                onChange={(e) =>
                  setContrasena({ ...contrasena, nueva: e.target.value })
                }
              />

              <button className="btn-perfil" onClick={cambiarContrasena}>
                Enviar
              </button>
              {mensajeContrasena.texto && (
                <div className={`mensaje ${mensajeContrasena.tipo}`}>
                  {mensajeContrasena.texto}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Fila 2: Libros + Estadísticas */}
        <section className="fila fila-2">
          <div className="adquirido">
            <h2 className="seccion-titulo">Libros Adquiridos</h2>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Fecha</th>
                  <th>Progreso</th>
                </tr>
              </thead>
              <tbody>
                {loadingLibros ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center" }}>
                      Cargando...
                    </td>
                  </tr>
                ) : librosAdquiridos.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center" }}>
                      No has adquirido libros aún.
                    </td>
                  </tr>
                ) : (
                  librosAdquiridos.map((libro, idx) => (
                    <tr key={idx}>
                      <td>{libro.titulo}</td>
                      <td>{libro.fecha}</td>
                      <td>{libro.progreso}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="estadisticas">
            <h2 className="seccion-titulo">Estadísticas de Lectura</h2>
            <div className="card">⏱ Tiempo leído: 2.5h</div>
            <div className="card">📄 Notas completadas: 10 / 32</div>
            <div className="card">📘 Libros abiertos: 3</div>
          </div>
        </section>

        {/* Botón de prueba para resetear modal (solo para desarrollo) */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              onClick={resetProfileWelcome}
              style={{ 
                background: '#ffc107', 
                color: '#000', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              🔄 Resetear modal de bienvenida (dev)
            </button>
          </div>
        )} */}
      </LayoutUsuario>
    </>
  );
};

export default MiPerfil;