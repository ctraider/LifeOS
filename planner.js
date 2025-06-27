// planner.js — изолированный модуль планировщика для LifeOS

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
    savingsGoal: 0,
    health: [], // Для журнала здоровья
    healthStats: [],  // Для RPG характеристик здоровья
    relationships: [], // Для системы отношений
    skills: [], // Для системы навыков
    persona: {}, // Для данных персоны
    inventoryItems: [], // Для данных инвентаря
    journalEvents: [], // Для журнала событий
    medicalHistory: [] // Для истории болезней
  };
  data.tasks = data.tasks || [];
  data.achievements = data.achievements || [];
  data.conversions = data.conversions || [];
  data.health = data.health || [];
  data.healthStats = data.healthStats || [];
  data.relationships = data.relationships || [];
  data.skills = data.skills || [];
  data.persona = data.persona || {};
  data.inventoryItems = data.inventoryItems || [];
  data.journalEvents = data.journalEvents || [];
  data.medicalHistory = data.medicalHistory || [];
  let filterCompleted = null;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // --- Служебные функции ---
  function saveData() {
    try {
        localStorage.setItem('lifeOSData', JSON.stringify(data));
        console.log('Основные данные (lifeOSData) успешно сохранены:', data);
    } catch (e) {
        console.error('Ошибка при сохранении основных данных lifeOSData:', e);
    }
  }

  function getData() {
    return data;
  }
  function updateFromStorage() {
    const d = JSON.parse(localStorage.getItem('lifeOSData'));
    if (d) data = d;

    // Обновляем инвентарь отдельно, так как он ранее хранился по другому ключу
    const storedInventory = localStorage.getItem('rimworldInventory');
    if (storedInventory) {
      try {
        data.inventoryItems = JSON.parse(storedInventory);
        localStorage.removeItem('rimworldInventory'); // Удаляем старый ключ
        saveData(); // Сохраняем объединенные данные
      } catch (e) {
        console.error('Ошибка при парсинге rimworldInventory:', e);
      }
    }
    // Обновляем персональные данные отдельно
    const storedPersona = localStorage.getItem('personaData');
    if (storedPersona) {
      try {
        data.persona = JSON.parse(storedPersona);
        localStorage.removeItem('personaData'); // Удаляем старый ключ
        saveData(); // Сохраняем объединенные данные
      } catch (e) {
        console.error('Ошибка при парсинге personaData:', e);
      }
    }
  }
  window.addEventListener('storage', function(e) {
    if (e.key === 'lifeOSData') {
      updateFromStorage();
      renderTasks();
      renderAchievements();
      updateGamificationUI();
      updateProgress();
      updateConversionHistory();
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
  });

  // --- Задачи ---
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
  function addSubTask(parentTask, parentIdPath) {
    const subTaskText = prompt('Введите текст подзадачи:');
    if (subTaskText && subTaskText.trim() !== '') {
      const subTask = {
        id: Date.now().toString(),
        text: subTaskText.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        importance: 'important',
        urgency: 'urgent',
        priority: 'medium',
        dueDate: null,
        subTasks: []
      };
      parentTask.subTasks.push(subTask);
      saveData();
      renderTasks();
    }
  }
  function deleteSubTask(parentTask, subTaskId) {
    parentTask.subTasks = parentTask.subTasks.filter(subTask => subTask.id !== subTaskId);
    saveData();
    renderTasks();
  }
  function deleteTask(taskId) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      data.tasks = data.tasks.filter(t => t.id !== taskId);
      saveData();
      renderTasks();
      generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }
  }
  function renderSubTasks(subTasks, parentTask, parentIdPath) {
    const subTaskUl = document.createElement('ul');
    subTaskUl.className = 'subtask-list';
    subTasks.forEach(subTask => {
      const subLi = document.createElement('li');
      subLi.className = 'subtask-item';
      if (subTask.completed) subLi.classList.add('completed');
      const subTaskContent = document.createElement('div');
      subTaskContent.className = 'task-content';
      const subLeft = document.createElement('div');
      subLeft.className = 'task-left';
      const subCheckbox = document.createElement('input');
      subCheckbox.type = 'checkbox';
      subCheckbox.checked = subTask.completed;
      subCheckbox.addEventListener('change', () => {
        subTask.completed = !subTask.completed;
        saveData();
        renderTasks();
      });
      subLeft.appendChild(subCheckbox);
      const subTextSpan = document.createElement('span');
      subTextSpan.textContent = subTask.text;
      if (subTask.completed) subTextSpan.style.textDecoration = 'line-through';
      subLeft.appendChild(subTextSpan);
      subTaskContent.appendChild(subLeft);
      const subRight = document.createElement('div');
      subRight.className = 'task-right';
      const editSubButton = document.createElement('button');
      editSubButton.innerHTML = '<i class="fas fa-edit"></i>';
      editSubButton.addEventListener('click', () => {
        const newSubText = prompt('Новый текст подзадачи:', subTask.text);
        if (newSubText !== null && newSubText.trim()) {
          subTask.text = newSubText.trim();
          saveData();
          renderTasks();
        }
      });
      subRight.appendChild(editSubButton);
      const addSubSubTaskButton = document.createElement('button');
      addSubSubTaskButton.className = 'subtask-btn';
      addSubSubTaskButton.innerHTML = '<i class="fas fa-plus"></i>';
      addSubSubTaskButton.addEventListener('click', () => addSubTask(subTask, parentIdPath + '.' + subTask.id));
      subRight.appendChild(addSubSubTaskButton);
      const delSubButton = document.createElement('button');
      delSubButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      delSubButton.addEventListener('click', () => deleteSubTask(parentTask, subTask.id));
      subRight.appendChild(delSubButton);
      subTaskContent.appendChild(subRight);
      subLi.appendChild(subTaskContent);
      if (subTask.subTasks && subTask.subTasks.length > 0) {
        const subSubTaskUl = renderSubTasks(subTask.subTasks, subTask, parentIdPath + '.' + subTask.id);
        subLi.appendChild(subSubTaskUl);
      }
      subTaskUl.appendChild(subLi);
    });
    return subTaskUl;
  }
  function getEisenhowerQuadrant(task) {
    if (task.importance === 'important' && task.urgency === 'urgent') return 'Q1 (Важно+Срочно)';
    if (task.importance === 'important' && task.urgency === 'notUrgent') return 'Q2 (Важно+Не срочно)';
    if (task.importance === 'notImportant' && task.urgency === 'urgent') return 'Q3 (Не важно+Срочно)';
    return 'Q4 (Не важно+Не срочно)';
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
      li.className = 'task-item';
      if (task.completed) li.classList.add('completed');
      const contentDiv = document.createElement('div');
      contentDiv.className = 'task-content';
      const leftBlock = document.createElement('div');
      leftBlock.className = 'task-left';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        task.completed = !task.completed;
        saveData();
        renderTasks();
        recalcGamification(data.tasks);
        updateStats(data.tasks);
      });
      leftBlock.appendChild(checkbox);
      if (task.subTasks && task.subTasks.length > 0) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-subtasks-btn';
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
      // Бейджи важности
      const importanceBadge = document.createElement('span');
      importanceBadge.className = `importance-badge ${task.importance === 'important' ? 'importance-important' : 'importance-notImportant'}`;
      importanceBadge.textContent = task.importance === 'important' ? 'Важно' : 'Не важно';
      leftBlock.appendChild(importanceBadge);
      // Бейджи срочности
      const urgencyBadge = document.createElement('span');
      urgencyBadge.className = `urgency-badge ${task.urgency === 'urgent' ? 'urgency-urgent' : 'urgency-notUrgent'}`;
      urgencyBadge.textContent = task.urgency === 'urgent' ? 'Срочно' : 'Не срочно';
      leftBlock.appendChild(urgencyBadge);
      // Бейдж приоритета
      const prioritySpan = document.createElement('span');
      prioritySpan.classList.add('priority-span');
      switch (task.priority) {
        case 'low': prioritySpan.textContent = 'Низкий'; prioritySpan.classList.add('priority-low'); break;
        case 'medium': prioritySpan.textContent = 'Средний'; prioritySpan.classList.add('priority-medium'); break;
        case 'high': prioritySpan.textContent = 'Высокий'; prioritySpan.classList.add('priority-high'); break;
        case 'boss': prioritySpan.textContent = 'Босс'; prioritySpan.classList.add('priority-boss'); break;
      }
      leftBlock.appendChild(prioritySpan);
      // Матрица Эйзенхауэра
      const matrixSpan = document.createElement('span');
      matrixSpan.className = 'matrix-span';
      matrixSpan.textContent = `(${getEisenhowerQuadrant(task)})`;
      leftBlock.appendChild(matrixSpan);
      contentDiv.appendChild(leftBlock);
      // Правый блок с кнопками
      const rightBlock = document.createElement('div');
      rightBlock.className = 'task-right';
      if (task.dueDate) {
        const dueSpan = document.createElement('span');
        dueSpan.className = 'due-date';
        dueSpan.textContent = `(Дедлайн: ${new Date(task.dueDate).toLocaleDateString()})`;
        rightBlock.appendChild(dueSpan);
      }
      const editButton = document.createElement('button');
      editButton.className = 'edit-btn';
      editButton.innerHTML = '<i class="fas fa-edit"></i>';
      editButton.addEventListener('click', () => {
        const newText = prompt('Новый текст задачи:', task.text);
        if (newText !== null && newText.trim()) {
          task.text = newText.trim();
          saveData();
          renderTasks();
        }
      });
      rightBlock.appendChild(editButton);
      const addSubTaskButton = document.createElement('button');
      addSubTaskButton.className = 'subtask-btn';
      addSubTaskButton.innerHTML = '<i class="fas fa-plus"></i>';
      addSubTaskButton.addEventListener('click', () => addSubTask(task, task.id));
      rightBlock.appendChild(addSubTaskButton);
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-btn';
      deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteButton.addEventListener('click', () => deleteTask(task.id));
      rightBlock.appendChild(deleteButton);
      contentDiv.appendChild(rightBlock);
      li.appendChild(contentDiv);
      if (task.subTasks && task.subTasks.length > 0) {
        const subTaskUl = renderSubTasks(task.subTasks, task, task.id);
        if (task.collapsed) subTaskUl.style.display = 'none';
        li.appendChild(subTaskUl);
      }
      taskList.appendChild(li);
      setTimeout(() => li.classList.add('show'), 10);
    });
    updateStats(data.tasks);
    recalcGamification(data.tasks);
    saveData();
    renderAchievements();
    updateGamificationUI();
    updateCurrentTaskSummary();
  }

  // --- Календарь ---
  function generateCalendar(year, month) {
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthYear = document.getElementById('current-month-year');
    if (!calendarDays || !currentMonthYear) return;
    calendarDays.innerHTML = '';
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    currentMonthYear.textContent = `${getMonthName(month)} ${year}`;
    for (let i = 0; i < startingDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      calendarDays.appendChild(emptyDay);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      const dayTasks = data.tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.getFullYear() === year && taskDate.getMonth() === month && taskDate.getDate() === day;
      });
      const today = new Date();
      if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) {
        dayElement.classList.add('today');
      }
      if (dayTasks.length > 0) {
        dayElement.classList.add('has-tasks');
        dayElement.innerHTML = `
          <div class="calendar-day-number">${day}</div>
          <div class="calendar-task">${dayTasks.length} задач</div>
        `;
        dayElement.addEventListener('click', () => showDayTasks(date, dayTasks));
      } else {
        dayElement.innerHTML = `<div class="calendar-day-number">${day}</div>`;
      }
      calendarDays.appendChild(dayElement);
    }
  }
  function getMonthName(month) {
    return ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][month];
  }
  function showDayTasks(date, tasks) {
    const modalDate = document.getElementById('modal-date');
    const modalTaskList = document.getElementById('modal-task-list');
    const taskModal = document.getElementById('task-modal');
    if (!modalDate || !modalTaskList || !taskModal) return;
    modalDate.textContent = `Задачи на ${date.getDate()} ${getMonthName(date.getMonth())} ${date.getFullYear()}`;
    modalTaskList.innerHTML = '';
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.textContent = task.text;
      modalTaskList.appendChild(li);
    });
    taskModal.style.display = 'flex';
  }
  function closeModal() {
    const taskModal = document.getElementById('task-modal');
    if (taskModal) taskModal.style.display = 'none';
  }

  // --- Достижения, валюта, прогресс, XP и т.д. ---
  // ... (аналогично перенести из plan.html)

  // --- Виртуальная валюта и прогресс ---
  function convertCurrency() {
    const virtualCurrencyInput = document.getElementById('virtual-currency-input');
    const currencyResult = document.getElementById('currency-result');
    if (!virtualCurrencyInput) return;
    const amount = parseFloat(virtualCurrencyInput.value);
    if (!isNaN(amount) && amount >= 0) {
      const result = amount / 10;
      const conversion = {
        id: Date.now(),
        amount,
        result,
        date: new Date().toLocaleString()
      };
      data.conversions.push(conversion);
      saveData();
      currencyResult.textContent = `${amount} вирт. = ${result} руб.`;
      currencyResult.style.display = 'block';
      updateConversionHistory();
      updateProgress();
      virtualCurrencyInput.value = '';
    } else {
      alert('Пожалуйста, введите корректное число');
    }
  }
  function updateConversionHistory() {
    data.conversions = data.conversions || [];
    const conversionList = document.getElementById('conversion-list');
    const currencyResult = document.getElementById('currency-result');
    if (!conversionList) return;
    conversionList.innerHTML = '';
    if (!Array.isArray(data.conversions) || data.conversions.length === 0) {
      conversionList.innerHTML = '<p>Нет истории конвертаций</p>';
      if (currencyResult) currencyResult.style.display = 'none';
      return;
    }
    const totalAmount = data.conversions.reduce((sum, conv) => sum + conv.amount, 0);
    const totalResult = data.conversions.reduce((sum, conv) => sum + conv.result, 0);
    data.conversions.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'planner-conversion-item';
      item.innerHTML = `
        <span>${conv.amount} → ${conv.result} руб.</span>
        <button class="planner-delete-conversion" data-id="${conv.id}"><i class="fas fa-trash"></i></button>
      `;
      conversionList.appendChild(item);
    });
    const totalItem = document.createElement('div');
    totalItem.className = 'planner-conversion-item';
    totalItem.style.fontWeight = 'bold';
    totalItem.innerHTML = `
      <span>Итого: ${totalAmount.toFixed(2)} → ${totalResult.toFixed(2)} руб.</span>
      <span></span>
    `;
    conversionList.appendChild(totalItem);
    document.querySelectorAll('.planner-delete-conversion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        data.conversions = data.conversions.filter(conv => conv.id !== id);
        saveData();
        updateConversionHistory();
        updateProgress();
      });
    });
  }
  function clearConversionHistory() {
    if (confirm('Вы уверены, что хотите очистить историю конвертаций?')) {
      data.conversions = [];
      saveData();
      updateConversionHistory();
      updateProgress();
      const currencyResult = document.getElementById('currency-result');
      if (currencyResult) currencyResult.style.display = 'none';
    }
  }
  function setSavingsGoal() {
    const savingsGoalInput = document.getElementById('savings-goal');
    if (!savingsGoalInput) return;
    const goal = parseFloat(savingsGoalInput.value);
    if (!isNaN(goal) && goal > 0) {
      data.savingsGoal = goal;
      saveData();
      updateProgress();
      savingsGoalInput.value = '';
    } else {
      alert('Пожалуйста, введите корректную сумму цели');
    }
  }
  function updateProgress() {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const totalResult = data.conversions.reduce((sum, conv) => sum + conv.result, 0);
    if (data.savingsGoal > 0) {
      const percentage = Math.min((totalResult / data.savingsGoal) * 100, 100);
      if (progressFill) progressFill.style.width = `${percentage}%`;
      if (progressText) progressText.textContent = `${percentage.toFixed(1)}% (${totalResult.toFixed(2)} / ${data.savingsGoal.toFixed(2)} руб.)`;
    } else {
      if (progressFill) progressFill.style.width = '0%';
      if (progressText) progressText.textContent = '0% (0 / 0 руб.)';
    }
  }

  // --- Геймификация и XP ---
  function getTaskXP(task) {
    let xp = 10;
    switch (task.priority) {
      case 'low': xp *= 0.5; break;
      case 'medium': xp *= 1; break;
      case 'high': xp *= 2; break;
      case 'boss': xp *= 3; break;
    }
    if (task.dueDate) {
      const now = new Date();
      const due = new Date(task.dueDate);
      xp += (now <= due) ? 5 : -5;
    }
    return Math.max(0, Math.round(xp));
  }
  function calcTotalXP(task) {
    let totalXP = task.completed ? getTaskXP(task) : 0;
    if (task.subTasks && task.subTasks.length > 0) {
      task.subTasks.forEach(subTask => {
        if (subTask.completed) totalXP += getTaskXP(subTask);
      });
    }
    return totalXP;
  }
  function recalcGamification(tasksArr) {
    let xp = 0;
    tasksArr.forEach(task => { xp += calcTotalXP(task); });
    const currency = Math.round(xp * 0.5);
    data.xp = xp;
    data.currency = currency;
    data.level = Math.floor(xp / 50) + 1;
    data.hp = 100;
    updateGamificationUI();
    saveData();
  }
  function updateGamificationUI() {
    const xpSpan = document.getElementById('xp');
    const levelSpan = document.getElementById('level');
    const currencySpan = document.getElementById('currency');
    const hpSpan = document.getElementById('hp');
    // Для вкладки Обзор
    const summary = document.getElementById('summary');
    let summaryLevel = summary ? summary.querySelector('#level') : null;
    let summaryXP = summary ? summary.querySelector('#xp') : null;
    let summaryCurrency = summary ? summary.querySelector('#currency') : null;
    let summaryHP = summary ? summary.querySelector('#hp') : null;
    if (xpSpan) xpSpan.textContent = data.xp;
    if (levelSpan) levelSpan.textContent = data.level;
    if (currencySpan) currencySpan.textContent = data.currency;
    if (hpSpan) hpSpan.textContent = data.hp;
    if (summaryLevel) summaryLevel.textContent = data.level;
    if (summaryXP) summaryXP.textContent = data.xp;
    if (summaryCurrency) summaryCurrency.textContent = data.currency;
    if (summaryHP) summaryHP.textContent = data.hp;
  }

  // --- Достижения ---
  const staticAchievements = [
    { id: 1, name: 'Первая задача', description: 'Выполните свою первую задачу', condition: () => data.tasks.some(t => t.completed) },
    { id: 2, name: 'Мастер подзадач', description: 'Создайте 10 подзадач', condition: () => data.tasks.reduce((acc, t) => acc + (t.subTasks ? t.subTasks.length : 0), 0) >= 10 }
  ];
  function renderAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    if (!achievementsList) return;
    achievementsList.innerHTML = '';
    // Статические достижения
    staticAchievements.forEach(ach => {
      const achDiv = document.createElement('div');
      achDiv.className = 'planner-achievement';
      achDiv.innerHTML = `
        <h3>${ach.name}</h3>
        <p>${ach.description}</p>
        <p>Прогресс: ${ach.condition() ? '100%' : '0%'}</p>
      `;
      achievementsList.appendChild(achDiv);
    });
    // Пользовательские достижения
    (data.achievements || []).forEach(ach => {
      const achDiv = document.createElement('div');
      achDiv.className = 'planner-achievement';
      achDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3>${ach.name}</h3>
            <p>${ach.description}</p>
          </div>
          <button class="planner-delete-achievement-btn" data-id="${ach.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      achievementsList.appendChild(achDiv);
    });
    document.querySelectorAll('.planner-delete-achievement-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        data.achievements = (data.achievements || []).filter(ach => ach.id !== id);
        saveData();
        renderAchievements();
      });
    });
  }
  function addUserAchievement() {
    const achievementNameInput = document.getElementById('achievement-name');
    const achievementDescInput = document.getElementById('achievement-desc');
    if (!achievementNameInput || !achievementDescInput) return;
    const name = achievementNameInput.value.trim();
    const desc = achievementDescInput.value.trim();
    if (!name || !desc) {
      alert('Введите название и описание достижения!');
      return;
    }
    const newAchievement = {
      id: Date.now(),
      name,
      description: desc
    };
    data.achievements = data.achievements || [];
    data.achievements.push(newAchievement);
    saveData();
    achievementNameInput.value = '';
    achievementDescInput.value = '';
    renderAchievements();
  }

  // --- Статистика задач ---
  function updateStats(tasksArr) {
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const activeTasksEl = document.getElementById('active-tasks');
    const total = tasksArr.length;
    const completed = tasksArr.filter(t => t.completed).length;
    const active = total - completed;
    if (totalTasksEl) totalTasksEl.textContent = total;
    if (completedTasksEl) completedTasksEl.textContent = completed;
    if (activeTasksEl) activeTasksEl.textContent = active;
  }

  // --- Переключение темы ---
  function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const toggleThemeButton = document.getElementById('toggle-theme');
    if (toggleThemeButton) {
      const icon = toggleThemeButton.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
      }
    }
  }

  // --- Обновление текущей задачи в обзоре ---
  function updateCurrentTaskSummary() {
    const currentTasksSummary = document.getElementById('currentTasksSummary');
    if (!currentTasksSummary) return;
    // Самая срочная невыполненная задача (или только что созданная)
    const activeTasks = data.tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) {
      currentTasksSummary.innerHTML = '<li>Нет текущих задач...</li>';
      return;
    }
    // Сортируем по срочности, важности, приоритету, дедлайну
    activeTasks.sort((a, b) => {
      if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
      if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
      if (a.importance === 'important' && b.importance !== 'important') return -1;
      if (b.importance === 'important' && a.importance !== 'important') return 1;
      if (a.priority === 'boss' && b.priority !== 'boss') return -1;
      if (b.priority === 'boss' && a.priority !== 'boss') return 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    const mainTask = activeTasks[0];
    // Формируем красивый HTML с бейджами и дедлайном
    let html = `<b>${mainTask.text}</b> `;
    html += `<span class="importance-badge ${mainTask.importance === 'important' ? 'importance-important' : 'importance-notImportant'}">${mainTask.importance === 'important' ? 'Важно' : 'Не важно'}</span> `;
    html += `<span class="urgency-badge ${mainTask.urgency === 'urgent' ? 'urgency-urgent' : 'urgency-notUrgent'}">${mainTask.urgency === 'urgent' ? 'Срочно' : 'Не срочно'}</span> `;
    html += `<span class="priority-span priority-${mainTask.priority}">`;
    switch (mainTask.priority) {
      case 'low': html += 'Низкий'; break;
      case 'medium': html += 'Средний'; break;
      case 'high': html += 'Высокий'; break;
      case 'boss': html += 'Босс'; break;
    }
    html += `</span> `;
    html += `<span class="matrix-span">(${getEisenhowerQuadrant(mainTask)})</span> `;
    if (mainTask.dueDate) {
      html += `<span class="due-date">(Дедлайн: ${new Date(mainTask.dueDate).toLocaleDateString()})</span>`;
    }
    currentTasksSummary.innerHTML = `<li>${html}</li>`;
  }

  // --- Инициализация ---
  function init() {
    data.tasks = data.tasks || [];
    data.achievements = data.achievements || [];
    data.conversions = data.conversions || [];
    data.health = data.health || [];
    data.healthStats = data.healthStats || [];
    data.relationships = data.relationships || [];
    data.skills = data.skills || [];
    data.persona = data.persona || {};
    data.inventoryItems = data.inventoryItems || [];
    data.journalEvents = data.journalEvents || [];
    data.medicalHistory = data.medicalHistory || [];
    // Навешиваем обработчики событий только после загрузки DOM
    const addTaskButton = document.getElementById('add-task');
    const newTaskInput = document.getElementById('new-task');
    const showAllButton = document.getElementById('show-all');
    const showActiveButton = document.getElementById('show-active');
    const showCompletedButton = document.getElementById('show-completed');
    const modalClose = document.querySelector('.planner-task-modal-close');
    const taskModal = document.getElementById('task-modal');
    const convertCurrencyBtn = document.getElementById('convert-currency-btn');
    const virtualCurrencyInput = document.getElementById('virtual-currency-input');
    const clearHistoryBtn = document.getElementById('clear-history');
    const savingsGoalInput = document.getElementById('savings-goal');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const addAchievementBtn = document.getElementById('add-achievement-btn');
    const achievementNameInput = document.getElementById('achievement-name');
    const achievementDescInput = document.getElementById('achievement-desc');
    const toggleThemeButton = document.getElementById('toggle-theme');
    if (addTaskButton) addTaskButton.addEventListener('click', addTask);
    if (newTaskInput) newTaskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
    if (showAllButton) showAllButton.addEventListener('click', () => { filterCompleted = null; renderTasks(); });
    if (showActiveButton) showActiveButton.addEventListener('click', () => { filterCompleted = false; renderTasks(); });
    if (showCompletedButton) showCompletedButton.addEventListener('click', () => { filterCompleted = true; renderTasks(); });
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (taskModal) taskModal.addEventListener('click', e => { if (e.target === taskModal) closeModal(); });
    if (convertCurrencyBtn) convertCurrencyBtn.addEventListener('click', convertCurrency);
    if (virtualCurrencyInput) virtualCurrencyInput.addEventListener('keypress', e => { if (e.key === 'Enter') convertCurrency(); });
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearConversionHistory);
    if (savingsGoalInput) savingsGoalInput.addEventListener('keypress', e => { if (e.key === 'Enter') setSavingsGoal(); });
    if (savingsGoalInput) savingsGoalInput.addEventListener('change', setSavingsGoal);
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); generateCalendar(currentDate.getFullYear(), currentDate.getMonth()); });
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); generateCalendar(currentDate.getFullYear(), currentDate.getMonth()); });
    if (addAchievementBtn) addAchievementBtn.addEventListener('click', addUserAchievement);
    if (achievementNameInput) achievementNameInput.addEventListener('keypress', e => { if (e.key === 'Enter') addUserAchievement(); });
    if (achievementDescInput) achievementDescInput.addEventListener('keypress', e => { if (e.key === 'Enter') addUserAchievement(); });
    if (toggleThemeButton) toggleThemeButton.addEventListener('click', toggleTheme);
    renderTasks();
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    updateConversionHistory();
    updateGamificationUI();
    renderAchievements();
    updateProgress();
    updateStats(data.tasks);
  }

  // Экспортируем только нужные методы
  return {
    init,
    addTask,
    renderTasks,
    saveData,
    getData,
    updateFromStorage,
    // ... (остальные публичные методы)
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  window.LifePlanner.init();
}); 