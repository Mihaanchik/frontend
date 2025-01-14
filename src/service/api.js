import axios from 'axios';

// ��������� ����� ������� (�������, ��� �� ����������)
const API_URL = 'http://localhost:5000'; // ��� ������ �����, ���� ����������

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ������� ��� ��������� ������ ��������
export const fetchServers = () => api.get('/servers');

// ������� ��� ��������� ��������� ����� ��� ���������� �������
export const fetchBackups = (serverId) => api.get(`/server-backups/${serverId}`);

// ������� ��� �������� ��������� �����
export const createBackup = (serverId) => api.post(`/backup/${serverId}`);

// ������� ��� �������������� ������� �� ��������� �����
export const restoreServer = (serverId, backupId) => api.post('/restore-server', { serverId, backupId });

export default api;
