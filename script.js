// Функции для сохранения и загрузки данных

// ОБЕСПЕЧЕНИЕ ДОСТУПНОСТИ ФУНКЦИЙ ГЛОБАЛЬНО ДЛЯ ONCLICK
// Этот блок должен быть в начале файла
window.savePersonaData = savePersonaData;
window.openHealthLogModal = openHealthLogModal;
window.closeHealthLogModal = closeHealthLogModal;
window.openScheduleOperationModal = openScheduleOperationModal;
window.filterHistory = filterHistory;
window.addHealthEntry = addHealthEntry;
window.saveHealthEntry = saveHealthEntry;
window.filterSocial = filterSocial;
window.interactSocial = interactSocial;
window.openWorkSubTab = openWorkSubTab;
window.setTaskPriority = setTaskPriority;
window.openAddTaskModal = openAddTaskModal;
window.toggleWorkTabTask = toggleWorkTabTask; 
window.addItemToInventoryPrompt = addItemToInventoryPrompt;
window.saveInventory = saveInventory;
window.filterItems = filterItems;
window.deleteContextItem = deleteContextItem;
window.editContextItemName = editContextItemName;
window.closeModal = closeModal;

// Экспорт функций планировщика в глобальную область
window.toggleCompletePlanner = toggleCompletePlanner;
window.deleteTaskPlanner = deleteTaskPlanner;
window.editTaskPlanner = editTaskPlanner;

// Функции для работы со здоровьем
window.openAddHealthStatModal = openAddHealthStatModal;
window.closeHealthStatModal = closeHealthStatModal;
window.deleteHealthStat = deleteHealthStat;
window.saveHealthStat = saveHealthStat;
window.deleteHealthEntry = deleteHealthEntry;

// ЕДИНСТВЕННАЯ ИНИЦИАЛИЗАЦИЯ DATA

function savePersonaData() {
    const personaNameInput = document.getElementById('personaNameInput');
    const personaAgeInput = document.getElementById('personaAgeInput');
    const personaBackstoryInput = document.getElementById('personaBackstoryInput');
    const personaTraitsInput = document.getElementById('personaTraitsInput');
    const personaSkillsInput = document.getElementById('personaSkillsInput');
    const personaEquipmentInput = document.getElementById('personaEquipmentInput');
    
    if (!personaNameInput || !personaAgeInput || !personaBackstoryInput || 
        !personaTraitsInput || !personaSkillsInput || !personaEquipmentInput) {
        console.warn('Некоторые элементы формы персонажа не найдены!');
        return;
    }
    
    const personaDataToSave = {
        name: personaNameInput.value,
        age: personaAgeInput.value,
        backstory: personaBackstoryInput.value,
        traits: personaTraitsInput.value,
        skills: personaSkillsInput.value,
        equipment: personaEquipmentInput.value,
        avatar: LifePlanner.getData().persona.avatar || '' // Получаем аватар из централизованных данных
    };
    LifePlanner.getData().persona = personaDataToSave;
    LifePlanner.saveData();
    alert('Данные персонажа сохранены!');
    loadPersonaData();
}

function loadPersonaData() {
    const personaDataFromStorage = LifePlanner.getData().persona;
    console.log('Загруженные данные персонажа:', personaDataFromStorage); // Отладочное сообщение
    
    // Определяем имя (из сохраненных данных или пустое)
    const name = personaDataFromStorage?.name || '';
    console.log('Имя персонажа для отображения:', name); // Отладочное сообщение

    // ВСЕГДА обновляем имя во всех местах
    const personaNameInput = document.getElementById('personaNameInput');
    if (personaNameInput) personaNameInput.value = name;

    const characterNameSpan = document.getElementById('characterName');
    if (characterNameSpan) characterNameSpan.textContent = name || 'Персонаж';
    
    const healthCharacterNameSpan = document.getElementById('healthCharacterName');
    if (healthCharacterNameSpan) healthCharacterNameSpan.textContent = name || 'Персонаж';

    // Загружаем остальные данные только если они есть
    if (personaDataFromStorage) {
        document.getElementById('personaAgeInput').value = personaDataFromStorage.age || '28';
        document.getElementById('personaBackstoryInput').value = personaDataFromStorage.backstory || 'Исследователь пустошей';
        document.getElementById('personaTraitsInput').value = personaDataFromStorage.traits || 'Трудолюбивый, Оптимист, Нервный';
        document.getElementById('personaSkillsInput').value = personaDataFromStorage.skills || 'Строительство: 8/20\nМедицина: 5/20\nСтрельба: 12/20';
        document.getElementById('personaEquipmentInput').value = personaDataFromStorage.equipment || 'Одежда: Пыльник\nОружие: Лазерный пистолет';
        
        const avatarDisplay = document.querySelector('#persona .persona-avatar');
        if (personaDataFromStorage.avatar) {
            avatarDisplay.style.backgroundImage = `url(${personaDataFromStorage.avatar})`;
            avatarDisplay.textContent = '';
        } else {
            avatarDisplay.style.backgroundImage = 'none';
            avatarDisplay.textContent = 'Аватар';
        }
    }
}

document.getElementById('avatarUpload') && document.getElementById('avatarUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            LifePlanner.getData().persona.avatar = e.target.result;
            LifePlanner.saveData();
            const avatarDisplay = document.querySelector('#persona .persona-avatar');
            avatarDisplay.style.backgroundImage = `url(${e.target.result})`;
            avatarDisplay.textContent = '';
            savePersonaData(); 
        }
        reader.readAsDataURL(file);
    }
});

// Удалена: let inventoryItems = [];
const inventoryGridContainer = document.getElementById('inventoryGridContainer');
const MAX_INVENTORY_SLOTS = 20;
let draggedItem = null;
let contextMenuItem = null;

function renderInventory() {
    if (!inventoryGridContainer) {
        console.warn("Контейнер инвентаря 'inventoryGridContainer' не найден. Рендер невозможен.");
        return;
    }
    inventoryGridContainer.innerHTML = '';
    const inventoryItems = LifePlanner.getData().inventoryItems;
    for (let i = 0; i < MAX_INVENTORY_SLOTS; i++) {
        const cell = document.createElement('div');
        cell.classList.add('inventory-cell');
        cell.dataset.slotId = i;
        const item = inventoryItems.find(itm => itm.slot === i);
        if (item) {
            cell.textContent = item.name + (item.quantity > 1 ? ` (x${item.quantity})` : '');
            cell.draggable = true;
            cell.dataset.itemId = item.id;
            cell.dataset.itemType = item.type;
        } else {
            cell.textContent = '';
        }
        cell.addEventListener('dragstart', handleDragStart);
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('drop', handleDrop);
        cell.addEventListener('dragend', handleDragEnd);
        cell.addEventListener('contextmenu', handleContextMenu);
        inventoryGridContainer.appendChild(cell);
    }
}

function handleDragStart(e) {
    const inventoryItems = LifePlanner.getData().inventoryItems;
    draggedItem = inventoryItems.find(item => item.slot == this.dataset.slotId);
    if(draggedItem) { // Убедимся, что элемент действительно есть
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.slotId);
    setTimeout(() => {
        this.style.opacity = '0.5';
    }, 0);
    } else {
        e.preventDefault(); // Предотвращаем начало перетаскивания, если элемента нет
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const targetSlotId = parseInt(this.dataset.slotId);
    const sourceSlotIdText = e.dataTransfer.getData('text/plain');
    if (!sourceSlotIdText) return; // Если нет ID источника, выходим
    const sourceSlotId = parseInt(sourceSlotIdText);

    const inventoryItems = LifePlanner.getData().inventoryItems;
    if (draggedItem && draggedItem.slot === sourceSlotId && targetSlotId !== sourceSlotId) {
        const targetItem = inventoryItems.find(item => item.slot === targetSlotId);
            const sourceItemIndex = inventoryItems.findIndex(item => item.id === draggedItem.id);

        if (targetItem) {
            const targetItemIndex = inventoryItems.findIndex(item => item.id === targetItem.id);
            if (sourceItemIndex !== -1 && targetItemIndex !== -1) {
            inventoryItems[sourceItemIndex].slot = targetSlotId;
            inventoryItems[targetItemIndex].slot = sourceSlotId;
            }
        } else {
            if (sourceItemIndex !== -1) {
                inventoryItems[sourceItemIndex].slot = targetSlotId;
            }
        }
        LifePlanner.saveData(); // Сохраняем через LifePlanner
        renderInventory();
    }
    this.style.opacity = '1';
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    draggedItem = null;
}

function addItemToInventory(name, quantity = 1, type = 'resources') {
    const inventoryItems = LifePlanner.getData().inventoryItems;
    if (inventoryItems.length >= MAX_INVENTORY_SLOTS && !inventoryItems.find(i => i.name === name)) {
        alert('Инвентарь полон!');
        return;
    }
    let existingItem = inventoryItems.find(i => i.name === name);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        let newSlot = -1;
        for(let i=0; i < MAX_INVENTORY_SLOTS; i++){
            if(!inventoryItems.find(item => item.slot === i)){
                newSlot = i;
                break;
            }
        }
        if(newSlot === -1) {
             alert('Нет свободных слотов для нового типа предмета!');
             return;
        }
        inventoryItems.push({ 
            id: Date.now() + Math.random().toString(36).substr(2, 9), // Более уникальный ID
            name: name, 
            quantity: quantity, 
            slot: newSlot, 
            type: type 
        });
    }
    LifePlanner.saveData(); // Сохраняем через LifePlanner
    renderInventory();
}

function addItemToInventoryPrompt() {
    const itemNameInput = document.getElementById('item-name');
    const itemQuantityInput = document.getElementById('item-quantity');
    const itemCategorySelect = document.getElementById('item-category');
    const itemDescriptionTextarea = document.getElementById('item-description');

    const itemName = itemNameInput.value.trim();
    const itemQuantity = parseInt(itemQuantityInput.value);
    const itemCategory = itemCategorySelect.value;
    const itemDescription = itemDescriptionTextarea.value.trim();

    if (itemName && itemQuantity > 0) {
        addItemToInventory(itemName, itemQuantity, itemCategory);
        closeModal();
        // Очистка формы после добавления
        itemNameInput.value = '';
        itemQuantityInput.value = '1';
        itemCategorySelect.value = 'resources';
        itemDescriptionTextarea.value = '';
    } else {
        alert('Пожалуйста, введите название и количество предмета.');
    }
}

function saveInventory() {
    LifePlanner.saveData(); // Сохраняем через LifePlanner
    alert('Инвентарь сохранен!');
}

function loadInventory() {
    const inventoryItems = LifePlanner.getData().inventoryItems;
    renderInventory();
}

function handleContextMenu(e) {
    e.preventDefault();
    const contextMenu = document.getElementById('itemContextMenu');
    const targetCell = e.target.closest('.inventory-cell');
    if (targetCell && targetCell.dataset.itemId) {
        contextMenuItem = LifePlanner.getData().inventoryItems.find(item => item.id === targetCell.dataset.itemId);
        if (contextMenuItem) {
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
        }
    } else {
        hideContextMenu();
    }
}

function hideContextMenu() {
    document.getElementById('itemContextMenu').style.display = 'none';
    contextMenuItem = null;
}

function filterItems(type) {
    const inventoryItems = LifePlanner.getData().inventoryItems;
    const filteredItems = type === 'all' ? inventoryItems : inventoryItems.filter(item => item.type === type);
    
    // Очищаем текущий инвентарь
    inventoryGridContainer.innerHTML = '';

    // Отображаем отфильтрованные предметы
    filteredItems.forEach(item => {
        const cell = document.createElement('div');
        cell.classList.add('inventory-cell');
        cell.textContent = item.name + (item.quantity > 1 ? ` (x${item.quantity})` : '');
        cell.draggable = true;
        cell.dataset.itemId = item.id;
        cell.dataset.itemType = item.type;
        cell.dataset.slotId = item.slot; // Добавляем slotId для перетаскивания
        cell.addEventListener('dragstart', handleDragStart);
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('drop', handleDrop);
        cell.addEventListener('dragend', handleDragEnd);
        cell.addEventListener('contextmenu', handleContextMenu);
        inventoryGridContainer.appendChild(cell);
    });
    // Добавляем пустые ячейки, если их меньше MAX_INVENTORY_SLOTS
    for (let i = filteredItems.length; i < MAX_INVENTORY_SLOTS; i++) {
        const cell = document.createElement('div');
        cell.classList.add('inventory-cell');
        cell.dataset.slotId = i; // Важно для перетаскивания на пустые слоты
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('drop', handleDrop);
        inventoryGridContainer.appendChild(cell);
    }

    // Обновляем активные кнопки категорий
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.category-btn[data-category="${type}"]`).classList.add('active');
}

function deleteContextItem() {
    if (contextMenuItem) {
        if (confirm(`Вы уверены, что хотите удалить ${contextMenuItem.name}?`)) {
            LifePlanner.getData().inventoryItems = LifePlanner.getData().inventoryItems.filter(item => item.id !== contextMenuItem.id);
            LifePlanner.saveData();
            renderInventory();
            hideContextMenu();
        }
    }
}

function editContextItemName() {
    if (contextMenuItem) {
        const newName = prompt('Введите новое название:', contextMenuItem.name);
        if (newName !== null && newName.trim() !== '') {
            contextMenuItem.name = newName.trim();
            LifePlanner.saveData();
            renderInventory();
            hideContextMenu();
        }
    }
}

// === Планировщик: рабочая инициализация ===
// Оставляем только одну систему задач (из plan.html)

/*
// Глобальные переменные для планировщика
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let userStats = JSON.parse(localStorage.getItem('userStats')) || { xp: 0, level: 1, currency: 0, hp: 100 };
let filterCompleted = null;
let conversions = JSON.parse(localStorage.getItem('conversions')) || [];
let savingsGoal = parseFloat(localStorage.getItem('savingsGoal')) || 0;
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);
let userAchievements = JSON.parse(localStorage.getItem('userAchievements')) || [];

// Функции планировщика (addTask, renderTasks, ...)
// ... (оставить только одну реализацию из plan.html, см. предыдущий код) ...

// Инициализация обработчиков событий только после загрузки DOM

document.addEventListener('DOMContentLoaded', () => {
  // Получаем элементы
  const newTaskInput = document.getElementById('new-task');
  const importanceSel = document.getElementById('importance');
  const urgencySel = document.getElementById('urgency');
  const prioritySelect = document.getElementById('priority');
  const dueDateInput = document.getElementById('due-date');
  const addTaskButton = document.getElementById('add-task');
  const taskList = document.getElementById('task-list');
  const showAllButton = document.getElementById('show-all');
  const showActiveButton = document.getElementById('show-active');
  const showCompletedButton = document.getElementById('show-completed');
  const xpSpan = document.getElementById('xp');
  const levelSpan = document.getElementById('level');
  const currencySpan = document.getElementById('currency');
  const hpSpan = document.getElementById('hp');
  const totalTasksEl = document.getElementById('total-tasks');
  const completedTasksEl = document.getElementById('completed-tasks');
  const activeTasksEl = document.getElementById('active-tasks');
  const toggleThemeButton = document.getElementById('toggle-theme');
  const virtualCurrencyInput = document.getElementById('virtual-currency-input');
  const convertCurrencyBtn = document.getElementById('convert-currency-btn');
  const currencyResult = document.getElementById('currency-result');
  const conversionList = document.getElementById('conversion-list');
  const clearHistoryBtn = document.getElementById('clear-history');
  const savingsGoalInput = document.getElementById('savings-goal');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const currentMonthYear = document.getElementById('current-month-year');
  const calendarDays = document.getElementById('calendar-days');
  const taskModal = document.getElementById('task-modal');
  const modalDate = document.getElementById('modal-date');
  const modalTaskList = document.getElementById('modal-task-list');
  const modalClose = document.querySelector('.planner-task-modal-close');
  const achievementNameInput = document.getElementById('achievement-name');
  const achievementDescInput = document.getElementById('achievement-desc');
  const addAchievementBtn = document.getElementById('add-achievement-btn');

  // Навешиваем обработчики событий только если элементы существуют
  if (addTaskButton) addTaskButton.addEventListener('click', addTask);
  if (newTaskInput) newTaskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
  if (showAllButton) showAllButton.addEventListener('click', () => { filterCompleted = null; renderTasks(); });
  if (showActiveButton) showActiveButton.addEventListener('click', () => { filterCompleted = false; renderTasks(); });
  if (showCompletedButton) showCompletedButton.addEventListener('click', () => { filterCompleted = true; renderTasks(); });
  if (toggleThemeButton) toggleThemeButton.addEventListener('click', toggleTheme);
  if (convertCurrencyBtn) convertCurrencyBtn.addEventListener('click', convertCurrency);
  if (virtualCurrencyInput) virtualCurrencyInput.addEventListener('keypress', e => { if (e.key === 'Enter') convertCurrency(); });
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearConversionHistory);
  if (savingsGoalInput) savingsGoalInput.addEventListener('keypress', e => { if (e.key === 'Enter') setSavingsGoal(); });
  if (savingsGoalInput) savingsGoalInput.addEventListener('change', setSavingsGoal);
  if (prevMonthBtn) prevMonthBtn.addEventListener('click', prevMonth);
  if (nextMonthBtn) nextMonthBtn.addEventListener('click', nextMonth);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (taskModal) taskModal.addEventListener('click', e => { if (e.target === taskModal) closeModal(); });
  if (addAchievementBtn) addAchievementBtn.addEventListener('click', addUserAchievement);
  if (achievementNameInput) achievementNameInput.addEventListener('keypress', e => { if (e.key === 'Enter') addUserAchievement(); });
  if (achievementDescInput) achievementDescInput.addEventListener('keypress', e => { if (e.key === 'Enter') addUserAchievement(); });

  // Первичный рендер
  renderTasks();
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  updateConversionHistory();
  updateGamificationUI();
  renderAchievements();
  updateProgress();
});
*/

window.LifePlanner = (function() {
  // === Все переменные и функции только внутри этого блока ===
  let data = {
        xp: 0,
        level: 1,
        currency: 0,
        hp: 100,
        tasks: [],
        persona: { name: 'Персонаж', age: 28, backstory: 'Исследователь пустошей', traits: 'Трудолюбивый, Оптимист, Нервный', skills: 'Строительство: 8/20\nМедицина: 5/20\nСтрельба: 12/20', equipment: 'Одежда: Пыльник\nОружие: Лазерный пистолет' },
        inventory: Array(18).fill(null), // 6x3 = 18 слотов
        health: [], // Журнал здоровья
        healthStats: [], // RPG характеристики здоровья
        medicalHistory: [], // История операций и процедур
        journal: [] // Журнал событий
    };
  let filterCompleted = null;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const LOCAL_STORAGE_KEY = 'lifeosData';

  function loadData() {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
          data = JSON.parse(savedData);
          // Убедиться, что все необходимые свойства существуют, если это старые данные
          data.xp = data.xp !== undefined ? data.xp : 0;
          data.level = data.level !== undefined ? data.level : 1;
          data.currency = data.currency !== undefined ? data.currency : 0;
          data.hp = data.hp !== undefined ? data.hp : 100;
          data.tasks = data.tasks || [];
          data.persona = data.persona || { name: 'Персонаж', age: 28, backstory: 'Исследователь пустошей', traits: 'Трудолюбивый, Оптимист, Нервный', skills: 'Строительство: 8/20\nМедицина: 5/20\nСтрельба: 12/20', equipment: 'Одежда: Пыльник\nОружие: Лазерный пистолет' };
          data.inventory = data.inventory || Array(18).fill(null);
          data.health = data.health || [];
          data.healthStats = data.healthStats || [];
          data.medicalHistory = data.medicalHistory || [];
          data.journal = data.journal || [];
      }
  }

  function saveData() {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }

  // --- Функции для задач ---
  function saveData() {
    localStorage.setItem('lifeOSData', JSON.stringify(data));
  }

  // Функция для расчета опыта, необходимого для следующего уровня (прогрессивная шкала)
  function getRequiredXPForLevel(level) {
    return Math.floor(level * 75 + (level - 1) * 25); // Прогрессивная шкала: уровень 1 = 75 XP, уровень 2 = 125 XP, уровень 3 = 175 XP и т.д.
  }

  // Функция для расчета XP в зависимости от типа и приоритета задачи
  function calculateTaskXP(task) {
    let baseXP = 50; // Базовый опыт
    
    // Модификатор приоритета
    switch (task.priority) {
      case 'low': baseXP *= 0.8; break;
      case 'medium': baseXP *= 1.0; break;
      case 'high': baseXP *= 1.5; break;
      case 'boss': baseXP *= 2.0; break;
    }
    
    // Модификатор важности и срочности
    if (task.importance === 'important' && task.urgency === 'urgent') {
      baseXP *= 1.3; // Бонус за важные и срочные задачи
    } else if (task.importance === 'important') {
      baseXP *= 1.1; // Небольшой бонус за важные задачи
    } else if (task.urgency === 'urgent') {
      baseXP *= 1.1; // Небольшой бонус за срочные задачи
    }
    
    // Проверяем дедлайн
    if (task.dueDate) {
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const timeDiff = dueDate - now;
      const daysUntilDue = timeDiff / (1000 * 60 * 60 * 24);
      
      if (daysUntilDue < 0) {
        baseXP *= 0.7; // Штраф за просроченные задачи
      } else if (daysUntilDue <= 1) {
        baseXP *= 1.2; // Бонус за выполнение в последний день
      }
    }
    
    return Math.floor(baseXP);
  }

  // Добавляем функцию addXP как метод LifePlanner
  function addXP(amount, task = null) {
    // Если передана задача, рассчитываем опыт автоматически
    if (task && amount === undefined) {
      amount = calculateTaskXP(task);
    }
    
    console.log(`addXP: Добавляем ${amount} XP. Текущий XP: ${data.xp}, Уровень: ${data.level}`);

    data.xp = (data.xp || 0) + amount;

    let xpRequiredForCurrentLevel = getRequiredXPForLevel(data.level);
    let leveledUp = false;

    // Если опыт превышает требуемый для текущего уровня, повышаем уровень
    while (data.xp >= xpRequiredForCurrentLevel) {
      data.xp -= xpRequiredForCurrentLevel;
      data.level = (data.level || 1) + 1;
      leveledUp = true;
      console.log(`addXP: Уровень повышен! Новый уровень: ${data.level}, Остаток XP: ${data.xp}`);
      // Пересчитываем XP для следующего уровня, так как требование изменилось
      xpRequiredForCurrentLevel = getRequiredXPForLevel(data.level);
    }
    
    // Показываем уведомление о получении опыта
    showXPNotification(amount, leveledUp);
    
    saveData();
    updateGamificationUI(); // Обновляем глобальный UI
    console.log(`addXP: После сохранения и обновления UI. Текущий XP: ${data.xp}, Уровень: ${data.level}`);
  }
  
  // Функция показа уведомления о получении опыта
  function showXPNotification(amount, leveledUp = false) {
    const notification = document.createElement('div');
    notification.className = 'xp-notification';
    notification.innerHTML = `
      <div class="xp-gain">+${amount} XP</div>
      ${leveledUp ? '<div class="level-up">УРОВЕНЬ ПОВЫШЕН!</div>' : ''}
    `;
    
    // Стили для уведомления
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: linear-gradient(135deg, #D4AF37, #FFD700);
      color: #000;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.6);
      z-index: 10000;
      font-weight: bold;
      text-align: center;
      border: 2px solid #B8860B;
      animation: xpSlideIn 0.5s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
      notification.style.animation = 'xpSlideOut 0.5s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);
  }

  function addTask() {
    const newTaskInput = document.getElementById('new-task');
    const importanceSel = document.getElementById('importance');
    const urgencySel = document.getElementById('urgency');
    const prioritySelect = document.getElementById('priority');
    const dueDateInput = document.getElementById('due-date');
    if (!newTaskInput || !importanceSel || !urgencySel || !prioritySelect || !dueDateInput) return;
    const text = newTaskInput.value.trim();
    if (!text) {
      alert('Введите текст задачи!');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      importance: importanceSel.value,
      urgency: urgencySel.value,
      priority: prioritySelect.value,
      dueDate: dueDateInput.value || null,
      subTasks: [],
      collapsed: true
    };
    data.tasks.push(newTask);
    saveData();
    newTaskInput.value = '';
    importanceSel.value = 'important';
    urgencySel.value = 'urgent';
    prioritySelect.value = 'medium';
    dueDateInput.value = '';
    renderTasks();
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
  }
  function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    taskList.innerHTML = '';
    let filtered = data.tasks;
    if (filterCompleted === true) filtered = data.tasks.filter(t => t.completed);
    else if (filterCompleted === false) filtered = data.tasks.filter(t => !t.completed);
    filtered.sort((a, b) => {
      if (a.priority === 'boss' && b.priority !== 'boss') return -1;
      if (b.priority === 'boss' && a.priority !== 'boss') return 1;
      if (a.priority === 'boss' && b.priority === 'boss') {
        const aSubTasksCount = a.subTasks ? a.subTasks.length : 0;
        const bSubTasksCount = b.subTasks ? b.subTasks.length : 0;
        return bSubTasksCount - aSubTasksCount;
      }
      if (a.importance === 'important' && b.importance !== 'important') return -1;
      if (b.importance === 'important' && a.importance !== 'important') return 1;
      if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
      if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-list-item';
      if (task.completed) li.classList.add('completed');
      const contentDiv = document.createElement('div');
      contentDiv.className = 'planner-task-content';
      const leftBlock = document.createElement('div');
      leftBlock.className = 'planner-task-left';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        task.completed = !task.completed;
        if (task.completed) {
          addXP(undefined, task); // Передаем объект задачи для расчета XP
        }
        saveData();
        renderTasks();
      });
      leftBlock.appendChild(checkbox);
      if (task.subTasks && task.subTasks.length > 0) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'planner-toggle-subtasks-btn';
        toggleBtn.innerHTML = task.collapsed ? '<i class="fas fa-chevron-right"></i>' : '<i class="fas fa-chevron-down"></i>';
        toggleBtn.addEventListener('click', () => {
          task.collapsed = !task.collapsed;
          saveData();
          renderTasks();
        });
        leftBlock.appendChild(toggleBtn);
      }
      const textSpan = document.createElement('span');
      textSpan.textContent = task.text;
      if (task.completed) textSpan.style.textDecoration = 'line-through';
      leftBlock.appendChild(textSpan);
      // ... (добавить бейджи важности, срочности, приоритета, матрицу)
      contentDiv.appendChild(leftBlock);
      // ... (добавить правый блок с кнопками)
      li.appendChild(contentDiv);
      // ... (добавить подзадачи)
      taskList.appendChild(li);
      setTimeout(() => li.classList.add('show'), 10);
    });
    updateGamificationUI();
    updateStats();
  }
  
  // Функция для обновления статистики
  function updateStats() {
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const activeTasksEl = document.getElementById('active-tasks');
    
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter(t => t.completed).length;
    const activeTasks = totalTasks - completedTasks;
    
    if (totalTasksEl) totalTasksEl.textContent = totalTasks;
    if (completedTasksEl) completedTasksEl.textContent = completedTasks;
    if (activeTasksEl) activeTasksEl.textContent = activeTasks;
  }
  // ... (остальные функции: addSubTask, renderSubTasks, generateCalendar, addAchievement, валюта и т.д.)

  function init() {
    loadData(); // Загружаем данные при инициализации LifePlanner
    // Навешиваем обработчики событий только после загрузки DOM
    const addTaskButton = document.getElementById('add-task');
    const newTaskInput = document.getElementById('new-task');
    const showAllButton = document.getElementById('show-all');
    const showActiveButton = document.getElementById('show-active');
    const showCompletedButton = document.getElementById('show-completed');
    if (addTaskButton) addTaskButton.addEventListener('click', addTask);
    if (newTaskInput) newTaskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
    if (showAllButton) showAllButton.addEventListener('click', () => { filterCompleted = null; renderTasks(); });
    if (showActiveButton) showActiveButton.addEventListener('click', () => { filterCompleted = false; renderTasks(); });
    if (showCompletedButton) showCompletedButton.addEventListener('click', () => { filterCompleted = true; renderTasks(); });
    // ... (остальные обработчики)
    renderTasks();
    // ... (остальные первичные рендеры)
  }

  function toggleCompletePlanner(taskId) {
    // Удаляем или закомментируем содержимое этой функции, так как логика завершения задачи
    // и начисления опыта теперь управляется напрямую через обработчик чекбокса в renderTasks.
    // Если эта функция вызывается откуда-то еще, нужно пересмотреть ее использование.
    // Пока оставлю пустой или с предупреждением.
    console.warn('toggleCompletePlanner был вызван, но его логика перенесена в обработчик чекбокса. Проверьте вызовы.');
    // Если нужно, чтобы эта функция все же работала, ее нужно переписать
    // так, чтобы она вызывала addXP и saveData, но это может быть избыточно.
  }

  function deleteTaskPlanner(taskId) {
    // ... существующий код ...
  }

  // Экспортируем только нужные методы
  return {
    init,
    addTask,
    renderTasks,
    toggleCompletePlanner, // Оставляем для совместимости, но ее логика теперь пуста/предупреждает
    deleteTaskPlanner,
    getData: function() { return data; }, // Экспортируем данные
    saveData, // Экспортируем функцию сохранения данных
    addXP, // Экспортируем addXP
    getRequiredXPForLevel // Экспортируем getRequiredXPForLevel
    // ... (остальные публичные методы)
  };
})();

document.addEventListener('DOMContentLoaded', function() {
    // Убираем localStorage.clear() чтобы данные сохранялись между сессиями
    console.log('Инициализация LifeOS...');
    
    loadPersonaData();
    loadInventory();
    renderHealthStats();
    renderHealthLog();
    if (window.LifePlanner && typeof window.LifePlanner.init === 'function') {
        window.LifePlanner.init();
        console.log('LifePlanner инициализирован');
    }
    
    // Проверяем данные после инициализации
    const data = window.LifePlanner.getData();
    console.log('Данные LifePlanner после инициализации:', data);
    console.log('XP:', data.xp, 'Уровень:', data.level);
    
    // Убираем тестовое добавление XP, так как теперь данные загружаются
    // if (data.xp === 0) {
    //     console.log('Добавляем тестовый XP для демонстрации...');
    //     window.LifePlanner.addXP(25); // Добавляем 25 XP для тестирования
    // }
    
    updateGamificationUI(); // Теперь updateGamificationUI будет использовать LifePlanner.getData()
    
    // Инициализируем RPG обзор
    updateRPGOverview();
    
    // Обновляем RPG обзор при переключении на вкладку "Обзор"
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const summaryTab = document.getElementById('summary');
                if (summaryTab && summaryTab.classList.contains('active')) {
                    updateRPGOverview();
                }
            }
        });
    });
    
    const summaryTab = document.getElementById('summary');
    if (summaryTab) {
        observer.observe(summaryTab, { attributes: true });
    }
});

// Удалить/закомментировать все старые функции и переменные для задач LifeOS
// ...

// === Глобальная функция для переключения вкладок ===
function openTab(event, tabName) {
  // Скрыть все .content
  document.querySelectorAll('.content').forEach(el => el.classList.remove('active'));
  // Убрать active у всех .tab
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  // Показать нужную вкладку
  const tabContent = document.getElementById(tabName);
  if (tabContent) tabContent.classList.add('active');
  // Сделать активной текущую кнопку
  if (event && event.currentTarget) event.currentTarget.classList.add('active');

  // Вызов функций рендеринга в зависимости от открытой вкладки
  switch (tabName) {
      case 'persona':
          loadPersonaData();
          break;
      case 'items':
          loadInventory();
          break;
      case 'health_detailed':
          renderHealthStats();
          renderHealthLog();
          break;
      // Добавьте сюда другие вкладки и соответствующие функции рендеринга
  }
}
window.openTab = openTab;

// Убедиться, что все функции, экспортируемые в window, определены:
function openHealthLogModal() {
  document.getElementById('healthLogModal').style.display = 'flex';
}
function closeHealthLogModal() {
  document.getElementById('healthLogModal').style.display = 'none';
}
function openScheduleOperationModal() {
  document.getElementById('scheduleOperationModal').style.display = 'flex';
}
function closeScheduleOperationModal() {
  document.getElementById('scheduleOperationModal').style.display = 'none';
  // Очистка формы при закрытии модального окна
  document.getElementById('operationDate').value = '';
  document.getElementById('operationName').value = '';
  document.getElementById('operationStatus').value = 'Запланировано';
  document.getElementById('operationNotes').value = '';
}
function saveOperationEntry() {
  const date = document.getElementById('operationDate').value;
  const name = document.getElementById('operationName').value.trim();
  const status = document.getElementById('operationStatus').value;
  const notes = document.getElementById('operationNotes').value.trim();

  if (!date || !name) {
      alert('Пожалуйста, заполните дату и название процедуры/операции.');
      return;
  }

  const newEntry = {
      date: date,
      text: name,
      status: status,
      type: 'Операция', // По умолчанию для этого модального окна
      notes: notes
  };

  LifePlanner.getData().medicalHistory.push(newEntry);
  LifePlanner.saveData();
  renderMedicalHistory();
  closeScheduleOperationModal();
}
function filterHistory(type) {
  alert('Фильтрация истории по: ' + type + ' (заглушка)');
}
function addHealthEntry() {
  const sleepInput = document.getElementById('sleep');
  const waterInput = document.getElementById('water');
  const healthNoteInput = document.getElementById('healthNote');

  const sleep = parseFloat(sleepInput.value);
  const water = parseFloat(waterInput.value);
  const healthNote = healthNoteInput.value.trim();

  if (isNaN(sleep) || isNaN(water) || sleep < 0 || water < 0) {
      alert('Пожалуйста, введите корректные значения для сна и воды.');
      return;
  }

  const newEntry = {
      date: new Date().toISOString().split('T')[0], // Сегодняшняя дата в формате YYYY-MM-DD
      sleep: sleep,
      water: water,
      note: healthNote
  };

  LifePlanner.getData().health.push(newEntry);
  LifePlanner.saveData();
  renderHealthLog();
  closeHealthLogModal();

  // Очистка формы
  sleepInput.value = '';
  waterInput.value = '';
  healthNoteInput.value = '';
}
function saveHealthEntry() {
  alert('Сохранить запись о здоровье (заглушка)');
}
function filterSocial(type) {
  alert('Фильтрация соц. по: ' + type + ' (заглушка)');
}
function interactSocial(name) {
  alert('Взаимодействие с: ' + name + ' (заглушка)');
}
function openWorkSubTab(event, subTabName) {
    // Скрыть все .work-sub-content
    document.querySelectorAll('.work-sub-content').forEach(el => el.classList.remove('active'));
    // Убрать active у всех .work-tab-button
    document.querySelectorAll('.work-tab-button').forEach(el => el.classList.remove('active'));

    // Показать нужную подвкладку
    const subTabContent = document.getElementById(subTabName);
    if (subTabContent) subTabContent.classList.add('active');

    // Сделать активной текущую кнопку
    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    // Вызов рендеринга при переключении на подвкладку
    switch(subTabName) {
        case 'work_tasks':
            renderWorkTasks();
            break;
        case 'work_schedule':
            renderDailySchedule();
            break;
        case 'work_priorities':
            renderWorkPriorities();
            break;
    }
}

function renderWorkTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.innerHTML = '';
    const tasks = LifePlanner.getData().tasks; // Используем задачи из LifePlanner

    if (tasks.length === 0) {
        taskList.innerHTML = '<p class="placeholder-text">Задачи не добавлены.</p>';
        return;
    }

    // Отображаем только основные задачи (без подзадач, так как они рендерятся в planner.js)
    tasks.filter(task => !task.isSubTask).forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-list-item';
        li.innerHTML = `
            ${task.text} (Приоритет: ${task.priority})
            <button onclick="window.setTaskPriority('${task.id}', 'up')" class="task-priority-button task-priority-up-button">↑</button>
            <button onclick="window.setTaskPriority('${task.id}', 'down')" class="task-priority-button task-priority-down-button">↓</button>
            <button onclick="LifePlanner.deleteTask('${task.id}')" class="task-priority-button task-delete-button">Удалить</button>
        `;
        taskList.appendChild(li);
    });
}

function setTaskPriority(taskId, direction) {
    const tasks = LifePlanner.getData().tasks;
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    let currentPriority = 0;
    switch (task.priority) {
        case 'low': currentPriority = 0; break;
        case 'medium': currentPriority = 1; break;
        case 'high': currentPriority = 2; break;
        case 'boss': currentPriority = 3; break;
    }

    if (direction === 'up') {
        currentPriority = Math.min(currentPriority + 1, 3); // Макс приоритет 3 (boss)
    } else if (direction === 'down') {
        currentPriority = Math.max(currentPriority - 1, 0); // Мин приоритет 0 (low)
    }

    switch (currentPriority) {
        case 0: task.priority = 'low'; break;
        case 1: task.priority = 'medium'; break;
        case 2: task.priority = 'high'; break;
        case 3: task.priority = 'boss'; break;
    }

    LifePlanner.saveData();
    renderWorkTasks(); // Перерендеринг для обновления приоритетов
    LifePlanner.renderTasks(); // Обновить задачи в планировщике, если они используют приоритеты
}

function openAddTaskModal() {
    // Вместо отдельного модального окна, можно использовать существующий в planner.js
    // Или, если это модальное окно должно быть другим, его нужно создать в index.html
    // и реализовать его открытие/закрытие.
    alert('Используйте вкладку "Планировщик" для добавления задач, или реализуйте отдельное модальное окно здесь.');
    // Пример открытия модального окна планировщика (если оно глобально доступно):
    // document.getElementById('task-modal').style.display = 'flex';
}

function toggleWorkTabTask(taskId) {
    // Эта функция может быть использована для переключения статуса задачи
    // Но лучше использовать LifePlanner.toggleCompletePlanner, если задачи синхронизированы
    const tasks = LifePlanner.getData().tasks;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        LifePlanner.saveData();
        renderWorkTasks();
        LifePlanner.renderTasks(); // Обновить задачи в планировщике
    } else {
        alert('Задача не найдена.');
    }
}

function renderDailySchedule() {
    const scheduleContainer = document.getElementById('dailyScheduleContainer');
    if (!scheduleContainer) return;

    // Очищаем текущее расписание
    scheduleContainer.innerHTML = '';

    for(let i=0; i<24; i++){
        let hourBlock = document.createElement('div');
        hourBlock.className = 'schedule-hour-block';
        hourBlock.title = i + ':00 - ' + (i+1) + ':00 - Свободно';
        hourBlock.textContent = i.toString().padStart(2, '0');
        hourBlock.onclick = () => alert('Назначить задачу на ' + i + ':00');
        scheduleContainer.appendChild(hourBlock);
    }

    // Здесь можно добавить логику для загрузки и отображения реальных событий расписания
    // Например, из LifePlanner.getData().schedule
    // Временно оставим примеры назначения цветов
    if(scheduleContainer.children[8]) scheduleContainer.children[8].style.background = '#4A5A6A'; // Work
    if(scheduleContainer.children[9]) scheduleContainer.children[9].style.background = '#4A5A6A';
    if(scheduleContainer.children[12]) scheduleContainer.children[12].style.background = '#5A6A4A'; // Recreation
    if(scheduleContainer.children[22]) scheduleContainer.children[22].style.background = '#202020'; // Sleep
    if(scheduleContainer.children[23]) scheduleContainer.children[23].style.background = '#202020';
}

function renderWorkPriorities() {
    // В index.html сейчас статичный список. Здесь можно реализовать
    // динамическое отображение и редактирование приоритетов
    // из LifePlanner.getData().workPriorities (или создать новое поле в data)
    console.log('Рендеринг приоритетов работы (функционал будет расширен)');
    // Для примера, можно загрузить и отобразить их:
    // const prioritiesData = LifePlanner.getData().workPriorities || {};
    // ...
}

function renderJournalEvents() {
    const journalEntryList = document.getElementById('journalEntryList');
    if (!journalEntryList) return;

    journalEntryList.innerHTML = '';
    const journalEvents = LifePlanner.getData().journalEvents || []; // Добавим новое поле в data

    if (journalEvents.length === 0) {
        journalEntryList.innerHTML = '<li class="placeholder-text">Записей в журнале нет.</li>';
        return;
    }

    // Сортировка по дате (от новых к старым)
    const sortedEvents = [...journalEvents].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedEvents.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'journal-entry-item';
        li.innerHTML = `
            <strong>${entry.time}:</strong> ${entry.text} <span class="journal-event-type-color" style="color: ${getJournalEventTypeColor(entry.type)};">[${entry.type}]</span>
            <button onclick="window.editJournalEvent(${index})" class="journal-edit-button">Редактировать</button>
            <button onclick="window.deleteJournalEvent(${index})" class="journal-delete-button">Удалить</button>
        `;
        journalEntryList.appendChild(li);
    });
}

function getJournalEventTypeColor(type) {
    switch (type) {
        case 'combat': return 'red';
        case 'social': return 'blue';
        case 'work': return 'green';
        case 'health': return 'orange';
        case 'misc': return 'gray';
        default: return 'gray';
    }
}

function filterJournalEvents() {
    const dateFilter = document.getElementById('journalDateFilter').value;
    const typeFilter = document.getElementById('journalTypeFilter').value;
    const journalEntryList = document.getElementById('journalEntryList');
    if (!journalEntryList) return;

    journalEntryList.innerHTML = '';
    const allEvents = LifePlanner.getData().journalEvents || [];

    const filteredEvents = allEvents.filter(entry => {
        const matchesDate = dateFilter ? entry.date === dateFilter : true;
        const matchesType = typeFilter === 'all' ? true : entry.type === typeFilter;
        return matchesDate && matchesType;
    });

    if (filteredEvents.length === 0) {
        journalEntryList.innerHTML = '<li class="placeholder-text">Нет записей, соответствующих фильтру.</li>';
        return;
    }

    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

    sortedEvents.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'journal-entry-item';
        li.innerHTML = `
            <strong>${entry.time}:</strong> ${entry.text} <span class="journal-event-type-color" style="color: ${getJournalEventTypeColor(entry.type)};">[${entry.type}]</span>
            <button onclick="window.editJournalEvent(${index})" class="journal-edit-button">Редактировать</button>
            <button onclick="window.deleteJournalEvent(${index})" class="journal-delete-button">Удалить</button>
        `;
        journalEntryList.appendChild(li);
    });
}

function editJournalEvent(index) {
    alert('Редактировать запись журнала (заглушка)'); // TODO: Реализовать редактирование
}

function deleteJournalEvent(index) {
    if (confirm('Вы уверены, что хотите удалить эту запись журнала?')) {
        LifePlanner.getData().journalEvents.splice(index, 1);
        LifePlanner.saveData();
        renderJournalEvents();
    }
}

function renderMedicalHistory() {
    const medicalHistoryList = document.getElementById('medicalHistoryList');
    if (!medicalHistoryList) return;

    medicalHistoryList.innerHTML = '';
    const medicalHistory = LifePlanner.getData().medicalHistory || []; // Добавим новое поле в data

    if (medicalHistory.length === 0) {
        medicalHistoryList.innerHTML = '<li class="placeholder-text">Записей в истории нет.</li>';
        return;
    }

    const sortedHistory = [...medicalHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedHistory.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'medical-history-item';
        li.innerHTML = `
            <strong>Дата: ${entry.date}</strong> - ${entry.text}. Статус: ${entry.status}. <span class="medical-history-type-color" style="color: ${getMedicalHistoryTypeColor(entry.type)};">[${entry.type}]</span>
            <button onclick="window.editMedicalHistoryEntry(${index})" class="medical-history-edit-button">Редактировать</button>
            <button onclick="window.deleteMedicalHistoryEntry(${index})" class="medical-history-delete-button">Удалить</button>
        `;
        medicalHistoryList.appendChild(li);
    });
}

function getMedicalHistoryTypeColor(type) {
    switch (type) {
        case 'Операция': return 'purple';
        case 'Лечение': return 'green';
        case 'Болезнь': return 'orange';
        case 'Травма': return 'red';
        default: return 'gray';
    }
}

function filterHistory(typeFilter) {
    const medicalHistoryList = document.getElementById('medicalHistoryList');
    if (!medicalHistoryList) return;

    medicalHistoryList.innerHTML = '';
    const allHistory = LifePlanner.getData().medicalHistory || [];

    const filteredHistory = allHistory.filter(entry => {
        return typeFilter === 'all' ? true : entry.type === typeFilter;
    });

    if (filteredHistory.length === 0) {
        medicalHistoryList.innerHTML = '<li class="placeholder-text">Нет записей, соответствующих фильтру.</li>';
        return;
    }

    const sortedHistory = [...filteredHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedHistory.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'medical-history-item';
        li.innerHTML = `
            <strong>Дата: ${entry.date}</strong> - ${entry.text}. Статус: ${entry.status}. <span class="medical-history-type-color" style="color: ${getMedicalHistoryTypeColor(entry.type)};">[${entry.type}]</span>
            <button onclick="window.editMedicalHistoryEntry(${index})" class="medical-history-edit-button">Редактировать</button>
            <button onclick="window.deleteMedicalHistoryEntry(${index})" class="medical-history-delete-button">Удалить</button>
        `;
        medicalHistoryList.appendChild(li);
    });
}

function editMedicalHistoryEntry(index) {
    alert('Редактировать запись истории болезни (заглушка)'); // TODO: Реализовать редактирование
}

function deleteMedicalHistoryEntry(index) {
    if (confirm('Вы уверены, что хотите удалить эту запись из истории болезней?')) {
        LifePlanner.getData().medicalHistory.splice(index, 1);
        LifePlanner.saveData();
        renderMedicalHistory();
    }
}

// === Геймификация: обновление UI ===
function updateGamificationUI() {
  if (!window.LifePlanner || typeof window.LifePlanner.getData !== 'function') {
    console.warn('LifePlanner или LifePlanner.getData() не доступны. Невозможно обновить UI геймификации.');
    return;
  }
  const data = window.LifePlanner.getData();
  const xp = data.xp || 0;
  const level = data.level || 1;
  // Используем функцию из LifePlanner для получения XP для текущего уровня
  const xpForNextLevel = window.LifePlanner.getRequiredXPForLevel ? window.LifePlanner.getRequiredXPForLevel(level) : 100;

  console.log(`updateGamificationUI: Текущий XP: ${xp}, Уровень: ${level}, XP для текущего уровня: ${xpForNextLevel}`);

  // Обновляем текстовые значения (во всех местах, где есть #level и #xp)
  document.querySelectorAll('#level').forEach(el => el.textContent = level);
  document.querySelectorAll('#xp').forEach(el => el.textContent = `${xp}/${xpForNextLevel}`);

  // ИСПРАВЛЕННЫЙ ПРОГРЕСС-БАР
  const percent = Math.min(100, Math.round((xp / xpForNextLevel) * 100));
  const xpProgress = document.getElementById('xpProgress');
  
  console.log(`Поиск элемента xpProgress...`);
  if (xpProgress) {
    console.log(`✅ Элемент xpProgress найден!`);
    console.log(`📊 Устанавливаем ширину: ${percent}% (XP: ${xp}/${xpForNextLevel})`);
    
    // ПРИНУДИТЕЛЬНО устанавливаем ширину
    xpProgress.style.width = percent + '%';
    xpProgress.style.transition = 'width 0.5s ease';
    
    // ПРИНУДИТЕЛЬНО устанавливаем базовые стили ВСЕГДА
    xpProgress.style.background = 'linear-gradient(135deg, #D4AF37 0%, #FFD700 35%, #FFA500 70%, #FF8C00 100%)';
    xpProgress.style.height = '100%';
    xpProgress.style.borderRadius = '6px';
    xpProgress.style.display = 'block';
    xpProgress.style.position = 'relative';
    xpProgress.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.4)';
    
    // Принудительно перерисовываем элемент
    xpProgress.offsetHeight; // trigger reflow
    
    // Проверяем результат
    const finalWidth = xpProgress.style.width;
    console.log(`🎯 Финальная ширина прогресс-бара: ${finalWidth}`);
    
    // Если процент больше 0, но ширина все еще 0%, принудительно устанавливаем минимум
    if (percent > 0 && (finalWidth === '0%' || finalWidth === '')) {
      console.log('⚠️ Принудительно устанавливаем минимальную ширину 2%');
      xpProgress.style.width = '2%';
    }
    
  } else {
    console.error('❌ Элемент xpProgress НЕ НАЙДЕН!');
    // Попробуем найти все элементы с похожими ID
    const allElements = document.querySelectorAll('[id*="xp"], [id*="Progress"]');
    console.log('🔍 Найденные элементы с xp/Progress:', allElements);
  }
  
  // Создаем сегменты для XP бара
  createXPSegments(xpForNextLevel);
  
  // Обновляем подсказку
  updateXPTooltip(xp, xpForNextLevel, level);
}

// Функция для создания сегментов XP бара
function createXPSegments(maxXP) {
  const segmentsContainer = document.getElementById('xpSegments');
  if (!segmentsContainer) {
    console.warn('Контейнер сегментов XP не найден');
    return;
  }
  
  console.log('Создаем сегменты XP бара...');
  
  // Очищаем существующие сегменты
  segmentsContainer.innerHTML = '';
  
  // Создаем 10 сегментов
  const segmentCount = 10;
  for (let i = 1; i < segmentCount; i++) {
    const segment = document.createElement('div');
    segment.className = 'xp-segment';
    const position = (i / segmentCount) * 100;
    segment.style.left = `${position}%`;
    segmentsContainer.appendChild(segment);
    console.log(`Сегмент ${i} создан на позиции ${position}%`);
  }
  
  console.log(`Создано ${segmentCount - 1} сегментов XP`);
}

// Функция для обновления подсказки XP системы
function updateXPTooltip(currentXP, requiredXP, level) {
  const tooltipCurrentXP = document.getElementById('tooltipCurrentXP');
  const tooltipRequiredXP = document.getElementById('tooltipRequiredXP');
  const tooltipRemainingXP = document.getElementById('tooltipRemainingXP');
  
  if (tooltipCurrentXP) tooltipCurrentXP.textContent = currentXP;
  if (tooltipRequiredXP) tooltipRequiredXP.textContent = requiredXP;
  if (tooltipRemainingXP) tooltipRemainingXP.textContent = requiredXP - currentXP;
}

// Обновляем список экспортируемых функций, чтобы включить новые или измененные
window.openWorkSubTab = openWorkSubTab;
window.setTaskPriority = setTaskPriority;
window.openAddTaskModal = openAddTaskModal;
window.toggleWorkTabTask = toggleWorkTabTask;

window.renderJournalEvents = renderJournalEvents;
window.filterJournalEvents = filterJournalEvents;
window.editJournalEvent = editJournalEvent;
window.deleteJournalEvent = deleteJournalEvent;

window.renderMedicalHistory = renderMedicalHistory;
window.filterHistory = filterHistory;
window.editMedicalHistoryEntry = editMedicalHistoryEntry;
window.deleteMedicalHistoryEntry = deleteMedicalHistoryEntry;

// RPG Overview функции
window.updateRPGOverview = updateRPGOverview;
window.renderRPGQuickInventory = renderRPGQuickInventory;
window.updateRPGStatusBars = updateRPGStatusBars;
window.updateRPGCurrentMission = updateRPGCurrentMission;
window.updateRPGNotifications = updateRPGNotifications;

// === RPG OVERVIEW ФУНКЦИИ ===
function updateRPGOverview() {
    updateRPGCharacterInfo();
    updateRPGXPBar();
    updateRPGQuickStats();
    updateRPGStatusBars();
    updateRPGCurrentMission();
    updateRPGNotifications();
    renderRPGQuickInventory();
    renderRPGRecentAchievements();
}

function updateRPGCharacterInfo() {
    const personaData = LifePlanner.getData().persona;
    const rpgCharacterName = document.getElementById('rpgCharacterName');
    const rpgAvatar = document.getElementById('rpgAvatar');
    
    if (rpgCharacterName) {
        rpgCharacterName.textContent = personaData.name || 'Персонаж';
    }
    
    if (rpgAvatar && personaData.avatar) {
        rpgAvatar.style.backgroundImage = `url(${personaData.avatar})`;
        rpgAvatar.innerHTML = '';
    }
}

function updateRPGXPBar() {
    const data = LifePlanner.getData();
    const currentXP = data.xp || 0;
    const currentLevel = data.level || 1;
    const requiredXP = LifePlanner.getRequiredXPForLevel ? LifePlanner.getRequiredXPForLevel(currentLevel) : 100;
    
    const rpgLevel = document.getElementById('rpgLevel');
    const rpgXpFill = document.getElementById('rpgXpFill');
    const rpgXpText = document.getElementById('rpgXpText');
    
    if (rpgLevel) rpgLevel.textContent = currentLevel;
    if (rpgXpText) rpgXpText.textContent = `${currentXP} / ${requiredXP}`;
    
    if (rpgXpFill) {
        const percentage = Math.min((currentXP / requiredXP) * 100, 100);
        rpgXpFill.style.width = `${percentage}%`;
    }
}

function updateRPGQuickStats() {
    const data = LifePlanner.getData();
    const tasks = data.tasks || [];
    const completedTasks = tasks.filter(t => t.completed).length;
    
    const rpgHealth = document.getElementById('rpgHealth');
    const rpgCurrency = document.getElementById('rpgCurrency');
    const rpgTasksCount = document.getElementById('rpgTasksCount');
    
    if (rpgHealth) rpgHealth.textContent = data.hp || 100;
    if (rpgCurrency) rpgCurrency.textContent = data.currency || 0;
    if (rpgTasksCount) rpgTasksCount.textContent = `${completedTasks}/${tasks.length}`;
}

function updateRPGStatusBars() {
    // Обновляем статус-бары потребностей
    const statusBars = [
        { id: 'rpgHunger', value: 70, className: 'hunger' },
        { id: 'rpgRest', value: 80, className: 'rest' },
        { id: 'rpgRecreation', value: 60, className: 'recreation' },
        { id: 'rpgComfort', value: 75, className: 'comfort' }
    ];
    
    statusBars.forEach(bar => {
        const element = document.getElementById(bar.id);
        if (element) {
            element.style.width = `${bar.value}%`;
            // Обновляем текст процента рядом с баром
            const statusValue = element.parentElement.parentElement.querySelector('.rpg-status-value');
            if (statusValue) {
                statusValue.textContent = `${bar.value}%`;
            }
        }
    });
}

function updateRPGCurrentMission() {
    const data = LifePlanner.getData();
    const tasks = data.tasks || [];
    const activeTasks = tasks.filter(t => !t.completed);
    
    const rpgCurrentMission = document.getElementById('rpgCurrentMission');
    if (!rpgCurrentMission) return;
    
    if (activeTasks.length === 0) {
        rpgCurrentMission.innerHTML = `
            <div class="rpg-mission-title">Нет активных миссий</div>
            <div class="rpg-mission-progress">
                <div class="rpg-mission-bar">
                    <div class="rpg-mission-fill" style="width: 100%"></div>
                </div>
            </div>
        `;
        return;
    }
    
    // Сортируем задачи по приоритету и срочности
    activeTasks.sort((a, b) => {
        if (a.priority === 'boss' && b.priority !== 'boss') return -1;
        if (b.priority === 'boss' && a.priority !== 'boss') return 1;
        if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
        if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
        if (a.importance === 'important' && b.importance !== 'important') return -1;
        if (b.importance === 'important' && a.importance !== 'important') return 1;
        return 0;
    });
    
    const currentTask = activeTasks[0];
    const progress = tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;
    
    rpgCurrentMission.innerHTML = `
        <div class="rpg-mission-title">${currentTask.text}</div>
        <div class="rpg-mission-progress">
            <div class="rpg-mission-bar">
                <div class="rpg-mission-fill" style="width: ${progress}%"></div>
            </div>
        </div>
    `;
}

function updateRPGNotifications() {
    const data = LifePlanner.getData();
    const tasks = data.tasks || [];
    const rpgNotifications = document.getElementById('rpgNotifications');
    
    if (!rpgNotifications) return;
    
    let notifications = [];
    
    // Проверяем просроченные задачи
    const now = new Date();
    const overdueTasks = tasks.filter(task => {
        if (!task.dueDate || task.completed) return false;
        return new Date(task.dueDate) < now;
    });
    
    if (overdueTasks.length > 0) {
        notifications.push({
            type: 'error',
            icon: 'fas fa-exclamation-triangle',
            text: `Просрочено задач: ${overdueTasks.length}`
        });
    }
    
    // Проверяем задачи на сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayTasks = tasks.filter(task => {
        if (!task.dueDate || task.completed) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate >= today && taskDate <= todayEnd;
    });
    
    if (todayTasks.length > 0) {
        notifications.push({
            type: 'warning',
            icon: 'fas fa-clock',
            text: `Задач на сегодня: ${todayTasks.length}`
        });
    }
    
    // Если нет важных уведомлений, показываем информационное
    if (notifications.length === 0) {
        notifications.push({
            type: 'info',
            icon: 'fas fa-info-circle',
            text: 'Система готова к работе'
        });
    }
    
    // Рендерим уведомления
    rpgNotifications.innerHTML = notifications.map(notif => `
        <div class="rpg-notification-item ${notif.type}">
            <i class="${notif.icon}"></i>
            <span>${notif.text}</span>
        </div>
    `).join('');
}

function renderRPGQuickInventory() {
    const inventoryItems = LifePlanner.getData().inventoryItems || [];
    const rpgQuickInventory = document.getElementById('rpgQuickInventory');
    
    if (!rpgQuickInventory) return;
    
    rpgQuickInventory.innerHTML = '';
    
    // Показываем первые 6 слотов инвентаря
    for (let i = 0; i < 6; i++) {
        const slot = document.createElement('div');
        slot.className = 'rpg-inventory-slot';
        
        const item = inventoryItems.find(item => item.slot === i);
        if (item) {
            slot.classList.add('filled');
            slot.textContent = item.name.substring(0, 6) + (item.name.length > 6 ? '...' : '');
            slot.title = `${item.name} (x${item.quantity})`;
        } else {
            slot.textContent = '—';
            slot.title = 'Пустой слот';
        }
        
        rpgQuickInventory.appendChild(slot);
    }
}

function renderRPGRecentAchievements() {
    const achievements = LifePlanner.getData().achievements || [];
    const rpgRecentAchievements = document.getElementById('rpgRecentAchievements');
    
    if (!rpgRecentAchievements) return;
    
    rpgRecentAchievements.innerHTML = '';
    
    // Показываем последние 3 достижения
    const recentAchievements = achievements.slice(-3);
    
    if (recentAchievements.length === 0) {
        rpgRecentAchievements.innerHTML = `
            <div class="rpg-achievement-item">
                <i class="fas fa-star"></i>
                <span>Первые шаги</span>
            </div>
        `;
        return;
    }
    
    recentAchievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = 'rpg-achievement-item';
        achievementElement.innerHTML = `
            <i class="fas fa-trophy"></i>
            <span>${achievement.name}</span>
        `;
        rpgRecentAchievements.appendChild(achievementElement);
    });
}

function closeModal() {
    const addModal = document.getElementById('add-item-modal');
    const overlay = document.getElementById('modal-overlay');
    if (addModal) addModal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    // Добавьте сюда другие модальные окна, если они есть и используют эту функцию
}

function createControls(areas) {
    const container = document.getElementById('lifeBalanceControls');
    container.innerHTML = '';
    
    areas.forEach((area, index) => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'life-area-control';
        
        controlDiv.innerHTML = `
            <div class="life-area-control-display" style="background: ${area.color};"></div>
            <input type="text" class="area-name life-area-name-input" value="${area.name}">
            <input type="range" class="area-value life-area-value-input" min="0" max="10" value="${area.value}"
                   oninput="updateChartRealtime()">
            <span class="life-area-value-display">${area.value}</span>
        `;
        
        container.appendChild(controlDiv);
        
        // Обновление отображения значения при изменении слайдера
        const slider = controlDiv.querySelector('.area-value');
        const display = controlDiv.querySelector('.life-area-value-display');
        slider.addEventListener('input', function() {
            display.textContent = this.value;
        });
    });
}

// Функции для работы с характеристиками здоровья
function openAddHealthStatModal() {
    document.getElementById('healthStatModal').style.display = 'flex';
    document.getElementById('healthStatModalTitle').textContent = 'Добавить характеристику здоровья';
    document.getElementById('editingStatIndex').value = '-1';
    clearHealthStatForm();
}

function closeHealthStatModal() {
    document.getElementById('healthStatModal').style.display = 'none';
    clearHealthStatForm();
}

function clearHealthStatForm() {
    document.getElementById('statName').value = '';
    document.getElementById('statValue').value = '';
    document.getElementById('statUnit').value = '';
    document.getElementById('statCategory').value = 'Физическое состояние';
    document.getElementById('statComment').value = '';
}

function saveHealthStat() {
    const name = document.getElementById('statName').value.trim();
    const value = document.getElementById('statValue').value.trim();
    const unit = document.getElementById('statUnit').value.trim();
    const category = document.getElementById('statCategory').value;
    const comment = document.getElementById('statComment').value.trim();
    const editingIndex = parseInt(document.getElementById('editingStatIndex').value);

    if (!name || !value) {
        alert('Пожалуйста, заполните название и значение характеристики.');
        return;
    }

    const healthStat = {
        id: editingIndex === -1 ? Date.now() : LifePlanner.getData().healthStats[editingIndex].id,
        name: name,
        value: value,
        unit: unit,
        category: category,
        comment: comment,
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingIndex === -1) {
        // Добавляем новую характеристику
        LifePlanner.getData().healthStats.push(healthStat);
    } else {
        // Редактируем существующую
        LifePlanner.getData().healthStats[editingIndex] = healthStat;
    }

    LifePlanner.saveData();
    renderHealthStats();
    closeHealthStatModal();
}

function renderHealthStats() {
    const container = document.getElementById('health-stats-container');
    if (!container) return;

    const healthStats = LifePlanner.getData().healthStats || [];
    container.innerHTML = '';

    if (healthStats.length === 0) {
        container.innerHTML = '<p class="placeholder-text">Характеристики здоровья не добавлены.</p>';
        return;
    }

    // Группируем по категориям
    const groupedStats = {};
    healthStats.forEach(stat => {
        if (!groupedStats[stat.category]) {
            groupedStats[stat.category] = [];
        }
        groupedStats[stat.category].push(stat);
    });

    Object.keys(groupedStats).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'health-stats-category';
        categoryDiv.style.cssText = `
            background: #383838;
            border: 1px solid #4A4A4A;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        `;

        const categoryTitle = document.createElement('h4');
        categoryTitle.textContent = category;
        categoryTitle.style.cssText = `
            color: #E1D7C7;
            margin: 0 0 10px 0;
            border-bottom: 1px solid #4A4A4A;
            padding-bottom: 5px;
        `;
        categoryDiv.appendChild(categoryTitle);

        groupedStats[category].forEach((stat, index) => {
            const statDiv = document.createElement('div');
            statDiv.className = 'health-stat-item';
            statDiv.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const statInfo = document.createElement('div');
            statInfo.innerHTML = `
                <strong style="color: #D1C7B7;">${stat.name}:</strong> 
                <span style="color: #A89F8D;">${stat.value} ${stat.unit || ''}</span>
                ${stat.comment ? `<br><small style="color: #888;">${stat.comment}</small>` : ''}
            `;

            const statActions = document.createElement('div');
            statActions.innerHTML = `
                <button onclick="editHealthStat(${healthStats.indexOf(stat)})" 
                        style="background: #007bff; color: white; border: none; padding: 4px 8px; margin-right: 5px; border-radius: 3px; cursor: pointer;">Ред.</button>
                <button onclick="deleteHealthStat(${healthStats.indexOf(stat)})" 
                        style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Удалить</button>
            `;

            statDiv.appendChild(statInfo);
            statDiv.appendChild(statActions);
            categoryDiv.appendChild(statDiv);
        });

        container.appendChild(categoryDiv);
    });
}

function editHealthStat(index) {
    const healthStat = LifePlanner.getData().healthStats[index];
    if (!healthStat) return;

    document.getElementById('healthStatModalTitle').textContent = 'Редактировать характеристику здоровья';
    document.getElementById('editingStatIndex').value = index;
    document.getElementById('statName').value = healthStat.name;
    document.getElementById('statValue').value = healthStat.value;
    document.getElementById('statUnit').value = healthStat.unit || '';
    document.getElementById('statCategory').value = healthStat.category;
    document.getElementById('statComment').value = healthStat.comment || '';
    
    openAddHealthStatModal();
}

function deleteHealthStat(index) {
    const healthStat = LifePlanner.getData().healthStats[index];
    if (!healthStat) return;

    if (confirm(`Вы уверены, что хотите удалить характеристику "${healthStat.name}"?`)) {
        LifePlanner.getData().healthStats.splice(index, 1);
        LifePlanner.saveData();
        renderHealthStats();
    }
}

function renderHealthLog() {
    const healthList = document.getElementById('healthList');
    if (!healthList) return;

    const healthEntries = LifePlanner.getData().health || [];
    healthList.innerHTML = '';

    if (healthEntries.length === 0) {
        healthList.innerHTML = '<p class="placeholder-text">Записей о здоровье нет.</p>';
        return;
    }

    // Сортируем записи по дате (от новых к старым)
    const sortedEntries = [...healthEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedEntries.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'health-log-entry';
        entryDiv.style.cssText = `
            background: #383838;
            border: 1px solid #4A4A4A;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
        `;

        entryDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="color: #E1D7C7;">Дата: ${entry.date}</strong><br>
                    <span style="color: #A89F8D;">Сон: ${entry.sleep} ч, Вода: ${entry.water} л</span>
                    ${entry.note ? `<br><em style="color: #888;">${entry.note}</em>` : ''}
                </div>
                <button onclick="deleteHealthEntry(${healthEntries.indexOf(entry)})" 
                        style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Удалить</button>
            </div>
        `;

        healthList.appendChild(entryDiv);
    });
}

function deleteHealthEntry(index) {
    const healthEntry = LifePlanner.getData().health[index];
    if (!healthEntry) return;

    if (confirm('Вы уверены, что хотите удалить эту запись о здоровье?')) {
        LifePlanner.getData().health.splice(index, 1);
        LifePlanner.saveData();
        renderHealthLog();
    }
}

// Глобальный экспорт новых функций
window.editHealthStat = editHealthStat;


