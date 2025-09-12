import React, { useState, useEffect } from "react";
import LayoutUsuario from "../../Componentes/LayoutUsuario";
import api from "../../servicios/api";
import { jwtDecode } from "jwt-decode";

import "./Soporte.css";

const Soporte = () => {
  const [formData, setFormData] = useState({
    tipo: "",
    mensaje: "",
    imagen: null
  });
  const [usuario, setUsuario] = useState({ nombre: "", correo: "" });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    cargarDatosDesdeToken();
  }, []);

  const cargarDatosDesdeToken = () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const decoded = jwtDecode(token);
      setUsuario({
        nombre: decoded.name,   
        correo: decoded.email   
      });
    } catch (error) {
      console.error("Error decodificando token:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMensaje({ tipo: "error", texto: "La imagen debe ser menor a 5MB" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        setMensaje({ tipo: "error", texto: "Solo se permiten archivos de imagen" });
        return;
      }
      setFormData(prev => ({ ...prev, imagen: file }));
    }
  };

  const enviarTicket = async (e) => {
    e.preventDefault();
    if (!formData.tipo || !formData.mensaje.trim()) {
      setMensaje({ tipo: "error", texto: "Por favor completa todos los campos obligatorios" });
      return;
    }

    setEnviando(true);
    setMensaje({ tipo: "", texto: "" });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("tipo", formData.tipo);
      formDataToSend.append("mensaje", formData.mensaje);
      if (formData.imagen) {
        formDataToSend.append("imagen", formData.imagen);
      }

      await api.post("/soporte/ticket", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMensaje({ tipo: "exito", texto: "Ticket enviado correctamente. Te contactaremos pronto." });

      setFormData({ tipo: "", mensaje: "", imagen: null });
      const fileInput = document.getElementById("imagen-input");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error al enviar ticket:", error);
      setMensaje({ tipo: "error", texto: "Error al enviar el ticket. Intenta nuevamente." });
    } finally {
      setEnviando(false);
    }
  };

  const tiposTicket = [
    { value: "error", label: "Error" },
    { value: "incidencia", label: "Incidencia" },
    { value: "feedback", label: "Feedback" },
    { value: "solicitud", label: "Solicitud" }
  ];

  return (
    <LayoutUsuario activeKey="soporte">
      <div className="soporte-container">
        <div className="soporte-header">
          <div className="header-icon"><SoporteIcon /></div>
          <div className="header-content">
            <h1>Centro de Soporte</h1>
            <p>¿Necesitas ayuda? Envíanos un ticket y te contactaremos pronto</p>
          </div>
        </div>

        <div className="ticket-form-container">
          <form onSubmit={enviarTicket} className="ticket-form">
            {/* Información del usuario */}
            <div className="user-info">
              <div className="info-row">
                <div className="info-item">
                  <label>Usuario:</label>
                  <span>{usuario.nombre}</span>
                </div>
                <div className="info-item">
                  <label>Correo:</label>
                  <span>{usuario.correo}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <label>Fecha:</label>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Tipo */}
            <div className="form-group">
              <label htmlFor="tipo">Tipo de soporte <span className="required">*</span></label>
              <select id="tipo" name="tipo" value={formData.tipo} onChange={handleInputChange} required>
                <option value="">Selecciona un tipo...</option>
                {tiposTicket.map(tipo => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
              </select>
            </div>

            {/* Mensaje */}
            <div className="form-group">
              <label htmlFor="mensaje">Describe tu consulta <span className="required">*</span></label>
              <textarea
                id="mensaje"
                name="mensaje"
                value={formData.mensaje}
                onChange={handleInputChange}
                placeholder="Describe detalladamente tu consulta, error o solicitud..."
                rows="6"
                required
              />
              <div className="char-counter">{formData.mensaje.length}/1000 caracteres</div>
            </div>

            {/* Imagen */}
            <div className="form-group">
              <label htmlFor="imagen-input">Adjuntar imagen (opcional)</label>
              <div className="file-input-container">
                <input type="file" id="imagen-input" accept="image/*" onChange={handleImageChange} className="file-input" />
                <label htmlFor="imagen-input" className="file-input-label">
                  <ImageIcon /> {formData.imagen ? formData.imagen.name : "Seleccionar imagen"}
                </label>
              </div>
              <small className="file-help">Formatos permitidos: JPG, PNG, GIF. Máximo 5MB.</small>
            </div>

            {/* Mensaje de estado */}
            {mensaje.texto && <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

            {/* Botón */}
            <button type="submit" className="btn-enviar" disabled={enviando}>
              {enviando ? (<><LoadingIcon /> Enviando...</>) : (<><SendIcon /> Enviar Ticket</>)}
            </button>
          </form>
        </div>
      </div>
    </LayoutUsuario>
  );
};


// Iconos
const SoporteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4m9.886-3.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0"/>
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z"/>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z"/>
  </svg>
);

const LoadingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="loading-spin">
    <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
  </svg>
);

export default Soporte;