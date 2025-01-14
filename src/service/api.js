import axios from 'axios';

// Указываем адрес бэкенда (проверь, что он правильный)
const API_URL = 'http://localhost:5000'; // или другой адрес, если необходимо

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для получения списка серверов
export const fetchServers = () => api.get('/servers');

// Функция для получения резервных копий для выбранного сервера
export const fetchBackups = (serverId) => api.get(`/server-backups/${serverId}`);

// Функция для создания резервной копии
export const createBackup = (serverId) => api.post(`/backup/${serverId}`);

// Функция для восстановления сервера из резервной копии
export const restoreServer = (serverId, backupId) => api.post('/restore-server', { serverId, backupId });

export default api;
