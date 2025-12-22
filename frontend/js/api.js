// frontend/js/api.js
// Модуль для работы с API почтового клиента

import Config from './config.js';

class MailApi { // ИЗМЕНИТЕ MainAPI на MailApi
    constructor() {
        this.baseUrl = Config.API_BASE_URL;
        this.cache = new Map(); // Простое кэширование
        this.requestQueue = new Map(); // Очередь запросов

        // Добавить метод для группировки запросов 
            async function batchRequests(endpoints) { 
            const promises = endpoints.map(endpoint => this.fetchData(endpoint)); 
            return Promise.all(promises); 
            } 
            
    }

    /*
     * Общая функция для выполнения HTTP запросов
     * @param {string} endpoint - Endpoint API
     * @param {Object} options - опции fetch
     * @returns {Promise} Promise с данными
     */
    async fetchData(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const cacheKey = `${url}|${JSON.stringify(options)}`;

        // В fetchData добавить проверку на дублирующиеся запросы 
            const isDuplicate = this.requestQueue.has(cacheKey); 
            if (isDuplicate) { 
            console.log(`📦 Используем существующий запрос: ${endpoint}`); 
            return this.requestQueue.get(cacheKey); 
            } 

        // Проверка кэша
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < Config.CACHE_TIME) {
            console.log(`✅ Используем кэш для: ${endpoint}`);
            return cached.data;
        }

        // Настройки запроса
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: Config.REQUEST_TIMEOUT
        };

        const fetchOptions = { ...defaultOptions, ...options };

        console.log(`🌐 Запрос к API: ${fetchOptions.method} ${url}`);

        try {
            // Создаем таймаут для запроса
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), Config.REQUEST_TIMEOUT);
            fetchOptions.signal = controller.signal;

            // Выполняем запрос
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            // Проверяем статус ответа
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Парсим JSON ответ
            const data = await response.json();
            
            // Проверяем структуру ответа
            if (data && data.success !== undefined) {
                if (data.success) {
                    // Сохраняем в кэш
                    this.cache.set(cacheKey, { 
                        data: data,
                        timestamp: Date.now()
                    });

                    console.log(`Успешный ответ от: ${endpoint}`);
                    return data;
                } else {
                    throw new Error(data.error || 'Ошибка API');
                }
            }
            
            return data;
            
        } catch (error) {
            console.error(`Ошибка запроса ${endpoint}:`, error.message);
            
            // Обработка различных ошибок
            let errorMessage = Config.ERROR_MESSAGES.UNKNOWN_ERROR;
            
            if (error.name === 'AbortError') {
                errorMessage = 'Таймаут запроса. Сервер не отвечает.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = Config.ERROR_MESSAGES.NETWORK_ERROR;
            } else if (error.message.includes('HTTP 5')) {
                errorMessage = Config.ERROR_MESSAGES.SERVER_ERROR;
            } else if (error.message.includes('HTTP 4')) {
                errorMessage = Config.ERROR_MESSAGES.NOT_FOUND;
            }
            
            throw new Error(errorMessage);
        }
    }

    /*
     * Получить все письма
     * @param {string} folder - Папка для фильтрации (опционально)
     * @returns {Promise} Promise с письмами
     */
    async getLetters(folder = null) {
        let endpoint = Config.API_ENDPOINTS.LETTERS;

        if (folder) {
            endpoint += `?folder=${folder}`;
        }
        
        return await this.fetchData(endpoint);
    }

    /*
     * Получить одно письмо по ID
     * @param {number|string} id - ID письма
     * @returns {Promise} Promise с письмом
     */
    async getLetterById(id) {
        const endpoint = Config.API_ENDPOINTS.LETTER_BY_ID.replace(':id', id);
        return await this.fetchData(endpoint);
    }
    
    /*
     * Создать новое письмо
     * @param {Object} letterData - Данные письма
     * @returns {Promise} Promise с результатом
     */
    async createLetter(letterData) {
        const endpoint = Config.API_ENDPOINTS.LETTERS;

        const options = {
            method: 'POST',
            body: JSON.stringify(letterData)
        };

        return await this.fetchData(endpoint, options);
    }
    
    /*
     * Обновить письмо
     * @param {number|string} id - ID письма
     * @param {Object} updates - Данные для обновления
     * @returns {Promise} Promise с результатом
     */
    async updateLetter(id, updates) {
        const endpoint = Config.API_ENDPOINTS.LETTER_BY_ID.replace(':id', id);

        const options = {
            method: 'PATCH',
            body: JSON.stringify(updates)
        };

        return await this.fetchData(endpoint, options);
    }

    /*
     * Удалить письмо (переместить в корзину)
     * @param {number|string} id - ID письма
     * @returns {Promise} Promise с результатом
     */
    async deleteLetter(id) {
        const endpoint = Config.API_ENDPOINTS.LETTER_BY_ID.replace(':id', id);

        const options = {
            method: 'DELETE'
        };

        return await this.fetchData(endpoint, options);
    }
    
    /*
     * Получить письма из определенной папки
     * @param {string} folderName - Название папки
     * @returns {Promise} Promise с письмами
     */
    async getLettersByFolder(folderName) {
        const endpoint = Config.API_ENDPOINTS.FOLDERS.replace(':name', folderName);
        return await this.fetchData(endpoint);
    }
    
    /*
     * Проверить доступность сервера
     * @returns {Promise<boolean>} True если сервер доступен
     */
    async checkServerHealth() {
        try {
            await fetch("http://localhost:3000/", {method: 'HEAD' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /*
     * Очистить кэш
     */
    clearCache() {
        this.cache.clear();
        console.log('Кэш очищен');
    }

    /*
     * Очистить кэш для конкретного endpoint
     * @param {string} endpoint - Endpoint для очистки
     */
    clearCacheForEndpoint(endpoint) {
        for (const [key] of this.cache) {
            if (key.startsWith(`${this.baseUrl}${endpoint}`)) { // ИСПРАВЬТЕ: было startWith
                this.cache.delete(key);
            }
        }
        console.log(`Кэш очищен для: ${endpoint}`);
    }
}

// Создаем и экспортируем экземпляр API
const api = new MailApi(); // УБЕДИТЕСЬ что здесь MailApi, а не MainAPI
export default api;