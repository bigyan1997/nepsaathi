import api from "../utils/axios";

export const getForumPosts = async (params = {}) => {
  const response = await api.get("/api/forum/", { params });
  return response.data;
};

export const getForumPost = async (slug) => {
  const response = await api.get(`/api/forum/${slug}/`);
  return response.data;
};

export const createForumPost = async (data) => {
  const response = await api.post("/api/forum/", data);
  return response.data;
};

export const deleteForumPost = async (slug) => {
  await api.delete(`/api/forum/${slug}/`);
};

export const voteForumPost = async (slug) => {
  const response = await api.post(`/api/forum/${slug}/vote/`);
  return response.data;
};

export const getForumReplies = async (slug) => {
  const response = await api.get(`/api/forum/${slug}/replies/`);
  return response.data;
};

export const createForumReply = async (slug, data) => {
  const response = await api.post(`/api/forum/${slug}/replies/`, data);
  return response.data;
};

export const deleteForumReply = async (id) => {
  await api.delete(`/api/forum/replies/${id}/`);
};

export const voteForumReply = async (id) => {
  const response = await api.post(`/api/forum/replies/${id}/vote/`);
  return response.data;
};
