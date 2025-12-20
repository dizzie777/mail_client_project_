// frontend/js/config.js
// Конфигурационный файл приложения

const Config = {
    // Базовый URL API
    API_BASE_URL: 'http://localhost:3000/api',
    
    // Endpoints API
    API_ENDPOINTS: {
        LETTERS: '/letters',
        LETTER_BY_ID: '/letters/:id',
        FOLDERS: '/folders/:name'
    },
    
    // Настройка пагинации
    PAGINATION: {
        ITEMS_PER_PAGE: 20,
        DEFAULT_PAGE: 1
    },
    
    // Сообщения об ошибках
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
        SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
        NOT_FOUND: 'Запрашиваемые данные не найдены.',
        UNKNOWN_ERROR: 'Произошла неизвестная ошибка.'
    },

    // Время кэширования (в млс)
    CACHE_TIME: 30000, // 30 сек

    // Настройки запросов
    REQUEST_TIMEOUT: 10000, // 10 сек
    RETRY_ATTEMPTS: 3, // Количество попыток при ошибке
    RETRY_DELAY: 1000 // Задержка между попытками (1 секунда)
};

// ДОБАВЬТЕ ЭТУ СТРОКУ:
export default Config;