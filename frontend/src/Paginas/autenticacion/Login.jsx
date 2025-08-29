import React, { useState, useEffect } from "react";
import api from "../../servicios/api";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState(null); // { tipo: "error" | "alerta", texto: string }
  const navigate = useNavigate();

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje(null);
      }, 10000); // 10 segundos
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    try {
      const formData = new URLSearchParams();
      formData.append("username", usuario.trim());
      formData.append("password", contrasena.trim());

      const respuesta = await api.post(
        "/autenticacion/ingresar",
        formData.toString(),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const token = respuesta.data.access_token;
      localStorage.setItem("access_token", token);

      const decoded = jwtDecode(token);

      if (decoded.role === "USUARIO") {
        navigate("/perfil");
      } else if (decoded.role === "ADMINISTRADOR") {
        setMensaje({
          tipo: "alerta",
          texto: "Bienvenido administrador, aún no tenemos su página.",
        });
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 403) {
          setMensaje({
            tipo: "alerta",
            texto: "Tu cuenta no ha sido verificada. Revisa tu correo.",
          });
        } else if (error.response.status === 400) {
          setMensaje({
            tipo: "error",
            texto: "Usuario o contraseña incorrectos.",
          });
        } else {
          setMensaje({
            tipo: "error",
            texto: "Ocurrió un error al iniciar sesión.",
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
        <h2 className="registro-titulo">LOGIN</h2>

        <form className="registro-formulario" onSubmit={handleSubmit}>
          <div className="campo">
            <input
              type="text"
              placeholder="Usuario o correo electrónico"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
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

          <div className="recordarme">
            <label>
              Recordarme
              <input type="checkbox" style={{ marginLeft: "5px" }} />
            </label>
          </div>

          <button type="submit" className="boton-ingresar">
            Ingresar
          </button>

          <div style={{ marginTop: "10px" }}>
            <a href="recuperar" className="enlace-olvido">
              Olvidé mi contraseña
            </a>
          </div>
          <div style={{ marginTop: "10px" }}>
            <a href="registro" className="enlace-registro">
              ¿No tienes cuenta?
            </a>
          </div>
        </form>

        {/* Mensaje de error o alerta debajo */}
        {mensaje && (
          <div
            className={`mensaje-login ${
              mensaje.tipo === "error" ? "mensaje-error" : "mensaje-alerta"
            }`}
          >
            {mensaje.texto}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
