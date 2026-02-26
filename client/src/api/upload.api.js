import API from './axios';

export const uploadFile = (formData) =>
    API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const getUploads = (workspaceId) => API.get(`/uploads/${workspaceId}`);
