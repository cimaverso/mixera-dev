import api from "./api";

// Libros del usuario autenticado
export const getLibrosAdquiridos = async () => {
  const res = await api.get("/libros/usuario");
  return res.data;
};

// Tiempo total leído en un libro
export const getTiempoTotalLectura = async (libroId) => {
  const res = await api.get(`/lecturas/tiempo/${libroId}`);
  return res.data; // { minutos, horas }
};


// Intermitencia de lectura para un libro (en días)
export const getIntermitenciaLectura = async (libroId) => {
  const res = await api.get(`/lecturas/intermitencia/${libroId}`);
  return res.data; // { dias: 3.2 }
};
