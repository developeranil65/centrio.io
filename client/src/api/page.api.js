import API from './axios';

export const createPage = (boardId, data) => API.post(`/boards/${boardId}/pages`, data);
export const getPages = (boardId) => API.get(`/boards/${boardId}/pages`);
export const getPage = (id) => API.get(`/pages/${id}`);
export const updatePage = (id, data) => API.put(`/pages/${id}`, data);
export const deletePage = (id) => API.delete(`/pages/${id}`);
