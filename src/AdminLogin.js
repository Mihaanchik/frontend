import React, { useState } from "react";
import axios from "axios";

function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    setLoading(true); // Показываем индикатор загрузки

    try {
      const response = await axios.post("http://localhost:3000/admin-login", {
        username,
        password,
      });

      // Сохраняем токен в localStorage
      localStorage.setItem("authToken", response.data.token);
      setError("");
      onLoginSuccess(); // Уведомляем родительский компонент о успешной авторизации
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка при входе");
    } finally {
      setLoading(false); // Останавливаем индикатор загрузки
    }
  };

  return (
    <div>
      <h2>Вход как администратор</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Логин:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Пароль:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Загрузка..." : "Войти"}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
