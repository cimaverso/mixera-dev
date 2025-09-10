import React, { useState, useEffect } from "react";
import LayoutAdministrador from "../../../Componentes/LayoutAdministrador.jsx";
import "./PerfilAdministrador.css";
import api from "../../../servicios/api.js";

const PerfilAdministrador = () => {
  const [active, setActive] = useState("perfil");
  const [mensajePerfil, setMensajePerfil] = useState({ texto: "", tipo: "" });
  const [mensajeContrasena, setMensajeContrasena] = useState({
    texto: "",
    tipo: "",
  });

  const [usuario, setUsuario] = useState({
    nombre: "",
    apellido: "",
    usuario: "",
    ciudad: "",
    pais: "",
    imagen: "",
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
      console.error("Error obteniendo perfil de administrador", error);
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
        texto: data.mensaje || "Perfil de administrador actualizado correctamente",
        tipo: "exito",
      });
      setTimeout(() => setMensajePerfil({ texto: "", tipo: "" }), 10000);
    } catch (error) {
      setMensajePerfil({
        texto: error.response?.data?.error || "Error al actualizar el perfil",
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
      const nuevaUrlAbs = `${api.defaults.baseURL}${data.url}?v=${Date.now()}`;
      setMensajeImagen({ texto: "Imagen subida correctamente", tipo: "exito" });
      setUsuario((prev) => ({ ...prev, imagen: nuevaUrlAbs }));

      // Evento personalizado para actualizar imagen en sidebar
      window.dispatchEvent(
        new CustomEvent("perfil-admin:foto-actualizada", {
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
      setTimeout(() => setMensajeImagen({ texto: "", tipo: "" }), 3000);
    }
  };

  return (
    <LayoutAdministrador
      activeKey={active}
      onChange={setActive}
      onLogout={() => alert("Cerrar sesión…")}
      usuario={usuario}
    >
      <div className="perfil-admin-container">
        <h1>Perfil de Administrador</h1>
        <hr className="separador-admin" />

        {/* Fila principal: Datos personales + Cambiar contraseña */}
        <section className="fila-admin">
          <div className="col-admin">
            <h2 className="seccion-titulo-admin">Datos Personales</h2>

            <div className="grupo-inputs-admin">
              <label className="input-imagen-admin">
                📷 Subir imagen de perfil
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setArchivoImagen(file);
                      subirImagen(file);
                    }
                  }}
                />
              </label>

              {/* Mostrar imagen actual si existe */}
              {usuario.imagen && (
                <div className="contenedor-imagen-perfil-admin">
                  <img 
                    src={usuario.imagen} 
                    alt="Foto de perfil administrador" 
                    className="foto-perfil-admin"
                  />
                </div>
              )}

              {/* Mostrar mensaje de subida */}
              {mensajeImagen.texto && (
                <div className={`mensaje-admin ${mensajeImagen.tipo}`}>
                  {mensajeImagen.texto}
                </div>
              )}

              <input
                className="input-admin"
                placeholder="Nombre"
                value={usuario.nombre}
                onChange={(e) =>
                  setUsuario({ ...usuario, nombre: e.target.value })
                }
              />
              <input
                className="input-admin"
                placeholder="Apellido"
                value={usuario.apellido}
                onChange={(e) =>
                  setUsuario({ ...usuario, apellido: e.target.value })
                }
              />
              <input
                className="input-admin"
                placeholder="Usuario"
                value={usuario.usuario}
                onChange={(e) =>
                  setUsuario({ ...usuario, usuario: e.target.value })
                }
              />
    
              <input
                className="input-admin"
                placeholder="Ciudad"
                value={usuario.ciudad}
                onChange={(e) =>
                  setUsuario({ ...usuario, ciudad: e.target.value })
                }
              />
              <input
                className="input-admin"
                placeholder="País"
                value={usuario.pais}
                onChange={(e) => setUsuario({ ...usuario, pais: e.target.value })}
              />
            </div>

            <button
              className="btn-admin"
              style={{ marginTop: 20 }}
              onClick={guardarPerfil}
            >
              Guardar Cambios
            </button>
            {mensajePerfil.texto && (
              <div className={`mensaje-admin ${mensajePerfil.tipo}`}>
                {mensajePerfil.texto}
              </div>
            )}
          </div>

          <div className="col-admin">
            <h2 className="seccion-titulo-admin">Cambiar Contraseña</h2>
            <div className="grupo-inputs-admin">
              <input
                className="input-admin"
                type="password"
                placeholder="Contraseña actual"
                value={contrasena.actual}
                onChange={(e) =>
                  setContrasena({ ...contrasena, actual: e.target.value })
                }
              />
              <input
                className="input-admin"
                type="password"
                placeholder="Nueva contraseña"
                value={contrasena.nueva}
                onChange={(e) =>
                  setContrasena({ ...contrasena, nueva: e.target.value })
                }
              />

              <button className="btn-admin" onClick={cambiarContrasena}>
                Cambiar Contraseña
              </button>
              {mensajeContrasena.texto && (
                <div className={`mensaje-admin ${mensajeContrasena.tipo}`}>
                  {mensajeContrasena.texto}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </LayoutAdministrador>
  );
};

export default PerfilAdministrador;