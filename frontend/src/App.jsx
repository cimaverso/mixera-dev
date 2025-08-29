import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./Paginas/autenticacion/Login";
import Registro from "./Paginas/autenticacion/Registro";
import MiPerfil from "./Paginas/usuario/MiPerfil";
import OlvideContrasena from "./Paginas/autenticacion/OlvideContrasena";
import NuevaContrasena from "./Paginas/autenticacion/NuevaContrasena";
import Verificacion from "./Paginas/autenticacion/Verificacion";

import Catalogo from "./Paginas/catalogo/Catalogo";
import BookDetail from "./Paginas/catalogo/BookDetail.jsx";
import Biblioteca from "./Paginas/biblioteca/Biblioteca";
import Tutoriales from "./Paginas/tutoriales/Tutoriales";
import Estadisticas from "./Paginas/usuario/EstadisticasUsuario";

import PrivateRoute from "./Componentes/PrivateRoute"; // importa el PrivateRoute

import Lector from "./Componentes/Lector/Lector";
import LectorPage from "./Paginas/lector/LectorPage.jsx";



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar" element={<OlvideContrasena />} />
        <Route path="/restablecer" element={<NuevaContrasena />} />
        <Route path="/verificacion" element={<Verificacion />} />
        <Route path="/lector" element={<Lector />} />

        {/* Lector */}
        <Route path="/biblioteca/:libroId" element={<LectorPage />} />
        <Route path="/lector/:libroId" element={<LectorPage />} />

        {/* Rutas protegidas envueltas con PrivateRoute */}
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <MiPerfil />
            </PrivateRoute>
          }
        />
        <Route
          path="/catalogo"
          element={
            <PrivateRoute>
              <Catalogo />
            </PrivateRoute>
          }
        />
        <Route
          path="/catalogo/:id"
          element={
            <PrivateRoute>
              <BookDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/biblioteca"
          element={
            <PrivateRoute>
              <Biblioteca />
            </PrivateRoute>
          }
        />
        <Route
          path="/tutoriales"
          element={
            <PrivateRoute>
              <Tutoriales />
            </PrivateRoute>
          }
        />
        <Route
          path="/estadisticas"
          element={
            <PrivateRoute>
              <Estadisticas />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
