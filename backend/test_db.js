const db = require('./db_simple.js');

console.log('🧪тестируем подключение к бд...');

// тест 1 все письма
db.getAllLetters((err, letters) => {
    if (err) {
        console.error('ошибка:', err);
    } else {
        console.log('✅получено писем:', letters.length);

        // тест 2 одно пиьсмо
        db.getLettersById(1, (err, letter) => {
            if (err) {
                console.error('ошибка:', err);
            } else if (letter) {
                console.log('✅письмо 1:', letter.subject);
            } else {
                console.log('❌письмо 1 не найдено');
            }
            console.log('🎉тест завершен!');
        });
    }
});