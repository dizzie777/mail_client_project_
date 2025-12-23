# 📊 ER-ДИАГРАММА БАЗЫ ДАННЫХ

## СУЩНОСТИ

### 1. Таблица: users (ПОЛЬЗОВАТЕЛИ)
|-|users|
|-|-|
|(PK)|id|
||email|
||password_hash|
||full_name|
||created_at|

### 2. Таблица: letters (ПИСЬМА)
|-|letters|
|-|-|
|(PK)|id|
|(FK)|user_id(ссылается на users.id|)
|| folder|
||from_email|
||to_email|
||subject|
||body|
||is_read|
||created_at|

## СВЯЗИ (графическое представление нарисовать в Paint или построить нормальную
ER-диаграмму в онлайн редакторе или Visio)
![Картинка связи](/docs/er_diagram.png)
## SQL ДЛЯ СОЗДАНИЯ ТАБЛИЦ
```sql
-- Таблица пользователей
CREATE TABLE users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email VARCHAR(100) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
full_name VARCHAR(100),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Таблица писем
CREATE TABLE letters (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
folder VARCHAR(20) DEFAULT 'inbox',
from_email VARCHAR(100) NOT NULL,
to_email VARCHAR(100) NOT NULL,
subject VARCHAR(200),
body TEXT,
is_read BOOLEAN DEFAULT 0,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id)
);
```
## ПАПКИ ПИСЕМ
- inbox - Входящие

- sent - Отправленные

- draft - Черновики

- trash - Корзина
