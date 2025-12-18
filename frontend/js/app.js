
let currentLetterId = null;
let currentFolder = 'inbox';

document.addEventListener('DOMContentLoaded', function() {
    console.log('💌 Mail Client Frontend загружен');
    
    updateCurrentDate();
    
    checkServerStatus();
    
    setupEventListeners();
    
    selectFirstLetter();
});

// Обновление даты в футере
function updateCurrentDate() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric', 
        hour: '2-digit',
        minute: '2-digit'
    };
    const dateString = now.toLocaleDateString('ru-Ru', options);
    document.getElementById('current-date').textContent = `Загружено: ${dateString}`;
}

// Проверка статуса апи
function checkServerStatus() {
    const statusElement = document.getElementById('server-status');
    
    fetch('http://localhost:3000/')
        .then(responce => {
            if (responce.ok) {
                statusElement.innerHTML = '<i class="bi bi-check-circle me-1"></i>API онлайн';
                statusElement.className = 'badge bg-success';
                console.log('✅ API сервер доступен');
            } else {
                throw new Error('Сервер недоступен');
            }
        })
        .catch(error => {
            statusElement.innerHTML = '<i class="bi bi-check-circle me-1"></i>API офлайн';
            statusElement.className = 'badge bg-danger';
            console.warn('⚠️ API сервер недоступен:', error.message);
        });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // 1. клик по письму в списке
    const letterItems = document.querySelectorAll('.letter-list .list-group-item');
    letterItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const letterId = this.getAttribute('data-id');
            selectLetter(letterId, this);
        });
    });
    //2. кл по папке
    const folderItems = document.querySelectorAll('[data-folder]');
    folderItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const folder = this.getAttribute('data-folder');
            selectFolder(folder, this);
        });
    });
    
    // 3. 
    const newLetterBtn = document.getElementById('new-letter-btn');
    if (newLetterBtn) {
        newLetterBtn.addEventListener('click', showNewLetterForm);
    }
    
    // 4. 
    const cancelBtn = document.getElementById('cancel-new-letter');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideNewLetterForm);
    }
    
    // 5. 
    const mobileNewLetterBtn = document.querySelector('.mobileMenu .btn-primary');
    if (mobileNewLetterBtn) {
        mobileNewLetterBtn.addEventListener('click', showNewLetterForm);
    }
}

// выбор письма для просмотра
function selectLetter(letterId, element) {
    console.log(`Выбрано письмо ID: ${letterId}`);
    currentLetterId = letterId;
    
    // Снимаем выделение со всех писем
    document.querySelectorAll('.letter-list .list-group-item').forEach(item => {
        item.classList.remove('active-letter');
    });
    
    // Выделяем выбранное письмо
    if (element) {
        element.classList.add('active-letter');
    }
        // Помечаем как прочитанное
        if (element && element.classList.contains('unread')) {
            element.classList.remove('unread');
            element.querySelectorAll('.fw-bold').forEach(el => {
                el.classList.remove('.fw-bold');
            });
        }
    
    // содержимое письма
    showLetterContent(letterId);
}

// выбор пиапки
function selectFolder(folder, element) {
    console.log(`Выбрано папка: ${folder}`);
    currentFolder = folder;
    
    // Снимаем выделение со всех папок
    document.querySelectorAll('[data-folder]').forEach(item => {
        item.classList.remove('active');
    });
    
    //  активируем
    if (element) {
        element.classList.add('active');
    }
       //в реальном прил прогружались бы письма из пакп  симулате лоад фолдер леттерс (фолдер)
}

// показываем содердимое письма
function showLetterContent(letterId) {
    // скр загрушку
    document.getElementById('no-letter-selected').style.display = 'none';
    // содержимое письма
    const contentElement = document.getElementById('letter-content');
    contentElement.style.display = 'block';

    // в реальном приордении бы с сервера
    // для\я демонетср обнова полей
    updateLetterPreview(letterId);
}

// обнова превью пьсма заглушка
function updateLetterPreview(letterId)
{
    const lettersData = {
        1: {
            subject: 'Задание на практику',
            from: 'Учитель Иванов <teacher@college.ru>',
            to: 'student@college.ru',
            date: '24 мая 2024, 10:30',
            folder: 'Входящие',
            body: 'Уважаемый студент,<br><br>Сегодня вы должны завершить работу над API для'+
            +'почтового клиента и начать верстку фронтенд части.<br><br><strong>Задачи на'+
            +'сегодня:<strong><br>1. Создать HTML-структуру приложения<br>2. '+
            +'Подключить Bootstrap для стилизации<br>3. Сверстать три основнык '+
            +'колонки: папки, список писем, просмотр письма<br>4. '+
            +'Сделать адаптивный дизайн<br><br>Удачи в работе! '+
            +'Не забывайте делать коммиты в Git.<br><br>С уважением,<br>Преподаватель'
        },
        2: {
            subject: 'Технические работы',
            from: 'Администратор системы <admin@college.ru>',
            to: 'student@college.ru',
            date: '23 мая 2024, 14:15',
            folder: 'Входящие',
            body: 'Уведомляем вас о проведении плановых технических работ.'+
            +'<br><br>Завтра с 23:00 до 01:00 будут проводиться работы по обновлению '+
            +'серверного оборудования. В это время сервис может быть недоступен.'+
            +'<br><br>Приносим извининения за возможные неудобства.'
        }
    };

    const letter = lettersData[letterId] || {
        subject: 'Письмо ' + letterId,
        from: 'Отправитель <sender@example.com>',
        to: 'student@college.ru',
        date: '24 мая 2024',
        folder: 'Входящие',
        body: 'Содержимое письма...'
    };

    // Обнвляем поля в интерфейсе   
        document.getElementById('letter-subject').textContent = letter.subject;
        document.getElementById('letter-from').textContent = letter.from;
        document.getElementById('letter-to').textContent = letter.to;
        document.getElementById('letter-date').textContent = letter.date;
        document.getElementById('letter-folder').textContent = letter.folder;
        document.getElementById('letter-body').textContent = letter.body;
}
    // форма нового письма
    function showNewLetterForm() {
        document.getElementById('new-letter-form').style.display = 'block';
        document.getElementById('letter-content').style.display = 'none';
        document.getElementById('no-letter-selected').style.display = 'none';

        // прокручиваем к форме
        document.getElementById('new-letter-form').scrollIntoView({ behavior: 'smooth' });
    }

// скрытть форму нового письма
function hideNewLetterForm() {
    document.getElementById('new-letter-form').style.display = 'none';

    // если было выбрано пьсмо покзываем его
    if(currentLetterId) {
        document,getElementById('letter-content').style.display = 'block';
    } else {
        document,getElementById('no-letter-selected').style.display = 'block';
    }
}
//    выбрать первое пьсмо для демонестрации
function selectFirstLetter() {
    const firstLetter = document.querySelector('.letter-list .list-group-item');
    if (firstLetter) {
        const letterId = firstLetter.getAttribute('data-id');
        selectLetter(letterId, firstLetter);
    }
}

// СИМУЛЯИИ -ЗАГРУЗКИ ПИСЕМ
function simulateLoad() {
    console.log(`Загрузка писем из папки "${folder}"...`);
}