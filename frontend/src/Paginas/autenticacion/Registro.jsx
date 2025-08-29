import React, { useState, useEffect } from "react";
import api from "../../servicios/api";
import "./Registro.css";

const Registro = () => {
  const [usuario, setUsuario] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const [mensaje, setMensaje] = useState(null); // { tipo: "exito" | "error", texto: string }

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    try {
      await api.post("/usuarios/registrar", {
        usu_usuario: usuario,
        usu_correo: correo,
        usu_clave: contrasena,
      });

      setMensaje({
        tipo: "exito",
        texto: "Registro exitoso. Revisa tu correo para activarlo.",
      });

      setUsuario("");
      setCorreo("");
      setContrasena("");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 409) {
          setMensaje({
            tipo: "alerta",
            texto:
              error.response.data?.detail || "Este usuario o correo ya existe.",
          });
        } else {
          setMensaje({
            tipo: "error",
            texto:
              error.response.data?.detail ||
              "Error al registrarse. Intenta de nuevo.",
          });
        }
      } else {
        setMensaje({
          tipo: "error",
          texto: "No se pudo conectar con el servidor.",
        });
      }
    }
  };

  return (
    <div className="registro-fondo">
      <div className="registro-contenedor">
        <img
          src="/assets/LogoLogin.webp"
          alt="Mixera Fund"
          className="registro-logo"
        />
        <h2 className="registro-titulo">REGISTRO</h2>

        <form className="registro-formulario" onSubmit={handleSubmit}>
          <div className="campo">
            <input
              type="text"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <input
              type="email"
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <input
              type="password"
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="boton-ingresar">
            Registrarse
          </button>
        </form>

        {/* 🔹 Mensaje debajo del formulario */}
        {mensaje && (
          <div
            className={`mensaje-form ${
              mensaje.tipo === "exito" ? "mensaje-exito" : "mensaje-error"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <a href="login" className="enlace-login">
            Iniciar sesión
          </a>
        </div>
      </div>
    </div>
  );
};

export default Registro;
