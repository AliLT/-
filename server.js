const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Настройка парсера и отдачи статических файлов
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Подключение к SQLite (файл создастся автоматически)
const db = new sqlite3.Database('./feedback.db', (err) => {
  if (err) {
    console.error('Ошибка подключения к SQLite:', err);
  } else {
    console.log('Успешно подключено к SQLite');
  }
});

// Создаём таблицу, если её нет
db.run(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Отдаём главную страницу
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка формы
app.post('/submit-feedback', (req, res) => {
  // Honeypot
  if (req.body.honeypot) {
    return res.status(400).send('Спам обнаружен!');
  }

  const { name, email, message } = req.body;

  // Валидация
  if (!name || !email || !message) {
    return res.status(400).send('Все поля обязательны.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).send('Некорректный email.');
  }

  // Сохранение в базу
  const query = `INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)`;
  db.run(query, [name, email, message], function(err) {
    if (err) {
      console.error('Ошибка вставки:', err);
      return res.status(500).send('Ошибка сервера.');
    }

    res.send(`
      <h2 style="text-align:center; margin-top:50px;">Спасибо! Сообщение успешно отправлено.</h2>
      <p style="text-align:center;"><a href="/" style="text-decoration: none; color: black;">← Вернуться к форме</a></p>
    `);
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});