import "./Verificacion.css";

export default function Verificacion() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");

  let titulo = "";
  let mensaje = "";
  let esExito = false; // Lo inicializas aquí

  if (status === "ok") {
    esExito = true;
    titulo = "¡Cuenta activada!";
    mensaje = "Tu cuenta fue activada correctamente. Ahora puedes iniciar sesión.";
  } else {
    esExito = false;
    titulo = "Error en verificación";
    mensaje = "No pudimos activar tu cuenta. El enlace es inválido o ha expirado.";
  }

  return (
    <div className="verificacion-fondo">
      <div className="verificacion-contenedor">
        <img src="/assets/LogoLogin.webp" alt="Logo" className="verificacion-logo" />
        <h2 className="verificacion-titulo">{titulo}</h2>
        <p className="verificacion-mensaje">{mensaje}</p>
        <a href="/login" className="verificacion-boton">
          Volver a iniciar sesión
        </a>
      </div>
    </div>
  );
}
