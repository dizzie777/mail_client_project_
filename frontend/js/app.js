// frontend/js/app.js
// Главный файл приложения с динамической загрузкой данных

import api from "./api.js";

// Глобальные переменные
let currentLetterId = null;
let currentFolder = "inbox";
let allLetters = [];

// Основная функция инициализации
document.addEventListener("DOMContentLoaded", async function () {
  console.log("📧 Mail Client Frontend загружен");

  // Обновляем дату
  updateCurrentDate();

  // Проверяем сервер
  await checkServerStatus();

  // Настраиваем обработчики
  setupEventListeners();

  // Загружаем начальные данные
  await loadInitialData();
});

// Обновление даты в футере
function updateCurrentDate() {
  const now = new Date();
  const dateString = now.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  document.getElementById(
    "current-date"
  ).textContent = `Загружено: ${dateString}`;
}

// Проверка статуса сервера
async function checkServerStatus() {
  const statusElement = document.getElementById("server-status");

  try {
    const isHealthy = await api.checkServerHealth();
    if (isHealthy) {
      statusElement.innerHTML =
        '<i class="bi bi-check-circle me-1"></i>API онлайн';
      statusElement.className = "badge bg-success";
      console.log("✅ API сервер доступен");
    } else {
      throw new Error("Сервер не отвечает");
    }
  } catch (error) {
    statusElement.innerHTML = '<i class="bi bi-x-circle me-1"></i>API офлайн';
    statusElement.className = "badge bg-danger";
    console.warn("⚠️ API сервер недоступен:", error.message);
    showError("Сервер API недоступен. Проверьте, запущен ли backend сервер.");
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  // 1. Клик по папке
  const folderItems = document.querySelectorAll("[data-folder]");
  folderItems.forEach((item) => {
    item.addEventListener("click", async function (e) {
      e.preventDefault();
      const folder = this.getAttribute("data-folder");
      await selectFolder(folder, this);
    });
  });

  // 2. Кнопка "Новое письмо"
  const newLetterBtn = document.getElementById("new-letter-btn");
  if (newLetterBtn) {
    newLetterBtn.addEventListener("click", showNewLetterForm);
  }

  // 3. Кнопка "Обновить" (рядом с заголовком "Письма")
  const refreshBtn = document.querySelector(".btn-group .btn:first-child");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      await refreshLetters();
    });
  }

  // 4. Кнопка "Отмена" в форме нового письма
  const cancelBtn = document.getElementById("cancel-new-letter");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", hideNewLetterForm);
  }

  // 5. Поиск
  const searchInput = document.querySelector(".search-box input");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      filterLettersBySearch(this.value);
    });
  }
  //6. Форма нов письма
  //setupNewLetterForm();
  //добавляем обработчик на кнопку ОТПРАВИТЬ в форме
  document
    .getElementById("send-letter-btn")
    ?.addEventListener("click", async function (e) {
      e.preventDefault();
      await sendNewLetter();
    });
}

// Загрузка начальных данных
async function loadInitialData() {
  showLoading("Загрузка писем...");

  try {
    // Загружаем все письма
    const response = await api.getLetters();

    if (response && response.success) {
      allLetters = response.data;

      // Отображаем письма
      displayLetters(allLetters);

      // Обновляем статистику
      updateStatistics(response.data);

      // Выбираем первое письмо, если есть
      if (allLetters.length > 0) {
        await selectLetter(allLetters[0].id);
      }

      hideLoading();
    } else {
      throw new Error("Неверный формат ответа сервера");
    }
  } catch (error) {
    console.error("Ошибка загрузки писем:", error);
    showError(`Письма не могут быть загружены: ${error.message}`);
    hideLoading();
  }
}

// Отображение списка писем
function displayLetters(letters) {
  const letterList = document.getElementById("letter-list");

  if (!letters || letters.length === 0) {
    letterList.innerHTML = ` 
            <div class="text-center py-5 text-muted"> 
                <i class="bi bi-envelope display-6"></i> 
                <p class="mt-3 mb-0">Нет писем</p> 
            </div> 
        `;
    return;
  }

  // Очищаем список
  letterList.innerHTML = "";

  // Создаем элементы для каждого письма
  letters.forEach((letter) => {
    const letterElement = createLetterElement(letter);
    letterList.appendChild(letterElement);

    // Добавляем обработчик клика
    letterElement.addEventListener("click", async () => {
      await selectLetter(letter.id, letterElement);
    });
  });
}

// Создание элемента письма для списка
function createLetterElement(letter) {
  const isUnread = letter.is_read === 0;
  const date = formatDate(letter.date || letter.created_at);

  const element = document.createElement("a");
  element.href = "#";
  element.className = `list-group-item list-group-item-action ${
    isUnread ? "unread" : ""
  }`;
  element.setAttribute("data-id", letter.id);

  element.innerHTML = ` 
        <div class="d-flex w-100 justify-content-between"> 
            <h6 class="mb-1 ${isUnread ? "fw-bold" : ""}"> 
                ${escapeHtml(
                  letter.from_email ||
                    letter.sender_email ||
                    "Неизвестный отправитель"
                )} 
            </h6> 
            <small class="text-muted">${date}</small> 
        </div> 
        <p class="mb-1 ${isUnread ? "fw-bold" : ""}"> 
            ${escapeHtml(letter.subject || "Без темы")} 
        </p> 
        <small class="text-muted"> 
            ${escapeHtml(truncateText(letter.body || "", 80))} 
        </small> 
    `;

  return element;
}

// Выбор папки
async function selectFolder(folder, element) {
  console.log(`Выбрана папка: ${folder}`);
  currentFolder = folder;

  // Обновляем активную папку
  document.querySelectorAll("[data-folder]").forEach((item) => {
    item.classList.remove("active");
  });

  if (element) {
    element.classList.add("active");
  }

  // Загружаем письма из папки
  await loadLettersFromFolder(folder);
}

// Загрузка писем из папки
async function loadLettersFromFolder(folder) {
  showLoading(`Загрузка писем из папки "${getFolderName(folder)}"...`);

  try {
    const response = await api.getLetters(folder);

    if (response && response.success) {
      allLetters = response.data;
      displayLetters(allLetters);
      updateStatistics(response.data);

      // Сбрасываем выбранное письмо
      resetLetterSelection();

      hideLoading();
    }
  } catch (error) {
    console.error(`Ошибка загрузки писем из папки ${folder}:`, error);
    showError(`Не удалось загрузить письма: ${error.message}`);
    hideLoading();
  }
}

// Выбор письма
async function selectLetter(letterId, element = null) {
  console.log(`Выбрано письмо ID: ${letterId}`);
  currentLetterId = letterId;

  // Снимаем выделение со всех писем
  document.querySelectorAll(".letter-list .list-group-item").forEach((item) => {
    item.classList.remove("active-letter");
  });

  // Выделяем выбранное письмо
  if (element) {
    element.classList.add("active-letter");

    // Помечаем как прочитанное, если непрочитанное
    if (element.classList.contains("unread")) {
      await markAsRead(letterId, element);
    }
  }

  // Загружаем и отображаем содержимое письма
  await loadLetterContent(letterId);
}

// Загрузка содержимого письма
async function loadLetterContent(letterId) {
  showLoading("Загрузка письма...");

  try {
    const response = await api.getLetterById(letterId);

    if (response && response.success) {
      displayLetterContent(response.data);
      hideLoading();
    } else {
      throw new Error("Не удалось загрузить письмо");
    }
  } catch (error) {
    console.error(`Ошибка загрузки письма ${letterId}:`, error);
    showError(`Не удалось загрузить письмо: ${error.message}`);
    hideLoading();
  }
}

// Отображение содержимого письма
function displayLetterContent(letter) {
  // Скрываем заглушку
  document.getElementById("no-letter-selected").style.display = "none";

  // Показываем содержимое
  const contentElement = document.getElementById("letter-content");
  contentElement.style.display = "block";

  // Обновляем данные
  document.getElementById("letter-subject").textContent =
    letter.subject || "Без темы";
  document.getElementById("letter-from").textContent = `${
    letter.from_email || letter.sender_email || "Анонимный отправитель"
  }`;
  document.getElementById("letter-to").textContent =
    letter.recipient_email || letter.to_email || "Анонимный получатель";
  document.getElementById("letter-date").textContent = formatDate(
    letter.date || letter.created_at
  );
  document.getElementById("letter-folder").textContent = getFolderName(
    letter.folder
  );
  document.getElementById("letter-body").textContent =
    letter.body || "Нет текста";

  // Обновляем бейджи (расширенный вид)
  updateLetterBadges(letter);

  // Настраиваем кнопки действий
  setupLetterActionButtons(letter.id, letter);
}

// Пометить письмо как прочитанное
async function markAsRead(letterId, element) {
  try {
    await api.updateLetter(letterId, { is_read: true });

    // Обновляем внешний вид
    element.classList.remove("unread");
    element.querySelectorAll(".fw-bold").forEach((el) => {
      el.classList.remove("fw-bold");
    });

    // Обновляем статистику
    await refreshStatistics();
  } catch (error) {
    console.error(
      `Ошибка при пометке письма ${letterId} как прочитанного:`,
      error
    );
  }
}

//Обновление статистики
function updateStatistics(letters) {
  const total = letters.length;
  const unread = letters.filter((l) => l.is_read === 0).length;
  const inbox = letters.filter((l) => l.folder === "Входящие").length;
  const sent = letters.filter((l) => l.folder === "Отправленные").length;
  const draft = letters.filter((l) => l.folder === "черновики").length;
  const trash = letters.filter((l) => l.folder === "корзина").length;

  // Обновляем счетчики в папках
  updateFolderCount("inbox", inbox);
  updateFolderCount("sent", sent);
  updateFolderCount("корзина", trash);
  updateFolderCount("черновики", draft);

  // Обновляем общую статистику
  const statsElement = document.querySelector(".card-body");
  if (statsElement) {
    statsElement.innerHTML = ` 
            <p class="mb-1">Всего писем: <strong>${total}</strong></p> 
            <p class="mb-1">Непрочитанных: <strong class="text-danger">${unread}</strong></p> 
            <p class="mb-0">Отправлено: <strong>${sent}</strong></p> 
        `;
  }
}

// Обновление счетчика папки
function updateFolderCount(folder, count) {
  const folderElement = document.querySelector(
    `[data-folder="${folder}"] .badge`
  );
  if (folderElement) {
    folderElement.textContent = count;
    folderElement.className =
      count > 0 ? "badge bg-primary float-end" : "badge bg-secondary float-end";
  }
}

// Обновление бейджей письма
function updateLetterBadges(letter) {
  const badgesContainer = document.querySelector(
    "#letter-content .d-flex.gap-2.mb-3"
  );
  if (badgesContainer) {
    badgesContainer.innerHTML = ` 
            <span class="badge bg-primary">${getFolderName(
              letter.folder
            )}</span> 
            ${
              letter.is_read === 0
                ? '<span class="badge bg-warning">Непрочитано</span>'
                : ""
            } 
            ${
              letter.has_attachment
                ? '<span class="badge bg-success">С вложением</span>'
                : ""
            } 
        `;
  }
}

// Настройка кнопок действий для письма (вариант 2)
function setupLetterActionButtons(letterId, letterData) {
  // Находим контейнер для кнопок
  const buttonContainer = document.querySelector(
    "#letter-content .d-flex.gap2"
  );
  if (!buttonContainer) return;
  // Очищаем контейнер
  buttonContainer.innerHTML = "";
  // Создаем новые кнопки
  // Кнопка "Ответить" (День 7)
  const replyBtn = document.createElement("button");
  replyBtn.className = "btn btn-primary";
  replyBtn.innerHTML = '<i class="bi bi-reply me-1"></i> Ответить';
  replyBtn.addEventListener("click", () => {
    replyToLetter(letterData);
  });
  buttonContainer.appendChild(replyBtn);
  // 1. Кнопка "Пометить как прочитанное/непрочитанное"
  const toggleReadBtn = document.createElement("button");
  toggleReadBtn.className = "btn btn-outline-secondary";
  toggleReadBtn.innerHTML =
    letterData.is_read === 1
      ? '<i class="bi bi-check-circle me-1"></i> Прочитано'
      : '<i class="bi bi-envelope me-1"></i> Непрочитано';
  toggleReadBtn.addEventListener("click", async () => {
    await toggleReadStatus(letterId);
  });
  buttonContainer.appendChild(toggleReadBtn);
  // 2. Кнопка "Переслать"
  const forwardBtn = document.createElement("button");
  forwardBtn.className = "btn btn-outline-primary";
  forwardBtn.innerHTML = '<i class="bi bi-forward me-1"></i> Переслать';
  forwardBtn.addEventListener("click", () => {
    forwardLetter(letterData);
  });
  buttonContainer.appendChild(forwardBtn);
  // 3. Гибкая панель (пустой div для выравнивания)
  const spacer = document.createElement("div");
  spacer.className = "ms-auto";
  buttonContainer.appendChild(spacer);
  // 4. Кнопка "Удалить" (День-7)
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-outline-danger";
  deleteBtn.innerHTML = '<i class="bi bi-trash me-1"></i> Удалить';
  deleteBtn.addEventListener("click", () => {
    deleteLetter(letterId);
  });
  buttonContainer.appendChild(deleteBtn);
}

// Обновление всех писем
async function refreshLetters() {
  api.clearCacheForEndpoint("/letters");
  await loadInitialData();
}

// Обновление статистики
async function refreshStatistics() {
  try {
    const response = await api.getLetters();
    if (response && response.success) {
      updateStatistics(response.data);
    }
  } catch (error) {
    console.error("Ошибка обновления статистики:", error);
  }
}

// Сброс выбранного письма
function resetLetterSelection() {
  currentLetterId = null;
  document.getElementById("no-letter-selected").style.display = "block";
  document.getElementById("letter-content").style.display = "none";

  document.querySelectorAll(".letter-list .list-group-item").forEach((item) => {
    item.classList.remove("active-letter");
  });
}

// Показать форму нового письма
function showNewLetterForm() {
  document.getElementById("new-letter-form").style.display = "block";
  document.getElementById("letter-content").style.display = "none";
  document.getElementById("no-letter-selected").style.display = "none";

  //фокус на первое поле
  setTimeout(() => {
    document.getElementById("new-to-email").focus();
  }, 100);

  //прокуртка к форме
  document
    .getElementById("new-letter-form")
    .scrollIntoView({ behavior: "smooth" });
}

// Скрыть форму нового письма
function hideNewLetterForm() {
  document.getElementById("new-letter-form").style.display = "none";
  if (currentLetterId) {
    document.getElementById("letter-content").style.display = "block";
  } else {
    document.getElementById("no-letter-selected").style.display = "block";
  }
}

// Фильтрация писем по поиску
function filterLettersBySearch(searchTerm) {
  if (!searchTerm.trim()) {
    // Если поиск пустой, показываем все письма
    displayLetters(allLetters);
    return;
  }

  const filtered = allLetters.filter((letter) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (letter.subject && letter.subject.toLowerCase().includes(searchLower)) ||
      (letter.body && letter.body.toLowerCase().includes(searchLower)) ||
      (letter.from_email &&
        letter.from_email.toLowerCase().includes(searchLower)) ||
      (letter.sender_email &&
        letter.sender_email.toLowerCase().includes(searchLower))
    );
  });

  displayLetters(filtered);
}

// Вспомогательные функции

// Форматирование даты
function formatDate(dateString) {
  if (!dateString) return "Без даты";

  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // Если сегодня
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Если вчера
  if (diff < 48 * 60 * 60 * 1000) {
    return "Вчера";
  }

  // Если на этой неделе
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    return days[date.getDay()];
  }

  // Более недели назад
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

// Получение имени папки
function getFolderName(folderKey) {
  const folders = {
    inbox: "Входящие",
    sent: "Отправленные",
    draft: "Черновики",
    trash: "Корзина",
  };

  return folders[folderKey] || folderKey;
}

// Обрезка текста
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Экранирование HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Показать сообщение об ошибке
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className =
    "alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3";
  errorDiv.style.zIndex = "9999";
  errorDiv.innerHTML = ` 
        ${message} 
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button> 
    `;

  document.body.appendChild(errorDiv);

  // Автоматически скрыть через 5 секунд
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

// Показать сообщение об успехе
function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className =
    "alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3";
  successDiv.style.zIndex = "9999";
  successDiv.innerHTML = ` 
        ${message} 
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button> 
    `;

  document.body.appendChild(successDiv);

  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.remove();
    }
  }, 3000);
}

// Показать индикатор загрузки
function showLoading(message = "Загрузка...") {
  // Создаем или находим индикатор загрузки
  let loader = document.getElementById("global-loader");

  if (!loader) {
    loader = document.createElement("div");
    loader.id = "global-loader";
    loader.className = "position-fixed top-50 start-50 translate-middle";
    loader.innerHTML = ` 
            <div class="d-flex align-items-center bg-white p-3 rounded shadow"> 
                <div class="spinner-border text-primary me-3" role="status"> 
                    <span class="visually-hidden">Загрузка...</span> 
                </div> 
                <div>${message}</div> 
            </div> 
        `;
    loader.style.zIndex = "99999";
    document.body.appendChild(loader);
  } else {
    loader.querySelector("div:last-child").textContent = message;
    loader.style.display = "block";
  }
}

// Скрыть индикатор загрузки
function hideLoading() {
  const loader = document.getElementById("global-loader");
  if (loader) {
    loader.style.display = "none";
  }
}

// Обработка формы нового письма
function setupNewLetterForm() {
  const form = document.querySelector("#new-letter-form form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const toEmail = document.getElementById("new-to-email").value.trim();
      const subject = document.getElementById("new-subject").value.trim();
      const body = document.getElementById("new-body").value.trim();
      // Валидация
      if (!toEmail || !toEmail.includes("@")) {
        showError("Введите корректный email адрес");
        document.getElementById("new-to-email").focus();
        return;
      }
      if (!subject) {
        showError("Введите тему письма");
        document.getElementById("new-subject").focus();
        return;
      }
      if (!body) {
        showError("Введите текст письма");
        document.getElementById("new-body").focus();
        return;
      }
      const formData = {
        to_email: toEmail,
        subject: subject,
        body: body,
        folder: "Отправленные",
        from_email: "student@college.ru", // Можно сделать динамическим
      };
      showLoading("Отправка письма...");
      try {
        const result = await api.createLetter(formData);
        if (result && result.success) {
          showSuccess("Письмо успешно отправлено!");
          // Очищаем форму
          clearNewLetterForm();
          hideNewLetterForm();
          // Обновляем список писем
          api.clearCacheForEndpoint("/letters");
          await refreshLetters();
          // Переходим в отправленные
          await selectFolder("Отправленные");
        } else {
          throw new Error(result.error || "Ошибка отправки");
        }
      } catch (error) {
        console.error("Ошибка отправки:", error);
        showError(`Ошибка отправки: ${error.message}`);
      } finally {
        hideLoading();
      }
    });
  }
  // Кнопка "Сохранить черновик"
  const saveDraftBtn = document.getElementById("save-draft-btn");
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", async function () {
      const toEmail = document.getElementById("new-to-email").value.trim();
      const subject = document.getElementById("new-subject").value.trim();
      const body = document.getElementById("new-body").value.trim();
      // Для черновика все поля не обязательны
      if (!subject && !body) {
        showError("Черновик не может быть пустым");
        return;
      }
      const letterData = {
        to_email: toEmail || "",
        subject: subject || "Черновик",
        body: body || "",
        folder: "Черновики",
        is_read: 1,
      };
      showLoading("Сохранение черновика...");
      try {
        const response = await api.createLetter(letterData);
        if (response && response.success) {
          showSuccess("Черновик сохранен!");
          clearNewLetterForm();
          hideNewLetterForm();
          // Обновляем список и переходим в черновики
          api.clearCacheForEndpoint("/letters");
          await refreshLetters();
          await selectFolder("Черновики");
        }
      } catch (error) {
        console.error("Ошибка сохранения черновика:", error);
        showError("Не удалось сохранить черновик");
      } finally {
        hideLoading();
      }
    });
  }
}
// Очистка формы нового письма
function clearNewLetterForm() {
  document.getElementById("new-to-email").value = "";
  document.getElementById("new-subject").value = "";
  document.getElementById("new-body").value = "";
}

async function sendNewLetter() {
  const toEmail = document.getElementById("new-to-email").value.trim();
  const subject = document.getElementById("new-subject").value.trim();
  const body = document.getElementById("new-body").value.trim();
  // Валидация
  if (!toEmail || !toEmail.includes("@")) {
    showError("Введите корректный email адрес");
    document.getElementById("new-to-email").focus();
    return;
  }
  if (!subject) {
    showError("Введите тему письма");
    document.getElementById("new-subject").focus();
    return;
  }
  if (!body) {
    showError("Введите текст письма");
    document.getElementById("new-body").focus();
    return;
  }
  showLoading("Отправка письма...");
  try {
    const response = await api.createLetter({
      to_email: toEmail,
      subject: subject,
      body: body,
      folder: "Отправленные",
      from_email: "student@college.ru",
    });
    if (response && response.success) {
      showSuccess("Письмо успешно отправлено!");
      // Очищаем форму
      clearNewLetterForm();
      hideNewLetterForm();
      // Обновляем список писем
      api.clearCacheForEndpoint("/letters");
      await refreshLetters();
      // Переходим в отправленные
      await selectFolder("Отправленные");
    }
  } catch (error) {
    console.error("Ошибка отправки:", error);
    showError(`Ошибка отправки: ${error.message}`);
  } finally {
    hideLoading();
  }
}

//пререключение статуса прочитанности
async function toggleReadStatus(letterId) {
  //полоуч текущ письмо чоб узнать его статус
  try {
    const response = await api.getLetterById(letterId);
    if (response && response.success) {
      const currentLetter = response.data;
      const newStatus = currentLetter.is_read === 0 ? 1 : 0;

      showLoading("Обновление статуса...");

      const updateResponse = await api.updateLetter(letterId, {
        is_read: newStatus,
      });

      if (updateResponse && updateResponse.success) {
        showSuccess(
          newStatus === 1
            ? "Письмо помечено как прорчитанноое"
            : "письмо помечено как непрочитанное"
        );

        //обновляем текущее письмо
        await loadLetterContent(letterId);

        //обнолвяем список писем
        api.clearCacheForEndpoint("/letters");
        await refreshLetters();

        //обновляем сттатистику
        await refreshStatistics();
      }
    }
  } catch (error) {
    console.error(`Ошибка переключения статуса письма ${letterId}:`, error);
    showError("не удалось изменить статус письма");
  } finally {
    hideLoading();
  }
}

// Удаление письма (перемещение в корзину)
async function deleteLetter(letterId) {
  if (!letterId) {
    showError("Не выбрано письмо для удаления");
    return;
  }
  // Подтверждение удаления
  if (
    !confirm(
      "Вы уверены, что хотите удалить это письмо? Оно будет перемещенов корзину."
    )
  ) {
    return;
  }
  showLoading("Удаление письма...");
  try {
    // Отправляем DELETE запрос
    const response = await api.deleteLetter(letterId);
    if (response && response.success) {
      showSuccess("Письмо перемещено в корзину");
      // Очищаем кэш и обновляем список
      api.clearCacheForEndpoint("/letters");
      await refreshLetters();
      // Сбрасываем выбранное письмо
      resetLetterSelection();
      // Обновляем статистику
      await refreshStatistics();
      // Если мы находимся в папке "Корзина", обновляем её
      if (currentFolder === "Корзина") {
        await loadLettersFromFolder("Корзина");
      }
    } else {
      throw new Error(response.error || "Ошибка удаления");
    }
  } catch (error) {
    console.error(`Ошибка удаления письма ${letterId}:`, error);
    showError(`Не удалось удалить письмо: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Ответить на письмо
function replyToLetter(letterData) {
  showNewLetterForm();
  // Заполняем форму данными из письма
  const toEmail = document.getElementById("new-to-email");
  const subject = document.getElementById("new-subject");
  const body = document.getElementById("new-body");
  // Определяем адрес для ответа
  const replyTo = letterData.from_email || letterData.sender_email || "";
  toEmail.value = replyTo;
  // Добавляем Re: к теме, если его еще нет
  const originalSubject = letterData.subject || "";
  if (!originalSubject.toLowerCase().startsWith("re:")) {
    subject.value = `Re: ${originalSubject}`;
  } else {
    subject.value = originalSubject;
  }
  // Добавляем цитату оригинального письма
  const originalBody = letterData.body || "";
  const quote = `\n\n---\n${originalBody.substring(0, 500)}${
    originalBody.length > 500 ? "..." : ""
  }`;
  body.value = `Здравствуйте!\n\n${quote}`;
  // Фокус на тело письма
  setTimeout(() => {
    body.focus();
    body.setSelectionRange(0, 0);
  }, 100);
}

// Переслать письмо
function forwardLetter(letterData) {
  showNewLetterForm();
  const toEmail = document.getElementById("new-to-email");
  const subject = document.getElementById("new-subject");
  const body = document.getElementById("new-body");
  // Очищаем поле "Кому"
  toEmail.value = "";
  // Добавляем Fw: к теме
  const originalSubject = letterData.subject || "";
  if (
    !originalSubject.toLowerCase().startsWith("fw:") &&
    !originalSubject.toLowerCase().startsWith("fwd:")
  ) {
    subject.value = `Fwd: ${originalSubject}`;
  } else {
    subject.value = originalSubject;
  }
  // Добавляем информацию о пересылаемом письме
  const forwardInfo = `\n\n--- Пересылаемое письмо ---\n`;
  const fromInfo = `От: ${letterData.from_email || letterData.sender_email}\n`;
  const dateInfo = `Дата: ${formatDate(
    letterData.date || letterData.created_at
  )}\n`;
  const subjectInfo = `Тема: ${letterData.subject}\n`;
  const bodyContent = `\n${letterData.body || ""}`;
  body.value = forwardInfo + fromInfo + dateInfo + subjectInfo + bodyContent;
}
