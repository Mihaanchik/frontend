import React, { useEffect, useState } from 'react';
import { fetchServers, createBackup, restoreServer, fetchBackups } from '../services/api';

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [backups, setBackups] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedBackup, setSelectedBackup] = useState(null);

  // ��������� ������ �������� ��� ������������ ����������
  useEffect(() => {
    const loadServers = async () => {
      try {
        const { data } = await fetchServers();
        setServers(data);
      } catch (error) {
        console.error('������ ��� �������� ��������:', error);
      }
    };

    loadServers();
  }, []);

  // ���������� �������� ��������� �����
  const handleCreateBackup = async (serverId) => {
    try {
      await createBackup(serverId);
      alert('��������� ����� ������� �������!');
    } catch (error) {
      console.error('������ ��� �������� ��������� �����:', error);
    }
  };

  // ���������� �������������� �������
  const handleRestoreServer = async () => {
    if (selectedServer && selectedBackup) {
      try {
        await restoreServer(selectedServer, selectedBackup);
        alert('������ ������� ������������!');
      } catch (error) {
        console.error('������ ��� �������������� �������:', error);
      }
    } else {
      alert('����������, �������� ������ � ��������� �����.');
    }
  };

  // ���������� �������� ��������� ����� ��� ���������� �������
  const handleFetchBackups = async (serverId) => {
    try {
      const { data } = await fetchBackups(serverId);
      setBackups(data);
    } catch (error) {
      console.error('������ ��� �������� ��������� �����:', error);
    }
  };

  return (
    <div>
      <h1>�������</h1>
      <ul>
        {servers.map((server) => (
          <li key={server.id}>
            {server.name} - {server.ip_address}
            <button onClick={() => handleFetchBackups(server.id)}>�������� ��������� �����</button>
            <button onClick={() => handleCreateBackup(server.id)}>������� ��������� �����</button>
          </li>
        ))}
      </ul>

      {selectedServer && (
        <div>
          <h2>��������� ����� ��� ������� {selectedServer}</h2>
          <ul>
            {backups.map((backup) => (
              <li key={backup.id}>
                <label>
                  <input
                    type="radio"
                    name="backup"
                    value={backup.id}
                    onChange={() => setSelectedBackup(backup.id)}
                  />
                  ��������� ����� {backup.id}
                </label>
              </li>
            ))}
          </ul>

          <button onClick={handleRestoreServer}>������������ ������</button>
        </div>
      )}
    </div>
  );
};

export default Servers;
