import api from "./api";

// Inicia una sesión de lectura para el libro dado
export const iniciarSesionLectura = async (libroId) => {
  const res = await api.post("/lecturas/iniciar", { ls_idlibro: libroId });
  return res.data; // Devuelve { ls_id, ... }
};

// Finaliza la sesión de lectura indicada
export const finalizarSesionLectura = async (sesionId) => {
  const res = await api.post(`/lecturas/finalizar/${sesionId}`);
  return res.data;
};
