import API from './axios';

export const createWorkspace = (data) => API.post('/workspaces', data);
export const getWorkspaces = () => API.get('/workspaces');
export const getWorkspace = (id) => API.get(`/workspaces/${id}`);
export const updateWorkspace = (id, data) => API.put(`/workspaces/${id}`, data);
export const deleteWorkspace = (id) => API.delete(`/workspaces/${id}`);
export const addMember = (id, data) => API.post(`/workspaces/${id}/members`, data);
export const removeMember = (wsId, userId) => API.delete(`/workspaces/${wsId}/members/${userId}`);
