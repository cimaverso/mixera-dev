// src/Paginas/lector/LectorPage.jsx - ACTUALIZADO
import React from "react";
import { useParams } from "react-router-dom";
import LectorPDF from "../../Componentes/Lector/LectorPDF.jsx";

/**
 * Página wrapper para el lector de PDF
 * Extrae el parámetro libroId de la URL y se lo pasa al LectorPDF
 * No necesita LayoutUsuario porque LectorPDF ya lo incluye
 */
const LectorPage = () => {
  const { libroId } = useParams();

  console.log('📖 LectorPage - libroId recibido:', libroId);

  // Validar que libroId existe
  if (!libroId) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h3>Error de navegación</h3>
        <p>No se especificó el ID del libro</p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#de007e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  // LectorPDF ya incluye LayoutUsuario, así que no lo duplicamos aquí
  return <LectorPDF libroId={libroId} />;
};

export default LectorPage;