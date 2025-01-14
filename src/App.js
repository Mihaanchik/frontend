import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AdminRegister from "./AdminRegister";
import UsersManagement from "./UsersManagement"; // Новый компонент для управления пользователями
import "./App.css";

function Dashboard({ onLogout }) {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Администрирование</h1>
      <h2>Вы авторизованы как администратор</h2>
      <button onClick={onLogout}>Выйти</button>
      <button onClick={() => navigate("/create-admin")} style={{ marginTop: "20px" }}>
        Создать нового администратора
      </button>
      <button onClick={() => navigate("/users")} style={{ marginTop: "20px" }}>
        Пользователи
      </button>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <Routes>
          <Route path="/login" element={<AdminLogin onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/create-admin" element={<AdminRegister />} />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <div>
                  <h1>Администрирование</h1>
                  <p>Пожалуйста, войдите или зарегистрируйтесь</p>
                  <Link to="/login">Войти</Link> или <Link to="/register">Зарегистрироваться</Link>
                </div>
              )
            }
          />
          <Route path="/users" element={<UsersManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
