// src/Paginas/lector/LectorPage.jsx - CORREGIDO
import React from "react";
import { useParams } from "react-router-dom";
import LayoutUsuario from "../../Componentes/LayoutUsuario.jsx";
import Lector from "../../Componentes/Lector/Lector.jsx";

const LectorPage = () => {
  const { libroId } = useParams();

  console.log('📖 LectorPage - libroId recibido:', libroId);

  // Validar que libroId existe
  if (!libroId) {
    return (
      <LayoutUsuario activeKey="biblioteca">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Error: No se especificó el ID del libro
        </div>
      </LayoutUsuario>
    );
  }

  return (
    <LayoutUsuario activeKey="biblioteca">
      <Lector />
    </LayoutUsuario>
  );
};

export default LectorPage;