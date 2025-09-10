// src/Paginas/autenticacion/OlvideContrasena.jsx

import React, { useState } from "react";
import api from "../../servicios/api";
import "./Registro.css"; // reutilizamos los estilos de Registro

const OlvideContrasena = () => {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      await api.post("/usuarios/recuperar", { usu_correo: correo });
      setMensaje("Revisa tu correo para continuar con el cambio.");
    } catch (err) {
      setError("No existe correo registrado");
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
        <h2 className="registro-titulo">RECUPERAR CONTRASEÑA</h2>

        <form className="registro-formulario" onSubmit={handleSubmit}>
          <div className="campo">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="boton-ingresar">
            Enviar enlace
          </button>

          {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={{ marginTop: "10px" }}>
            <a href="login" className="enlace-login">
              Iniciar sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OlvideContrasena;
