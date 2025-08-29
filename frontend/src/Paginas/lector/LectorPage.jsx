// src/Paginas/lector/LectorPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import LayoutUsuario from "../../Componentes/LayoutUsuario.jsx";
import Lector from "../../Componentes/Lector/Lector.jsx";

const LectorPage = () => {
  const { libroId } = useParams();

  return (
    <LayoutUsuario activeKey="biblioteca">
      <Lector libroId={libroId} />
    </LayoutUsuario>
  );
};

export default LectorPage;
