import api from "./api"; // tu cliente axios configurado

export const progresoAPI = {
  async guardarProgreso({ libroId, paginaActual, totalPaginas }, token) {
    const response = await api.post(
      "/progresos/usuario",
      {
        pro_idlibro: libroId,
        pro_pagina_actual: paginaActual,
        pro_pagina_total: totalPaginas,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  
  async getProgreso(libroId, token) {
    const response = await api.get(`/progresos/usuario/${libroId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
