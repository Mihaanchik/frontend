import React, { useEffect, useState } from 'react';
import { fetchServers, createBackup, restoreServer, fetchBackups } from '../services/api';

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [backups, setBackups] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedBackup, setSelectedBackup] = useState(null);

  // Загружаем список серверов при монтировании компонента
  useEffect(() => {
    const loadServers = async () => {
      try {
        const { data } = await fetchServers();
        setServers(data);
      } catch (error) {
        console.error('Ошибка при загрузке серверов:', error);
      }
    };

    loadServers();
  }, []);

  // Обработчик создания резервной копии
  const handleCreateBackup = async (serverId) => {
    try {
      await createBackup(serverId);
      alert('Резервная копия успешно создана!');
    } catch (error) {
      console.error('Ошибка при создании резервной копии:', error);
    }
  };

  // Обработчик восстановления сервера
  const handleRestoreServer = async () => {
    if (selectedServer && selectedBackup) {
      try {
        await restoreServer(selectedServer, selectedBackup);
        alert('Сервер успешно восстановлен!');
      } catch (error) {
        console.error('Ошибка при восстановлении сервера:', error);
      }
    } else {
      alert('Пожалуйста, выберите сервер и резервную копию.');
    }
  };

  // Обработчик загрузки резервных копий для выбранного сервера
  const handleFetchBackups = async (serverId) => {
    try {
      const { data } = await fetchBackups(serverId);
      setBackups(data);
    } catch (error) {
      console.error('Ошибка при загрузке резервных копий:', error);
    }
  };

  return (
    <div>
      <h1>Серверы</h1>
      <ul>
        {servers.map((server) => (
          <li key={server.id}>
            {server.name} - {server.ip_address}
            <button onClick={() => handleFetchBackups(server.id)}>Показать резервные копии</button>
            <button onClick={() => handleCreateBackup(server.id)}>Создать резервную копию</button>
          </li>
        ))}
      </ul>

      {selectedServer && (
        <div>
          <h2>Резервные копии для сервера {selectedServer}</h2>
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
                  Резервная копия {backup.id}
                </label>
              </li>
            ))}
          </ul>

          <button onClick={handleRestoreServer}>Восстановить сервер</button>
        </div>
      )}
    </div>
  );
};

export default Servers;
