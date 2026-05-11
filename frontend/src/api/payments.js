import api from "../utils/axios";

export const createCheckoutSession = async (listingId) => {
  const response = await api.post(`/api/payments/feature/${listingId}/`);
  return response.data;
};


export const getPaymentStatus = async (listingId) => {
  const response = await api.get(`/api/payments/status/${listingId}/`);
  return response.data;
};

export const downloadInvoice = async (listingId, invoiceLabel) => {
  const response = await api.get(`/api/payments/invoice/${listingId}/`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = invoiceLabel || "NepSaathi-Invoice.pdf";
  a.click();
  URL.revokeObjectURL(url);
};
