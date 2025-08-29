// Datos mock para estadísticas
export const librosAdquiridos = [
  { id: 1, titulo: "Kamaleón", portada: "/assets/librodemo.jpg" },
  { id: 2, titulo: "Libro 2", portada: "/assets/libro2.jpg" },
  { id: 3, titulo: "Libro 3", portada: "/assets/libro3.jpg" }
];

export const estadisticasPorLibro = {
  1: {
    paginasTotales: 300,
    paginasLeidas: 210,
    notasTomadas: 45, // %
    tiempoLectura: 5.5 // horas
  },
  2: {
    paginasTotales: 150,
    paginasLeidas: 50,
    notasTomadas: 20,
    tiempoLectura: 1.8
  },
  3: {
    paginasTotales: 500,
    paginasLeidas: 125,
    notasTomadas: 10,
    tiempoLectura: 3
  }
};
