// textosAPI.js - CORREGIDO para manejar IDs temporales
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
      } else if (error.response?.status === 422) {
        console.error('Datos enviados:', error.config?.data);
        throw new Error('Error de validación en el servidor: ' + (error.response.data?.detail || 'Datos inválidos'));
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor. Intenta más tarde.');
      }
      
      throw new Error(error.message || 'Error creando texto');
    }
  }

  // Actualizar texto existente - CORREGIDO para validar ID
  async updateTexto(id, textoData, token = null) {
    try {
      const headers = this.getAuthHeaders(token);

      // VALIDACIÓN CRÍTICA: No intentar actualizar IDs temporales
      if (!id || typeof id === 'string' && id.startsWith('temp_')) {
        throw new Error('No se puede actualizar una anotación temporal. Debe crearse primero.');
      }

      if (!textoData.texto?.trim()) {
        throw new Error('Faltan datos requeridos (texto)');
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
      
      // Mejorar mensaje de error para 422
      if (error.response?.status === 422) {
        console.error('Datos enviados para actualización:', error.config?.data);
        throw new Error('Error de validación: ' + (error.response.data?.detail || 'Datos inválidos para actualización'));
      }
      
      throw new Error(error.response?.data?.detail || 'Error actualizando texto');
    }
  }

  // Eliminar texto - CORREGIDO para IDs temporales
  async deleteTexto(id, token = null) {
    try {
      // No intentar eliminar IDs temporales del backend
      if (typeof id === 'string' && id.startsWith('temp_')) {
        console.log('🗑️ Eliminando anotación temporal localmente:', id);
        return true;
      }

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