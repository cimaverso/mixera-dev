import api from "./api";

class TextosAPIService {
  // Obtener todos los textos de un libro
  async getTextos(libroId) {
    try {
      const { data } = await api.get(`/textos/usuario/${libroId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  // Crear nuevo texto
  async createTexto(textoData) {
    try {
      const { data } = await api.post("/textos/", {
        txt_idlibro: textoData.libroId,
        txt_pagina: textoData.pagina,
        txt_x: textoData.x,
        txt_y: textoData.y,
        txt_texto: textoData.texto,
        txt_ancho: textoData.width,
        txt_alto: textoData.height,
        txt_dimension: textoData.fontSize || 14,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar texto existente
  async updateTexto(id, textoData) {
    try {
      const { data } = await api.put(`/textos/${id}`, {
        libro_id: textoData.libroId,
        usuario_id: textoData.usuarioId,
        pagina: textoData.pagina,
        x: textoData.x,
        y: textoData.y,
        texto: textoData.texto,
        width: textoData.width,
        height: textoData.height,
        font_size: textoData.fontSize || 14,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar texto
  async deleteTexto(id) {
    try {
      await api.delete(`/textos/${id}`);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Exportar textos de un libro
  async exportTextos(libroId) {
    try {
      const { data } = await api.get(`/textos/${libroId}/export`);
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Estadísticas de textos por libro
  async getTextosStats(libroId) {
    try {
      const { data } = await api.get(`/textos/${libroId}/stats`);
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const textosAPI = new TextosAPIService();
