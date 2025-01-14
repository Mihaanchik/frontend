const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');



const app = express();
const PORT = 3000;
const UPLOADS_FOLDER = 'D:/Курсовая_Шиб_Иванчуков/uploads';
const fs = require('fs');
const JWT_SECRET = 'your_secret_key'; // Секретный ключ для JWT, замените на более сложный




app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001', // Разрешаем запросы с порта 3001
  methods: ['GET', 'POST'],
}));


app.get("/api/some-data", (req, res) => {
  const sampleData = [
    { id: 1, name: "Пример 1" },
    { id: 2, name: "Пример 2" },
  ];
  console.log("Отправка данных:", sampleData);  // Логируем данные, которые отправляются
  res.json(sampleData);
});

let data = [
  { id: 1, name: "Элемент 1" },
  { id: 2, name: "Элемент 2" },
  { id: 3, name: "Элемент 3" },
];


app.delete("/api/some-data/:id", (req, res) => {
  try {
      console.log(`Получен запрос на удаление id: ${req.params.id}`);
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
          throw new Error(`Некорректный ID: ${req.params.id}`);
      }

      const index = data.findIndex((item) => item.id === id);

      if (index !== -1) {
          data.splice(index, 1); // Удаляем запись
          console.log(`Удалён элемент с id ${id}`);
          res.status(200).json({ message: `Запись с id ${id} удалена` });
      } else {
          console.log(`Элемент с id ${id} не найден`);
          res.status(404).json({ message: `Запись с id ${id} не найдена` });
      }
  } catch (error) {
      console.error("Ошибка при удалении:", error.message);
      res.status(500).json({ message: "Ошибка на сервере", error: error.message });
  }
});


app.use(express.static('build'));



const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost', // Убедитесь, что MySQL сервер работает на этом хосте
  user: 'root', // Ваш логин
  password: 'Kbctyjr2004elk02', // Ваш пароль
  database: 'user_management', // Название базы данных
  port: 8080 // Проверьте, что порт корректный (по умолчанию 3306)
})

db.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err);
    return;
  }
  console.log('Успешное подключение к базе данных!');
});


const isAdmin = (req, res, next) => {
  const token = req.headers['authorization']; // Берём токен из заголовка Authorization

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация!' });
  }

  // Убираем 'Bearer ' из начала токена, если он есть
  const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(tokenWithoutBearer, JWT_SECRET, (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён!' });
    }

    // Проверяем администратора в базе данных
    db.query('SELECT * FROM admins WHERE username = ?', [decoded.username], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
      }

      if (results.length === 0) {
        return res.status(403).json({ error: 'Доступ запрещён!' });
      }

      req.admin = results[0]; // Сохраняем данные администратора для дальнейшего использования
      next();  // Переходим к следующему middleware
    });
  });
};



const logAction = (username, action) => {
  db.query(
    'INSERT INTO logs (user_id, action) VALUES (?, ?)',
    [username, action],
    (err) => {
      if (err) {
        console.error('Ошибка записи лога:', err);
      }
    }
  );
};


// Middleware для проверки токена
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return next();  // Если нет токена, пропускаем этот шаг
  }

  const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(tokenWithoutBearer, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Неверный токен!' });
    }

    // Запрос к базе данных для получения информации о пользователе
    db.query('SELECT * FROM users WHERE username = ?', [decoded.username], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
      }

      const user = results[0];

      if (!user || user.isBlocked) {
        return res.status(403).json({ error: 'Доступ запрещён! Пользователь заблокирован.' });
      }

      req.user = user;  // Сохраняем пользователя в запросе
      next();  // Переходим к следующему middleware
    });
  });
};





app.post('/register', verifyToken, (req, res) => {
  const { username, password, isAdmin } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны!' });
  }

  // Проверяем, что только администратор может создавать других администраторов
  if (req.user && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Только администратор может создать нового администратора!' });
  }

  // Проверяем, есть ли уже такой пользователь в базе данных
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким именем уже существует!' });
    }

    // Хешируем пароль
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при хешировании пароля' });
      }

      // Вставляем нового пользователя в базу данных
      db.query('INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)', 
        [username, hashedPassword, isAdmin || false], (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Ошибка при добавлении пользователя' });
        }

        const userId = results.insertId;  // Получаем ID только что добавленного пользователя

        // Логируем создание нового пользователя с правильным ID
        logAction(userId, 'Создание пользователя', `Пользователь с ID ${userId} был зарегистрирован`);

        // Возвращаем успешный ответ
        res.status(201).json({
          message: 'Пользователь зарегистрирован!',
          user: { username, isAdmin: isAdmin || false, isBlocked: false }
        });
      });
    });
  });
});






app.use(express.json());
// Логин и получение токена
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны!' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }

    const user = results[0];

    if (!user) {
      return res.status(400).json({ error: 'Пользователь не найден!' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Доступ запрещён! Пользователь заблокирован.' });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при проверке пароля' });
      }

      if (!isMatch) {
        return res.status(400).json({ error: 'Неверный пароль!' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

      // Логируем успешный вход с использованием id пользователя
      logAction(user.id, 'login', 'Вход в систему');

      res.status(200).json({
        message: 'Успешная аутентификация',
        token,
        isAdmin: user.isAdmin || false
      });
    });
  });
});




// Маршрут для блокировки пользователя (только для администраторов)
// Маршрут для блокировки пользователя (только для администраторов)
app.patch('/block', verifyToken, isAdmin, (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Имя пользователя обязательно!' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }

    const user = results[0];
    if (!user) {
      return res.status(400).json({ error: 'Пользователь не найден!' });
    }

    if (user.isBlocked) {
      return res.status(400).json({ error: `Пользователь ${username} уже заблокирован.` });
    }

    db.query('UPDATE users SET isBlocked = ? WHERE username = ?', [true, username], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при блокировке пользователя' });
      }

      // Логируем действие администратора
      logAction(req.user.username, `Заблокировал пользователя ${username}`);

      res.status(200).json({ message: `Пользователь ${username} заблокирован.` });
    });
  });
});

// Маршрут для разблокировки пользователя
app.patch('/unblock', verifyToken, isAdmin, (req, res) => {
  const { username } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }

    const user = results[0];
    if (!user) {
      return res.status(400).json({ error: 'Пользователь не найден!' });
    }

    if (!user.isBlocked) {
      return res.status(400).json({ error: `Пользователь ${username} не заблокирован.` });
    }

    db.query('UPDATE users SET isBlocked = ? WHERE username = ?', [false, username], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при разблокировке пользователя' });
      }

      // Логируем действие администратора
      logAction(req.user.username, `Разблокировал пользователя ${username}`);

      res.status(200).json({ message: `Пользователь ${username} разблокирован.` });
    });
  });
});


app.get('/users', verifyToken, isAdmin, (req, res) => {
  db.query('SELECT username, isBlocked FROM users', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }
    res.status(200).json({ users: results });
  });
});


// Маршрут для получения файлов пользователя
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_FOLDER); // Папка для сохранения файлов
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Уникальное имя файла
  }
});

const upload = multer({ storage });

// Маршрут для загрузки файла
// Маршрут для загрузки файла
app.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Нет файла для загрузки!' });
  }

  const { id } = req.user; // Используем id пользователя из токена
  const { originalname, filename, path } = req.file;
  const { directoryId } = req.body; // Идентификатор директории (если есть)

  // Сохраняем информацию о файле в базе данных
  db.query(
    'INSERT INTO files (user_id, filename, path, directory_id, creation_datetime) VALUES (?, ?, ?, ?, ?)',
    [id, filename, path, directoryId || null, new Date()],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при сохранении данных в базе данных' });
      }

      // Логируем действие
      logAction(id, 'upload', `Загрузил файл: ${originalname}`);

      res.status(200).json({
        message: 'Файл успешно загружен!',
        file: { originalname, filename, path }
      });
    }
  );
});




app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER);
}

// Маршрут для получения файлов пользователя
app.get('/files', verifyToken, (req, res) => {
  const { username } = req.query;

  // Проверяем, что username передан в запросе
  if (!username) {
    return res.status(400).json({ error: 'Имя пользователя не указано!' });
  }

  // Запрашиваем данные о пользователе по имени пользователя
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }

    const user = results[0];
    if (!user) {
      return res.status(400).json({ error: 'Пользователь не найден!' });
    }

    // Запрашиваем все файлы, связанные с этим пользователем
    db.query('SELECT * FROM files WHERE username = ?', [username], (err, fileResults) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при запросе файлов из базы данных' });
      }

      res.status(200).json({ files: fileResults });
    });
  });
});



app.delete('/delete', verifyToken, (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'Не указано имя файла!' });
  }

  // Сначала ищем файл в базе данных
  db.query('SELECT * FROM files WHERE fileName = ?', [filename], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }

    const file = results[0];
    if (!file) {
      return res.status(404).json({ error: 'Файл не найден в базе данных!' });
    }

    // Проверяем, что файл принадлежит текущему пользователю
    if (file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для удаления этого файла!' });
    }

    // Удаляем файл из базы данных
    db.query('DELETE FROM files WHERE id = ?', [file.id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при удалении записи о файле' });
      }

      // Путь к файлу на диске
      const filePath = path.join(__dirname, 'uploads', filename);

      // Проверяем, существует ли файл на диске
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error('Файл не найден:', filename);
          return res.status(404).json({ error: 'Файл не найден на диске!' });
        }

        // Удаляем файл с диска
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Ошибка при удалении файла с диска:', err);
            return res.status(500).json({ error: 'Ошибка при удалении файла с диска' });
          }

          console.log('Файл успешно удалён:', filename);
          res.status(200).json({ message: 'Файл успешно удалён' });
        });
      });
    });
  });
});


// Маршрут для скачивания файла
app.get('/download', verifyToken, (req, res) => {
  const { filename } = req.query; // Получаем имя файла из запроса

  if (!filename) {
    return res.status(400).json({ error: 'Не указано имя файла' });
  }

  // Ищем файл в базе данных
  db.query('SELECT * FROM files WHERE fileName = ?', [filename], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }

    const file = results[0];
    if (!file) {
      return res.status(404).json({ error: 'Файл не найден в базе данных' });
    }

    // Проверяем, что файл принадлежит текущему пользователю (если это необходимо)
    if (file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Нет прав для скачивания этого файла' });
    }

    // Путь к файлу на сервере
    const filePath = path.join(__dirname, 'uploads', file.fileName);

    // Проверяем существование файла на диске
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден на сервере' });
    }

    // Устанавливаем заголовок для скачивания
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Ошибка при отправке файла:', err);
        res.status(500).json({ error: 'Ошибка при скачивании файла' });
      }
    });
  });
});


app.post('/create-admin', verifyToken, isAdmin, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны!' });
  }

  db.query('SELECT * FROM admins WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'Администратор с таким именем уже существует!' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при хешировании пароля' });
      }

      db.query('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Ошибка при создании администратора' });
        }

        res.status(201).json({ message: 'Администратор успешно создан!' });
      });
    });
  });
});




app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны!' });
  }

  // Проверяем администратора
  db.query('SELECT * FROM admins WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
    }

    const admin = results[0];
    if (!admin) {
      return res.status(400).json({ error: 'Администратор не найден!' });
    }

    // Проверяем пароль
    bcrypt.compare(password, admin.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при проверке пароля' });
      }

      if (!isMatch) {
        return res.status(400).json({ error: 'Неверный пароль!' });
      }

      const token = jwt.sign({ username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ message: 'Успешный вход', token });
    });
  });
});


app.use(express.json());
// Добавление сервера
// Исправленный маршрут






app.post('/backup/:serverId', verifyToken, isAdmin, (req, res) => {
  const { serverId } = req.params;

  // Создадим файл резервной копии (например, создаём файл .sql)
  const backupFileName = `backup_server_${serverId}_${Date.now()}.sql`;
  const backupFilePath = path.join(__dirname, 'backups', backupFileName);

  try {
    // Убедимся, что директория для бэкапов существует
    if (!fs.existsSync(path.join(__dirname, 'backups'))) {
      fs.mkdirSync(path.join(__dirname, 'backups'));
    }

    // Псевдокод для создания резервной копии (например, с помощью mysqldump)
    // Для примера, пишем просто файл с данными
    fs.writeFileSync(backupFilePath, 'SQL dump content...');

    db.query(
      'INSERT INTO backups (server_id, backup_file) VALUES (?, ?)',
      [serverId, backupFileName],
      (err) => {
        if (err) {
          console.error('Ошибка при добавлении записи в базу данных:', err);
          return res.status(500).json({ error: 'Ошибка при создании резервной копии' });
        }

        // Логируем создание резервной копии
        const userId = req.user.id || 'Unknown'; // Используем id пользователя, если оно есть
        const action = `Создал резервную копию для сервера с ID: ${serverId}`;
        logAction(userId, action); // Логирование

        res.status(200).json({ message: 'Резервная копия успешно создана!' });
      }
    );
  } catch (error) {
    console.error('Ошибка при создании резервной копии:', error);
    res.status(500).json({ error: 'Ошибка при создании резервной копии', details: error.message });
  }
});

app.post('/server', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, ip_address } = req.body;

    if (!name || !ip_address) {
      return res.status(400).json({ error: 'Name and IP address are required' });
    }

    // Сохраняем новый сервер
    db.query(
      'INSERT INTO servers (name, ip_address) VALUES (?, ?)',
      [name, ip_address],
      (err, result) => {
        if (err) {
          console.error('Ошибка создания сервера:', err);
          return res.status(500).json({ error: 'Ошибка создания сервера', details: err.message });
        }

        const serverId = result.insertId; // ID нового сервера
        console.log(`Сервер создан: ${serverId}`);

        // Логирование действия
        db.query(
          'INSERT INTO logs (user_id, action) VALUES (?, ?)',
          [req.user.id, `Created server with ID ${serverId}`],
          (logErr) => {
            if (logErr) {
              console.error('Ошибка записи лога:', logErr);
            }
          }
        );

        res.status(201).json({ message: 'Сервер успешно создан', serverId });
      }
    );
  } catch (error) {
    console.error('Ошибка создания сервера:', error);
    res.status(500).json({ error: 'Ошибка на сервере', details: error.message });
  }
});

const router = express.Router();

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Получение всех логов
app.get('/logs', async (req, res) => {
  try {
    console.log('Получение логов...');
    const logs = await queryAsync('SELECT * FROM logs ORDER BY created_at DESC');
    console.log('Логи получены:', logs);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Ошибка при запросе логов:', error.message, error.stack);
    res.status(500).json({
      error: 'Ошибка при запросе логов из базы данных',
      details: error.message,
    });
  }
});

// Удаление лога по ID
app.delete('/logs/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Используем обертку queryAsync для запроса
    const result = await queryAsync('DELETE FROM logs WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Лог с указанным ID не найден' });
    }
    res.status(200).json({ message: 'Лог успешно удалён' });
  } catch (error) {
    console.error('Ошибка при удалении лога:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка при удалении лога' });
  }
});

module.exports = router;

// Маршрут для получения серверов
app.get('/servers', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Запрос к маршруту /servers получен.');

    // Используем queryAsync для выполнения запроса
    const servers = await queryAsync('SELECT * FROM servers ORDER BY name ASC');
    console.log('Сервера получены:', servers);
    res.status(200).json(servers);
  } catch (error) {
    console.error('Ошибка при запросе серверов:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка при запросе серверов из базы данных', details: error.message });
  }
});


// Маршрут для получения резервных копий
app.get('/server-backups', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Запрос к маршруту /server-backups получен.');

    // Используем queryAsync для выполнения запроса
    const backups = await queryAsync('SELECT * FROM backups ORDER BY created_at DESC');

    console.log('Резервные копии получены:', backups);
    res.status(200).json(backups);
  } catch (error) {
    console.error('Ошибка при запросе резервных копий:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка при запросе резервных копий из базы данных', details: error.message });
  }
});

app.get('/user-logins', verifyToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        user_id, 
        COUNT(*) AS login_count
      FROM logs
      WHERE action = 'login'
      GROUP BY user_id
      ORDER BY login_count DESC;
    `;
    const logins = await queryAsync(query);
    res.status(200).json(logins);
  } catch (error) {
    console.error('Ошибка при получении количества входов пользователей:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка при получении данных из базы', details: error.message });
  }
});

app.get('/user-logins/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        user_id, 
        COUNT(*) AS login_count
      FROM logs
      WHERE action = 'login' AND user_id = ?
      GROUP BY user_id;
    `;
    const [logins] = await queryAsync(query, [id]);

    if (!logins) {
      return res.status(404).json({ error: 'Пользователь не найден или отсутствуют записи о входах' });
    }

    res.status(200).json(logins);
  } catch (error) {
    console.error(`Ошибка при получении количества входов для пользователя с ID ${id}:`, error.message, error.stack);
    res.status(500).json({ error: 'Ошибка при получении данных из базы', details: error.message });
  }
});

app.post('/restore-server', verifyToken, isAdmin, async (req, res) => {
  const { serverId, backupId } = req.body; // Принимаем ID сервера и резервной копии из тела запроса

  if (!serverId || !backupId) {
    return res.status(400).json({ error: 'Необходимо указать ID сервера и резервной копии.' });
  }

  try {
    console.log('Получены данные для восстановления:', { serverId, backupId });

    // SQL-запрос для восстановления сервера
    const query = `
      UPDATE servers
      JOIN backups ON servers.id = backups.server_id
      SET 
        servers.memory = backups.memory,
        servers.software_version = backups.software_version
      WHERE backups.id = ? AND servers.id = ?;
    `;

    // Выполняем запрос
    const result = await queryAsync(query, [backupId, serverId]);

    // Проверяем результат
    if (!result.affectedRows || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Не удалось восстановить сервер. Проверьте данные.' });
    }

    console.log('Результат обновления:', result);

    res.status(200).json({ message: 'Сервер успешно восстановлен из резервной копии.' });
  } catch (error) {
    console.error('Ошибка при восстановлении сервера:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка при восстановлении сервера из резервной копии', details: error.message });
  }
});


app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
