import api from "../utils/axios";

export const getConversations = async () => {
  const response = await api.get("/api/messages/");
  return response.data;
};

export const startConversation = async (data) => {
  const response = await api.post("/api/messages/", data);
  return response.data;
};

export const getConversation = async (id) => {
  const response = await api.get(`/api/messages/${id}/`);
  return response.data;
};

export const sendMessage = async (conversationId, content) => {
  const response = await api.post(`/api/messages/${conversationId}/send/`, { content });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get("/api/messages/unread-count/");
  return response.data;
};

export const deleteConversation = async (id) => {
  await api.delete(`/api/messages/${id}/`);
};
