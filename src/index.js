import React from "react";
import ReactDOM from "react-dom/client"; 
import App from "./App"; // Путь к вашему файлу App.js
//import "./index.css"; // Если этого файла нет, можете удалить эту строку

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
