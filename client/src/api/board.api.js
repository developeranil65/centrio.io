import API from './axios';

export const createBoard = (wsId, data) => API.post(`/workspaces/${wsId}/boards`, data);
export const getBoards = (wsId) => API.get(`/workspaces/${wsId}/boards`);
export const getBoard = (id) => API.get(`/boards/${id}`);
export const updateBoard = (id, data) => API.put(`/boards/${id}`, data);
export const deleteBoard = (id) => API.delete(`/boards/${id}`);
