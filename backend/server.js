// ДЕНЬ 4: ПОЛНЫЙ CRUD API
const express = require('express');
const cors = require('cors');
const db = require('./db_simple.js');
const app = express();
const PORT = 3000;
// Middleware
app.use(cors());
app.use(express.json());
// ======== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =======
// Валидация данных для создания письма
function validateLetterData(data) {
 const errors = [];

 if (!data.to_email || !data.to_email.includes('@')) {
 errors.push('Некорректный email получателя');
 }

 if (!data.subject || data.subject.trim().length < 2) {
 errors.push('Тема письма должна быть не короче 2 символов');
 }

 if (!data.body || data.body.trim().length < 5) {
 errors.push('Текст письма должен быть не короче 5 символов');
 }

 return {
 isValid: errors.length === 0,
 errors: errors
 };
}
// ========== API ENDPOINTS ===========
// 1. ГЛАВНАЯ СТРАНИЦА
app.get('/', (req, res) => {
 res.json({
 message: '📧 Почтовый клиент API v4.0',
 status: 'работает',
 date: new Date().toISOString(),
 features: [
 '✅ Чтение писем из БД',
 '✅ Создание новых писем',
 '✅ Обновление статуса',
 '✅ Удаление в корзину',
 '✅ Фильтрация по папкам',
 '✅ Валидация данных'
 ],
 endpoints: [
 'GET /api/letters - все письма',
 'GET /api/letters/:id - письмо по ID',
 'POST /api/letters - создать письмо',
 'PATCH /api/letters/:id - обновить письмо',
 'DELETE /api/letters/:id - удалить в корзину',
 'GET /api/folders/:name - письма из папки'
 ]
 });
});
// 2. ПОЛУЧИТЬ ВСЕ ПИСЬМА (с фильтрацией)
app.get('/api/letters', (req, res) => {
 const { folder, limit } = req.query;

 console.log(`📨 Запрос писем${folder ? ` из папки "${folder}"` : ''}`);

 if (folder) {
 // Фильтрация по папке
 db.getLettersByFolder(folder, { limit: limit || 50 }, (error, letters) => {
 if (error) {
 res.status(500).json({
 success: false,
 error: 'Ошибка получения писем'
 });
 } else {
 res.json({
 success: true,
 folder: folder,
 count: letters.length,
 data: letters
 });
 }
 });
 } else {
 // Все письма
 db.getAllLetters((error, letters) => {
 if (error) {
 res.status(500).json({
 success: false,
 error: 'Ошибка получения писем'
 });
 } else {
 res.json({
 success: true,
 count: letters.length,
 data: letters
 });
 }
 });
 }
});
// 3. ПОЛУЧИТЬ ПИСЬМА ИЗ КОНКРЕТНОЙ ПАПКИ
app.get('/api/folders/:folderName', (req, res) => {
 const folderName = req.params.folderName;

 console.log(`📂 Запрос писем из папки: ${folderName}`);

 db.getLettersByFolder(folderName, {}, (error, letters) => {
 if (error) {
 res.status(500).json({
 success: false,
 error: 'Ошибка при получении писем'
 });
 } else {
 // Подсчет непрочитанных
 const unread = letters.filter(l => l.is_read === 0).length;

 res.json({
 success: true,
 folder: folderName,
 count: letters.length,
 unread: unread,
 data: letters
 });
 }
 });
});
// 4. ПОЛУЧИТЬ ОДНО ПИСЬМО
app.get('/api/letters/:id', (req, res) => {
 const id = parseInt(req.params.id);

 console.log(`🔍 Запрос письма ID: ${id}`);

 db.getLetterById(id, (error, letter) => {
 if (error) {
 res.status(500).json({
 success: false,
 error: 'Ошибка базы данных'
 });
 } else if (!letter) {
 res.status(404).json({
 success: false,
 error: `Письмо с ID ${id} не найдено`
 });
 } else {
 res.json({
 success: true,
 data: letter
 });
 }
 });
});
// 5. СОЗДАТЬ НОВОЕ ПИСЬМО (POST)
app.post('/api/letters', (req, res) => {
 console.log('📝 Запрос на создание письма');
 console.log('Данные:', req.body);

 // Валидация данных
 const validation = validateLetterData(req.body);

 if (!validation.isValid) {
 res.status(400).json({
 success: false,
 error: 'Ошибка валидации',
 details: validation.errors
 });
 return;
 }

 // Создаем письмо в БД
 db.createLetter(req.body, (error, result) => {
 if (error) {
 res.status(500).json({
 success: false,
 error: 'Ошибка создания письма в БД'
 });
 } else {
 res.status(201).json({
 success: true,
 message: 'Письмо успешно создано',
 data: result
 });
 }
 });
});
// 6. ОБНОВИТЬ ПИСЬМО (PATCH)
app.patch('/api/letters/:id', (req, res) => {
 const id = parseInt(req.params.id);

 console.log(`✏ Запрос обновления письма ID: ${id}`);
 console.log('Обновления:', req.body);

 // Проверяем, что есть что обновлять
 if (!req.body.is_read && !req.body.folder) {
 res.status(400).json({
 success: false,
 error: 'Укажите что обновлять: is_read или folder'
 });
 return;
 }

 // Обновляем письмо в БД
 db.updateLetter(id, req.body, (error, result) => {
 if (error) {
 res.status(500).json({
 success: false,
 error: 'Ошибка обновления письма'
 });
 } else if (!result.updated) {
 res.status(404).json({
 success: false,
 error: `Письмо с ID ${id} не найдено`
 });
 } else {
 res.json({
 success: true,
 message: 'Письмо успешно обновлено',
 data: result
 });
 }
 });
});
// 7. УДАЛИТЬ ПИСЬМО (DELETE)
app.delete('/api/letters/:id', (req, res) => {
 const id = parseInt(req.params.id);

 console.log(`🗑 Запрос удаления письма ID: ${id}`);

 db.deleteLetter(id, (error, result) => {
 if (error) {
 res.status(500).json({
 success: false,
 error: 'Ошибка удаления письма'
 });
 } else if (!result.deleted) {
 res.status(404).json({
 success: false,
 error: `Письмо с ID ${id} не найдено`
 });
 } else {
 res.json({
 success: true,
 message: 'Письмо перемещено в корзину',
 data: result
 });
 }
 });
});
// ======= ЗАПУСК СЕРВЕРА =======
app.listen(PORT, () => {
 console.log('═══════════════════');
 console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
 console.log('📧 Почтовый клиент API v4.0');
 console.log('✅ Полный CRUD (создание, чтение, обновление, удаление)');
 console.log('✅ Валидация данных');
 console.log('✅ Фильтрация по папкам');
 console.log('═══════════════════');
 console.log('📋 Тестируйте в Postman:');
 console.log(' POST /api/letters - создать письмо');
 console.log(' PATCH /api/letters/1 - отметить прочитанным');
 console.log(' DELETE /api/letters/1 - удалить в корзину');
 console.log('═══════════════════');
});