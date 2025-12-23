// backend/db_simple.js
// ПРОСТОЙ модуль для работы с SQLite базой данных

const sqlite3 = require("sqlite3").verbose();

// 1. Функция получить ВСЕ письма
function getAllLetters(callback) {
  // Открываем файл базы данных
  const db = new sqlite3.Database("./database/mail.db");

  // Выполняем SQL запрос
  const sql = "SELECT * FROM letters ORDER BY date DESC";

  db.all(sql, [], (error, rows) => {
    if (error) {
      console.error("❌ Ошибка чтения из БД:", error.message);
      callback(error, null);
    } else {
      console.log(`✅ Прочитано писем из БД: ${rows.length}`);
      callback(null, rows);
    }
    // Закрываем соединение
    db.close();
  });
}

// 2. Функция получить ОДНО письмо по ID
function getLetterById(id, callback) {
  const db = new sqlite3.Database("./database/mail.db");

  const sql = "SELECT * FROM letters WHERE id = ?";

  db.get(sql, [id], (error, row) => {
    if (error) {
      console.error(`❌ Ошибка чтения письма ${id}:`, error.message);
      callback(error, null);
    } else {
      if (row) {
        console.log(`✅ Найдено письмо: "${row.subject}"`);
      } else {
        console.log(`✅ Письмо с ID ${id} не найдено`);
      }
      callback(null, row);
    }
    db.close();
  });
}

// 3. функция СОЗДАТЬ  новое письмо
function createLetter(letterData, callback) {
  const db = new sqlite3.Database("./database/mail.db");

  const sql = `
    INSERT INTO letters (user_id, folder, from_email, to_email, subject, body, is_read, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const values = [
    letterData.user_id || 1,
    letterData.folder || "Отправление",
    letterData.from_email || "teacher@college.ru",
    letterData.to_email,
    letterData.subject,
    letterData.body,
    letterData.is_read || 0,
    new Date().toISOString(),
  ];

  db.run(sql, values, function (error) {
    if (error) {
      console.error("❌Ошибка создания письма:", error.message);
      callback(error, null);
    } else {
      console.log("✅ Создано письмо ID: ${this.lastID}");
      callback(null, { id: this.lastID, ...letterData });
    }
    db.close();
  });
}

// 4. функция ОБНОВИТЬ письмо (прочитать  или перместить)
function updateLetter(id, updates, callback) {
  const db = new sqlite3.Database("./database/mail.db");

  // Определяем, что обновляем
  let sql, values;

  if (updates.is_read !== undefined) {
    // Обновляем статус прочитанности
    sql = "UPDATE letters SET is_read = ? WHERE id = ?";
    values = [updates.is_read ? 1 : 0, id];
  } else if (updates.folder) {
    // Перемещаем в другую папку
    sql = "UPDATE letters SET folder = ? WHERE id = ?";
    values = [updates.folder, id];
  } else {
    callback(new Error("Не указано что обновлять"), null);
    db.close();
    return;
  }

  db.run(sql, values, function (error) {
    if (error) {
      console.error(`❌Ошибка обновления письма ${id}:`, error.message);
      callback(error, null);
    } else if (this.changes === 0) {
      // Ничего не обновлялось (письмо не найдено)
      console.log(`⚠️Письмо ${id} не найдено для обновления`);
      callback(null, { updated: false });
    } else {
      console.log("✅B Обновлено письмо ID: ${id}");
      callback(null, {
        updated: true,
        changes: this.changes,
        updates: updates,
      });
    }
    db.close();
  });
}

// 5. функция УДАЛИТЬ письмо (переместит в корзину)
function deleteLetter(id, callback) {
  const db = new sqlite3.Database("./database/mail.db");

  const sql = "UPDATE letters SET folder = ? WHERE id = ?";
  const values = ["Корзина", id];

  db.run(sql, values, function (error) {
    if (error) {
      console.error(`❌Ошибка удаления письма ${id}:`, error.message);
      callback(error, null);
    } else if (this.changes === 0) {
      console.log(`⚠️Письмо ${id} не найдено для удаления`);
      callback(null, { deleted: false });
    } else {
      console.log(`✅Письмо ${id} перемещено в корзину`);
      callback(null, {
        deleted: true,
        changes: this.changes,
      });
    }
    db.close();
  });
}

// 6. ф-ция для поика по папке с пагинациеrq
function getLettersByFolder(folder, options = {}, callback) {
  const db = new sqlite3.Database("./database/mail.db");

  let sql = "SELECT * FROM letters WHERE folder = ?";
  const values = [folder];

  //сортировка
  sql += "ORDER BY date DESC";

  //ограничение (пагинация)
  if (options.limit) {
    sql += " LIMIT ?";
    values.push(options.limit);
    if (options.offset) {
      sql += " OFFSET ?";
      values.push(options.offset);
    }
  }

  db.all(sql, values, (error, rows) => {
    if (error) {
      console.error(`❌ Ошибка получения письма из ${folder}:`, error.message);
      callback(error, null);
    } else {
      console.log(`✅ Найдено писем в  ${folder}: ${rows.length}`);
      callback(null, rows);
    }
    db.close();
  });
}

// 8. Экспортируем функции для использования в server.js
module.exports = {
  getAllLetters,
  getLetterById,
  createLetter,
  updateLetter,
  deleteLetter,
  getLettersByFolder,
};
