// src/servicios/libros.js


import api from "./api";

const MOCK_LIBROS = [
  {
    id: 1,
    titulo: "KAMALEÓN",
    autor: "Autor Demo",
    precio: 10000,
    portada: "/assets/librodemo.jpg", // Vite sirve /assets directamente
    destacado: true,
  },
  { id: 2, titulo: "Libro 2", autor: "Autora X", precio: 15000, portada: "", destacado: false },
  { id: 3, titulo: "Libro 3", autor: "Autor Y", precio: 20000, portada: "", destacado: false },
  { id: 4, titulo: "Libro 4", autor: "Autora Z", precio: 25000, portada: "", destacado: false },
  { id: 5, titulo: "Libro 5", autor: "Autor W", precio: 18000, portada: "", destacado: false },
  { id: 6, titulo: "Libro 6", autor: "Autora V", precio: 22000, portada: "", destacado: false },
  { id: 7, titulo: "Libro 7", autor: "Autor U", precio: 30000, portada: "", destacado: false },
  { id: 8, titulo: "Libro 8", autor: "Autora T", precio: 12000, portada: "", destacado: false },
];

// Ids mock de libros que el usuario “compró”
const MIS_LIBROS_IDS = [1, 3, 5];

// Utilidad de latencia artificial
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const getLibros = ({ q = "" } = {}) => {
  return q
    ? api.get("/libros/", { params: { q } }).then(res => ({ data: res.data }))
    : api.get("/libros/").then(res => ({ data: res.data }));
};


export const getLibroById = (id) =>
  api.get(`/libros/${id}`).then(res => ({ data: res.data }));


export const getLibrosAdquiridos = () => api.get("/usuarios/libros").then(res => res.data);

// =====================================
// Mis libros (GET /mis-libros o similar)
// =====================================

export const getMisLibros = async ({ q = "" } = {}) => {
  const { data } = await api.get("/libros/usuario");
  // data ya viene con progreso_pagina_actual y progreso_pagina_total

  // Si quieres búsqueda local:
  const texto = q.trim().toLowerCase();
  const filtrados = texto
    ? data.filter(
        (l) =>
          l.titulo.toLowerCase().includes(texto) ||
          (l.autor && l.autor.toLowerCase().includes(texto))
      )
    : data;

  return filtrados;
};

