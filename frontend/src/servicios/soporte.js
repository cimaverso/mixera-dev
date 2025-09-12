import api from "./api";

export const enviarTicketSoporte = async (ticketData) => {
  try {
    const response = await api.post("/soporte/ticket", ticketData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

