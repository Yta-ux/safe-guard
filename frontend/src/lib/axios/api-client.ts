import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message
        || error.message
        || 'Erro inesperado. Tente novamente.';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(new Error('Erro de conexão com o servidor.'));
  },
);
