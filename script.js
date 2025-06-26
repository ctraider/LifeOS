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
let data = JSON.parse(localStorage.getItem('lifeOSData')) || {
    tasks: [], // Для старой системы задач, если она будет адаптирована
    health: [], // Для журнала здоровья
    healthStats: [],  // Для RPG характеристик здоровья
    relationships: [], // Для старой системы отношений
    skills: [], // Для старой системы навыков
    xp: 0, // Общий XP, связан с верхней панелью
    level: 1, // Общий уровень, связан с верхней панелью
    // rimworldInventory: [], // Данные инвентаря теперь в inventoryItems и localStorage.getItem('rimworldInventory')
    // personaData: {}, // Данные персоны теперь напрямую в localStorage.getItem('personaData')
    // rimworldPlannerTasks: [] // Задачи планировщика теперь в tasksPlanner и localStorage.getItem('rimworldPlannerTasks')
};

function saveMainData() { // Новая функция для сохранения основного объекта data
    try {
        localStorage.setItem('lifeOSData', JSON.stringify(data));
        console.log('Основные данные (lifeOSData) успешно сохранены:', data);
    } catch (e) {
        console.error('Ошибка при сохранении основных данных lifeOSData:', e);
    }
}

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
        avatar: localStorage.getItem('personaAvatar') || ''
    };
    localStorage.setItem('personaData', JSON.stringify(personaDataToSave));
    alert('Данные персонажа сохранены!');
    loadPersonaData();
}

function loadPersonaData() {
    const personaDataFromStorage = JSON.parse(localStorage.getItem('personaData'));
    
    // Определяем имя (из сохраненных данных или пустое)
    const name = personaDataFromStorage?.name || '';

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
            localStorage.setItem('personaAvatar', e.target.result);
            const avatarDisplay = document.querySelector('#persona .persona-avatar');
            avatarDisplay.style.backgroundImage = `url(${e.target.result})`;
            avatarDisplay.textContent = '';
            savePersonaData(); 
        }
        reader.readAsDataURL(file);
    }
});

let inventoryItems = [];
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
        saveInventory();
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
    saveInventory();
    renderInventory();
}

function addItemToInventoryPrompt() {
    const name = prompt('Введите название предмета:', 'Пласталь');
    if (!name) return;
    const quantityStr = prompt('Введите количество:', '10');
    const quantity = parseInt(quantityStr);
    if (isNaN(quantity) || quantity <= 0) {
        alert('Некорректное количество');
        return;
    }
    const type = prompt('Введите тип предмета (weapons, apparel, resources, medicine):', 'resources');
    if (!['weapons', 'apparel', 'resources', 'medicine'].includes(type)) { // убрал 'all'
        alert('Некорректный тип предмета.');
        return;
    }
    addItemToInventory(name, quantity, type);
}

function saveInventory() {
    localStorage.setItem('rimworldInventory', JSON.stringify(inventoryItems));
}

function loadInventory() {
    const savedInventory = localStorage.getItem('rimworldInventory');
    if (savedInventory) {
        inventoryItems = JSON.parse(savedInventory);
    }
    renderInventory();
}

const itemContextMenu = document.getElementById('itemContextMenu');

function handleContextMenu(e) {
    e.preventDefault();
    contextMenuItem = inventoryItems.find(item => item.slot == this.dataset.slotId);
    if (!contextMenuItem) return;
    if (itemContextMenu) {
    itemContextMenu.style.top = `${e.clientY}px`;
    itemContextMenu.style.left = `${e.clientX}px`;
    itemContextMenu.style.display = 'block';
    document.addEventListener('click', hideContextMenu, { once: true });
    } else {
        console.warn("Контекстное меню 'itemContextMenu' не найдено.");
    }
}

function hideContextMenu() {
    if (itemContextMenu) itemContextMenu.style.display = 'none';
    contextMenuItem = null;
}

function filterItems(type) {
    if (!inventoryGridContainer) return;
    const cells = inventoryGridContainer.querySelectorAll('.inventory-cell');
    cells.forEach(cell => {
        const item = inventoryItems.find(i => i.slot == cell.dataset.slotId);
        if (type === 'all' || !item || (item && item.type === type)) {
            cell.style.display = 'flex';
        } else {
            cell.style.display = 'none';
        }
    });
}

function deleteContextItem() {
    if (contextMenuItem) {
        inventoryItems = inventoryItems.filter(item => item.id !== contextMenuItem.id);
        saveInventory();
        renderInventory();
    }
    hideContextMenu();
}

function editContextItemName() {
    if (contextMenuItem) {
        const newName = prompt('Введите новое имя для предмета:', contextMenuItem.name);
        if (newName && newName.trim() !== '') {
            const itemIndex = inventoryItems.findIndex(item => item.id === contextMenuItem.id);
            if (itemIndex !== -1) inventoryItems[itemIndex].name = newName.trim();
            saveInventory();
            renderInventory();
        }
    }
    hideContextMenu();
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
  let data = JSON.parse(localStorage.getItem('lifeOSData')) || {
    tasks: [],
    xp: 0,
    level: 1,
    currency: 0,
    hp: 100,
    achievements: [],
    conversions: [],
    savingsGoal: 0
  };
  let filterCompleted = null;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // --- Функции для задач ---
  function saveData() {
    localStorage.setItem('lifeOSData', JSON.stringify(data));
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
      li.className = 'planner-task-item';
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
    // ... (обновить статистику, XP, валюту и т.д.)
  }
  // ... (остальные функции: addSubTask, renderSubTasks, generateCalendar, addAchievement, валюта и т.д.)

  function init() {
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

  // Экспортируем только нужные методы
  return {
    init,
    addTask,
    renderTasks,
    // ... (остальные публичные методы)
  };
})();

document.addEventListener('DOMContentLoaded', function() {
    loadPersonaData();
    loadInventory();
    // Если есть другие функции автозагрузки (например, здоровье), добавить их здесь
    if (window.LifePlanner && typeof window.LifePlanner.init === 'function') {
  window.LifePlanner.init();
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
  alert('Окно планирования операции (заглушка)');
}
function filterHistory(type) {
  alert('Фильтрация истории по: ' + type + ' (заглушка)');
}
function addHealthEntry() {
  alert('Добавить запись о здоровье (заглушка)');
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
function openWorkSubTab(event, subTab) {
  alert('Открыть под-вкладку работы: ' + subTab + ' (заглушка)');
}
function setTaskPriority(task, priority) {
  alert('Изменить приоритет задачи: ' + task + ' на ' + priority + ' (заглушка)');
}
function openAddTaskModal() {
  alert('Окно добавления задачи (заглушка)');
}
function toggleWorkTabTask(taskId) {
  alert('Тоггл задачи: ' + taskId + ' (заглушка)');
}
function addItemToInventoryPrompt() {
  alert('Добавить предмет в инвентарь (заглушка)');
}
function saveInventory() {
  alert('Сохранить инвентарь (заглушка)');
}
function filterItems(type) {
  alert('Фильтрация предметов по: ' + type + ' (заглушка)');
}
function deleteContextItem() {
  alert('Удалить предмет (заглушка)');
}
function editContextItemName() {
  alert('Переименовать предмет (заглушка)');
}
function closeModal() {
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}
function openAddHealthStatModal() {
  document.getElementById('healthStatModal').style.display = 'flex';
}
function closeHealthStatModal() {
  document.getElementById('healthStatModal').style.display = 'none';
}
function deleteHealthStat() {
  alert('Удалить характеристику здоровья (заглушка)');
}
function saveHealthStat() {
  alert('Сохранить характеристику здоровья (заглушка)');
}
function deleteHealthEntry() {
  alert('Удалить запись о здоровье (заглушка)');
}

function toggleCompletePlanner() { /* больше не используется, заглушка */ }


