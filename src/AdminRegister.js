import React, { useState } from "react";
import axios from "axios";

function AdminRegister({ isCreatingNewAdmin = false }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    try {
      const headers = isCreatingNewAdmin
        ? { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        : {}; // Добавляем токен только для создания администратора

      const response = await axios.post(
        "http://localhost:3000/create-admin",
        { username, password },
        { headers }
      );

      setSuccessMessage(response.data.message);
      setError("");
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка при регистрации");
    }
  };

  return (
    <div>
      <h2>{isCreatingNewAdmin ? "Создание нового администратора" : "Регистрация администратора"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
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
        <button type="submit">
          {isCreatingNewAdmin ? "Создать администратора" : "Зарегистрировать"}
        </button>
      </form>
    </div>
  );
}

export default AdminRegister;
