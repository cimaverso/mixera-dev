// textosAPI.js - CORREGIDO con autenticación
import api from "./api";

class TextosAPIService {
  // Obtener token del localStorage
  getAuthHeaders(token) {
    if (!token) {
      token = localStorage.getItem("access_token");
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Obtener todos los textos de un libro
  async getTextos(libroId, token = null) {
    try {
      const headers = this.getAuthHeaders(token);
      const { data } = await api.get(`/textos/usuario/${libroId}`, { headers });
      
      console.log('✅ Textos obtenidos del backend:', data?.length || 0);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error obteniendo textos:', error);
      throw new Error(error.response?.data?.detail || 'Error obteniendo textos');
    }
  }

  // Crear nuevo texto - CORREGIDO
  async createTexto(textoData, token = null) {
    try {
      const headers = this.getAuthHeaders(token);
      
      // Validar datos requeridos
      if (!textoData.libroId || !textoData.texto?.trim()) {
        throw new Error('Faltan datos requeridos (libroId, texto)');
      }

      const payload = {
        txt_idlibro: parseInt(textoData.libroId),
        txt_pagina: parseInt(textoData.pagina),
        txt_x: parseFloat(textoData.x),
        txt_y: parseFloat(textoData.y),
        txt_texto: textoData.texto.trim(),
        txt_ancho: parseInt(textoData.width || 200),
        txt_alto: parseInt(textoData.height || 60),
        txt_dimension: parseInt(textoData.fontSize || 14),
      };

      console.log('📤 Creando texto en backend:', payload);

      const { data } = await api.post("/textos/", payload, { headers });
      
      console.log('✅ Texto creado en backend:', data);
      
      // Transformar respuesta del backend al formato del frontend
      return {
        id: data.txt_id,
        pagina: data.txt_pagina,
        x: data.txt_x,
        y: data.txt_y,
        texto: data.txt_texto,
        width: data.txt_ancho,
        height: data.txt_alto,
        fontSize: data.txt_dimension,
        createdAt: data.txt_creado,
        updatedAt: data.txt_actualizado,
        usuarioId: data.txt_idusuario,
      };
    } catch (error) {
      console.error('❌ Error creando texto:', error);
      
      // Mejorar manejo de errores
      if (error.response?.status === 401) {
        throw new Error('No autorizado. Inicia sesión nuevamente.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Datos inválidos');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor. Intenta más tarde.');
      }
      
      throw new Error(error.message || 'Error creando texto');
    }
  }

  // Actualizar texto existente - CORREGIDO
  async updateTexto(id, textoData, token = null) {
    try {
      const headers = this.getAuthHeaders(token);

      if (!id || !textoData.texto?.trim()) {
        throw new Error('Faltan datos requeridos (id, texto)');
      }

      const payload = {
        txt_idlibro: parseInt(textoData.libroId || textoData.pagina), // Fallback
        txt_pagina: parseInt(textoData.pagina),
        txt_x: parseFloat(textoData.x),
        txt_y: parseFloat(textoData.y),
        txt_texto: textoData.texto.trim(),
        txt_ancho: parseInt(textoData.width || 200),
        txt_alto: parseInt(textoData.height || 60),
        txt_dimension: parseInt(textoData.fontSize || 14),
      };

      console.log('📤 Actualizando texto en backend:', { id, payload });

      const { data } = await api.put(`/textos/${id}`, payload, { headers });
      
      console.log('✅ Texto actualizado en backend:', data);

      // Transformar respuesta
      return {
        id: data.txt_id,
        pagina: data.txt_pagina,
        x: data.txt_x,
        y: data.txt_y,
        texto: data.txt_texto,
        width: data.txt_ancho,
        height: data.txt_alto,
        fontSize: data.txt_dimension,
        createdAt: data.txt_creado,
        updatedAt: data.txt_actualizado,
        usuarioId: data.txt_idusuario,
      };
    } catch (error) {
      console.error('❌ Error actualizando texto:', error);
      throw new Error(error.response?.data?.detail || 'Error actualizando texto');
    }
  }

  // Eliminar texto - CORREGIDO
  async deleteTexto(id, token = null) {
    try {
      const headers = this.getAuthHeaders(token);
      
      console.log('📤 Eliminando texto del backend:', id);
      
      await api.delete(`/textos/${id}`, { headers });
      
      console.log('✅ Texto eliminado del backend:', id);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando texto:', error);
      throw new Error(error.response?.data?.detail || 'Error eliminando texto');
    }
  }

  // Exportar textos de un libro
  async exportTextos(libroId, token = null) {
    try {
      const headers = this.getAuthHeaders(token);
      const { data } = await api.get(`/textos/${libroId}/export`, { headers });
      return data;
    } catch (error) {
      console.error('❌ Error exportando textos:', error);
      throw new Error(error.response?.data?.detail || 'Error exportando textos');
    }
  }

  // Estadísticas de textos por libro
  async getTextosStats(libroId, token = null) {
    try {
      const headers = this.getAuthHeaders(token);
      const { data } = await api.get(`/textos/${libroId}/stats`, { headers });
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error(error.response?.data?.detail || 'Error obteniendo estadísticas');
    }
  }
}

export const textosAPI = new TextosAPIService();