import React, { useEffect, useState } from "react";
import axios from "axios";

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3000/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      setUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка при загрузке списка пользователей");
    }
  };

  const handleBlock = async (username) => {
    try {
      const response = await axios.patch(
        "http://localhost:3000/block",
        { username },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }
      );
      setSuccessMessage(response.data.message);
      fetchUsers(); // Обновить список пользователей
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка при блокировке пользователя");
    }
  };

  const handleUnblock = async (username) => {
    try {
      const response = await axios.patch(
        "http://localhost:3000/unblock",
        { username },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }
      );
      setSuccessMessage(response.data.message);
      fetchUsers(); // Обновить список пользователей
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка при разблокировке пользователя");
    }
  };

  return (
    <div>
      <h2>Управление пользователями</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      <table border="1" style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Логин</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.isBlocked ? "Заблокирован" : "Активен"}</td>
              <td>
                {user.isBlocked ? (
                  <button onClick={() => handleUnblock(user.username)}>Разблокировать</button>
                ) : (
                  <button onClick={() => handleBlock(user.username)}>Заблокировать</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersManagement;
