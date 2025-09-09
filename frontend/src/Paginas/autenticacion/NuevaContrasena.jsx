import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../servicios/api";
import "./Registro.css"; // Usamos mismos estilos

const NuevaContrasena = () => {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Expresión para validar seguridad de la contraseña
  const validarContrasena = (valor) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(valor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (nueva !== confirmar) {
      return setError("Las contraseñas no coinciden.");
    }

    if (!validarContrasena(nueva)) {
      return setError(
        "Usa mayúsculas, minúsculas, números y símbolos. Mínimo 8 caracteres."
      );
    }

    try {
      await api.post("/usuarios/restablecer", {
        token,
        nueva_clave: nueva,
      });

      setMensaje("Contraseña cambiada correctamente.");
      setNueva("");
      setConfirmar("");
    } catch (err) {
      setError("Enlace expirado o inválido. Solicita uno nuevo.");
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
        <h2 className="registro-titulo">NUEVA CONTRASEÑA</h2>

        <form className="registro-formulario" onSubmit={handleSubmit}>
          <div className="campo">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />
          </div>

          <p style={{ fontSize: "12px", color: "#fff", marginBottom: "10px" }}>
            Mínimo 8 caracteres. Debe contener mayúsculas, minúsculas, números y
            símbolos.
          </p>

          <button type="submit" className="boton-ingresar">
            Cambiar contraseña
          </button>

          {mensaje && <p className="mensaje">{mensaje}</p>}
          {error && <p className="error">{error}</p>}

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

export default NuevaContrasena;
