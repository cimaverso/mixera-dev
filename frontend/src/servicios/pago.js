
// servicios/pago.js
import api from "./api"; // 👈 asegúrate de importar api, NO axios

export const getLinkPago = async (id) => {
  const { data } = await api.get(`/pago/${id}`); // 👈 usa api.get, no axios.get
  return data;
};