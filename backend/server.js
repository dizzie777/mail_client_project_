// backend/server.js 
// ВЕРСИЯ С БАЗОЙ ДАННЫХ ИЗ DB BROWSER 
const express = require('express'); 
const cors = require('cors'); 
const db = require('./db_simple.js'); // Подключаем наш модуль 
const app = express(); 
const PORT = 3000; 
// Middleware 
app.use(cors()); 
app.use(express.json()); 
// ========== API ENDPOINTS ========== 
// 1. ГЛАВНАЯ СТРАНИЦА 
app.get('/', (req, res) => { 
res.json({ 
message: '✉️Почтовый клиент с REAL базой данных', 
version: '3.0', 
status: 'работает', 
database: 'SQLite + DB Browser', 
instructions: 'Открывайте ссылки ниже в браузере', 
endpoints: [ 
'📩GET  /api/letters  - все письма из БД',
'🔍GET  /api/letters/:id - письмо по номеру',
'📊GET  /api/stats - статистика'
]
}); 
}); 
 
// 2. ВСЕ ПИСЬМА ИЗ БАЗЫ ДАННЫХ 
app.get('/api/letters', (req, res) => { 
console.log('📩Кто-то запросил все письма из БД'); 
db.getAllLetters((error, letters) => { 
if (error) { 
            // Если ошибка БД 
            res.status(500).json({ 
                success: false, 
                error: 'Не удалось прочитать базу данных', 
                details: error.message 
            }); 
        } else { 
            // Успех! Отправляем письма 
            res.json({ 
                success: true, 
                message: `Найдено ${letters.length} писем`, 
                count: letters.length, 
                data: letters 
            }); 
        } 
    }); 
}); 
 
// 3. ОДНО ПИСЬМО ПО ID 
app.get('/api/letters/:id', (req, res) => { 
    const id = req.params.id; 
    console.log(`🔍Запрос письма с ID: ${id}`); 
     
    db.getLetterById(id, (error, letter) => { 
        if (error) { 
            res.status(500).json({ 
                success: false, 
                error: 'Ошибка базы данных' 
            }); 
        } else if (!letter) { 
            // Письмо не найдено 
            res.status(404).json({ 
                success: false, 
                error: `Письмо с ID ${id} не найдено в базе данных` 
            }); 
        } else { 
            // Письмо найдено! 
            res.json({ 
                success: true, 
                message: 'Письмо найдено', 
                data: letter 
            }); 
        } 
    }); 
}); 
 
// 4. СТАТИСТИКА (дополнительно) 
app.get('/api/stats', (req, res) => { 
    db.getAllLetters((error, letters) => { 
        if (error) { 
            res.status(500).json({ error: 'Ошибка БД' }); 
        } else { 
            const inbox = letters.filter(l => l.folder === 'Входящие').length; 
            const sent = letters.filter(l => l.folder === 'Отправленные').length; 
            const unread = letters.filter(l => l.is_read === 0).length; 
             
            res.json({ 
                total: letters.length, 
                inbox: inbox, 
                sent: sent, 
                unread: unread, 
                message: `В базе ${letters.length} писем, ${unread} непрочитанных` 
            }); 
        } 
    }); 
}); 
 
// 5. ЗАГЛУШКИ для других методов 
app.post('/api/letters', (req, res) => { 
    res.json({ 
        success: true, 
        message: 'POST будет работать в день 4', 
        note: 'Сейчас данные только читаются из БД' 
    }); 
}); 
 
// ========== ЗАПУСК СЕРВЕРА ========== 
app.listen(PORT, () => { 
    console.log('════════════════════════════════════'); 
    console.log(`🚀Сервер запущен: http://localhost:${PORT}`); 
    console.log('📊 База данных: SQLite (создана в DB Browser)'); 
    console.log('📁 Файл БД: backend/database/mail.db'); 
    console.log('════════════════════════════════════'); 
    console.log('📋Что проверять в браузере:'); 
    console.log('  1. http://localhost:3000/'); 
    console.log('  2. http://localhost:3000/api/letters'); 
    console.log('  3. http://localhost:3000/api/letters/1'); 
    console.log('════════════════════════════════════'); 
}); 
