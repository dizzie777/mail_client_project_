// импорт
const express = require('express');
const cors = require('cors');

// созд экземпляр експрес
const app = express();
const PORT = 3000;

// мидлвар
app.use(cors());
app.use(express.json());

// тест данные
const mockLetters = [
    {
        id: 1,
        folder: 'inbox',
        from: 'teacher@college.ru',
        to: 'student@college.ru',
        subject: 'добро пожаловать на практику',
        body: 'сегодня начинаем разработку почтового клиента. удачи!))',
        date: '2024-05-21 09:00',
        is_read: false
    },
    {
        id: 2,
        folder: 'inbox',
        from: 'admin@college.ru',
        to: 'student@college.ru',
        subject: 'техническое задание',
        body: 'проектируем API для работы с письмами.',
        date: '2024-05-21 10:30',
        is_read: true
    },
    {
        id: 3,
        folder: 'sent',
        from: 'student@college.ru',
        to: 'teacher@college.ru',
        subject: 'вопрос по API',
        body: 'как правильно настроить Express сервер?',
        date: '2024-05-20 15:45',
        is_read: true
    }
];

//=====================АПИ ЭНДПОИНТЫ=========================

// 1проверка сервера
app.get('/', (req, res) => {
    res.json({
        message: 'почтовый клиент API работает!',
        version: '1.0.0',
        endpoints: [
            'GET    /api/letters',
            'GET    /api/letters/:id',
            'POST    /api/letters',
            'PATCH   /api/letters/:id',
            'DELETE    /api/letters/:id'
        ],
        instruction: 'используйте Постман или браузер для тестирования'      
    });
});


// 2получить все пиьсма
app.get('/api/letters', (req, res) => {
    console.log('запрос на получение всех писем');
    res.json({
        success: true,
        count: mockLetters.length,
        data: mockLetters
    });

});

// 3получить письмо по айди
app.get('/api/letters/:id', (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`поиск письма с ID: ${id}`); // исправлено: косые кавычки

    const letter = mockLetters.find(l => l.id === id);

    if(letter) {
        res.json({
            success: true,
            data: letter
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'письмо не найдено'
        });
    }
});

// 4новое письмо
app.post('/api/letters', (req, res) => {
    console.log('запрос на создание письма');
    console.log('тело запроса:', req.body);

    // создаем
    const newLetter = {
        id: mockLetters.length + 1,
        folder: 'sent',
        from: 'student@college.ru',
        to: req.body.to || 'recipient@example.com',
        subject: req.body.subject || 'без темы',
        body: req.body.body || 'текст',
        date: new Date().toISOString(),
        is_read: true
    };

    res.status(201).json({
        success: true,
        message: 'письмо создано',
        data: newLetter
    });
});

// 5обновить пьсмо 
app.patch('/api/letters/:id', (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`✏️обновление письма ID: ${id}`); // исправлено: косые кавычки
    console.log('данные для обновления:', req.body);

    res.json({
        success: true,
        message: `письмо ${id} обновлено`, // исправлено: косые кавычки
        updates: req.body
    });
});

// 6удалить письмо 
app.delete('/api/letters/:id', (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`🗑️удаление письма ID: ${id}`); // исправлено: косые кавычки

    res.json({
        success: true,
        message: `письмо ${id} удалено в корзину` // исправлено: косые кавычки
    });
});

// ======================ЗАПУСК СЕРВЕРА======================
app.listen(PORT, () => {
    console.log(`🚀сервер запущен на http://localhost:${PORT}`); // исправлено: косые кавычки
    console.log(`📊документация API: http://localhost:${PORT}/`); // исправлено: косые кавычки
    console.log(`📨API писем: http://localhost:${PORT}/api/letters`); // исправлено: косые кавычки
    console.log('==============================');
    console.log('для остановки сервера нажмите Ctrl + C');
});