# API ENDPOINTS
## БАЗОВЫЙ URL
## ТАБЛИЦА ENDPOINTS

|-|Метод|Описание|Параметры|        
|-|-|-|-|
|GET|/letters|Получить все письма|?folder=inbox <br> ?search=текст|
|GET|/letters/{id}|Получить одно письмо|id - номер письма|
|POST|/letters|Создать новое письмо|{to, subject, body}|
|PATCH|/letters/{id}|Обновить письмо|{is_read: true}|
|DELETE|/letters/{id}|Удалить в корзину|id - номер письма|
|GET|/folders|Получить папки и счетчики|нет|

## ПОДРОБНОЕ ОПИСАНИЕ
### 1. GET/letters
**получить список писем**
пример запроса: GET http://localhost:3000/api/letters?folder=inbox

пример ответа:
```json
{
"success": true,
"data": [
    {
        "id": 1,
        "from": "teacher@school.ru",
        "subject": "Задание",
        "body": "Сделать проект...",
        "date": "2024-05-20",
        "is_read": false
    }
]
}
```
### 2. GET/letters/{id}
**получить одно письмо**
пример: GET http://localhost:3000/api/letters/1

### 3. POST/letters
**отправить письмо**
тело запроса:
```json
{
"to": "friend@mail.ru",
"subject": "Привет",
"body": "Как дела?"
}
```
### 4. PATCH/letters/{id}
**обновить письмо**

пример (пометить прочитанным):
```json
{
    "is_read": true
}
```

### 5. DELETE/letters/{id}
**удалить в корзину**

пример:
| DELETE http://localhost:3000/api/letters/5