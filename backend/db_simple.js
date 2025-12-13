// backend/db_simple.js 
// ПРОСТОЙ модуль для работы с SQLite базой данных 
 
const sqlite3 = require('sqlite3').verbose(); 
 
// 1. Функция получить ВСЕ письма 
function getAllLetters(callback) { 
    // Открываем файл базы данных 
    const db = new sqlite3.Database('./database/mail.db'); 
     
    // Выполняем SQL запрос 
    const sql = 'SELECT * FROM letters ORDER BY date DESC'; 
     
    db.all(sql, [], (error, rows) => { 
        if (error) { 
            console.error('❌ Ошибка чтения из БД:', error.message); 
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
    const db = new sqlite3.Database('./database/mail.db'); 
     
    const sql = 'SELECT * FROM letters WHERE id = ?'; 
     
    db.get(sql, [id], (error, row) => { 
        if (error) { 
            console.error(`❌ Ошибка чтения письма ${id}:`, error.message); 
            callback(error, null); 
        } else { 
            if (row) { 
console.log(`✅ Найдено письмо: "${row.subject}"`); 
} else { 
console.log(` ✅ Письмо с ID ${id} не найдено`); 
} 
callback(null, row); 
} 
db.close(); 
}); 
} 
// 3. Экспортируем функции для использования в server.js 
module.exports = { 
getAllLetters, 
getLetterById 
};