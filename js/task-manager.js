// 認証システム
class AuthSystem {
    constructor() {
        // パスワードのSHA-256ハッシュ値（初期パスワード: "executive2026"）
        // 変更したい場合は、generate-hash.htmlを使用してハッシュを生成してください
        this.passwordHash = '586786c065792db54a5b97bab65e4373a023b3825076196bd1800c6a7c9aa811';
        this.sessionKey = 'executiveTaskAuth';

        this.initAuth();
    }

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    initAuth() {
        const authForm = document.getElementById('authForm');
        const logoutBtn = document.getElementById('logoutBtn');

        // セッションチェック
        if (this.isAuthenticated()) {
            this.showMainApp();
        }

        // ログインフォーム送信
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            const hash = await this.hashPassword(password);

            if (hash === this.passwordHash) {
                sessionStorage.setItem(this.sessionKey, 'authenticated');
                this.showMainApp();
                document.getElementById('passwordInput').value = '';
                document.getElementById('authError').classList.add('hidden');
            } else {
                document.getElementById('authError').classList.remove('hidden');
                document.getElementById('passwordInput').value = '';
            }
        });

        // ログアウト
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    isAuthenticated() {
        return sessionStorage.getItem(this.sessionKey) === 'authenticated';
    }

    showMainApp() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';

        // TaskManagerを初期化
        if (!window.taskManager) {
            window.taskManager = new TaskManager();
            // CalendarViewを初期化
            window.calendarView = new CalendarView(window.taskManager);
        }
    }

    logout() {
        sessionStorage.removeItem(this.sessionKey);
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('passwordInput').value = '';
    }
}

// タスク管理アプリケーション
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.editingTaskId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    // DOM要素の初期化
    initializeElements() {
        // フォーム要素
        this.taskForm = document.getElementById('taskForm');
        this.formTitle = document.getElementById('formTitle');
        this.btnShowForm = document.getElementById('btnShowForm');
        this.btnCancelForm = document.getElementById('btnCancelForm');

        // 入力フィールド
        this.taskTitleInput = document.getElementById('taskTitle');
        this.taskDescriptionInput = document.getElementById('taskDescription');
        this.taskPriorityInput = document.getElementById('taskPriority');
        this.taskCategoryInput = document.getElementById('taskCategory');
        this.taskDeadlineInput = document.getElementById('taskDeadline');

        // フィルター・検索
        this.searchInput = document.getElementById('searchInput');
        this.filterPriority = document.getElementById('filterPriority');
        this.filterCategory = document.getElementById('filterCategory');
        this.filterStatus = document.getElementById('filterStatus');

        // 表示エリア
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');

        // 統計
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
        this.highPriorityTasksEl = document.getElementById('highPriorityTasks');
    }

    // イベントリスナーの設定
    attachEventListeners() {
        this.btnShowForm.addEventListener('click', () => this.showForm());
        this.btnCancelForm.addEventListener('click', () => this.hideForm());
        this.taskForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        this.searchInput.addEventListener('input', () => this.render());
        this.filterPriority.addEventListener('change', () => this.render());
        this.filterCategory.addEventListener('change', () => this.render());
        this.filterStatus.addEventListener('change', () => this.render());
    }

    // LocalStorageからタスクを読み込み
    loadTasks() {
        const tasksJSON = localStorage.getItem('executiveTasks');
        return tasksJSON ? JSON.parse(tasksJSON) : [];
    }

    // LocalStorageにタスクを保存
    saveTasks() {
        localStorage.setItem('executiveTasks', JSON.stringify(this.tasks));
    }

    // フォームを表示
    showForm(task = null) {
        if (task) {
            this.editingTaskId = task.id;
            this.formTitle.textContent = 'タスクを編集';
            this.taskTitleInput.value = task.title;
            this.taskDescriptionInput.value = task.description || '';
            this.taskPriorityInput.value = task.priority;
            this.taskCategoryInput.value = task.category;
            // datetime-local形式に変換（YYYY-MM-DDTHH:mm）
            if (task.deadline) {
                const date = new Date(task.deadline);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                this.taskDeadlineInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            } else {
                this.taskDeadlineInput.value = '';
            }
        } else {
            this.editingTaskId = null;
            this.formTitle.textContent = '新しいタスクを追加';
            this.taskForm.reset();
        }

        this.taskForm.classList.remove('hidden');
        this.btnShowForm.style.display = 'none';

        // フォームまでスクロール
        this.taskForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        this.taskTitleInput.focus();
    }

    // フォームを非表示
    hideForm() {
        this.taskForm.classList.add('hidden');
        this.btnShowForm.style.display = 'block';
        this.taskForm.reset();
        this.editingTaskId = null;
    }

    // フォーム送信処理
    handleFormSubmit(e) {
        e.preventDefault();

        const taskData = {
            title: this.taskTitleInput.value.trim(),
            description: this.taskDescriptionInput.value.trim(),
            priority: this.taskPriorityInput.value,
            category: this.taskCategoryInput.value,
            deadline: this.taskDeadlineInput.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (this.editingTaskId) {
            // タスクを更新
            const taskIndex = this.tasks.findIndex(t => t.id === this.editingTaskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
            }
        } else {
            // 新しいタスクを追加
            const newTask = {
                id: Date.now().toString(),
                ...taskData
            };
            this.tasks.unshift(newTask);
        }

        this.saveTasks();
        this.hideForm();
        this.render();
    }

    // タスクの完了状態を切り替え
    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    // タスクを削除
    deleteTask(taskId) {
        if (confirm('このタスクを削除してもよろしいですか?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.render();
        }
    }

    // タスクをフィルタリング
    getFilteredTasks() {
        let filtered = [...this.tasks];

        // 検索フィルター
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchTerm) ||
                (task.description && task.description.toLowerCase().includes(searchTerm))
            );
        }

        // 優先度フィルター
        const priorityFilter = this.filterPriority.value;
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(task => task.priority === priorityFilter);
        }

        // カテゴリーフィルター
        const categoryFilter = this.filterCategory.value;
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(task => task.category === categoryFilter);
        }

        // ステータスフィルター
        const statusFilter = this.filterStatus.value;
        if (statusFilter === 'completed') {
            filtered = filtered.filter(task => task.completed);
        } else if (statusFilter === 'pending') {
            filtered = filtered.filter(task => !task.completed);
        }

        return filtered;
    }

    // 統計を更新
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const highPriority = this.tasks.filter(t => t.priority === 'high' && !t.completed).length;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;
        this.highPriorityTasksEl.textContent = highPriority;
    }

    // 期限が過ぎているかチェック
    isOverdue(deadline) {
        if (!deadline) return false;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        return deadlineDate < now;
    }

    // 日付をフォーマット
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        // 時刻が00:00の場合は日付のみ表示
        if (hours === '00' && minutes === '00') {
            return `${year}/${month}/${day}`;
        }
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    // カテゴリー名を日本語で取得
    getCategoryLabel(category) {
        const labels = {
            meeting: '会議',
            project: 'プロジェクト',
            decision: '重要決定',
            delegation: 'デリゲーション',
            finance: '財務',
            strategy: '戦略',
            other: 'その他'
        };
        return labels[category] || category;
    }

    // 優先度ラベルを取得
    getPriorityLabel(priority) {
        const labels = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return labels[priority] || priority;
    }

    // タスクHTMLを生成
    createTaskHTML(task) {
        const isOverdue = this.isOverdue(task.deadline);
        const deadlineClass = isOverdue ? 'deadline-badge deadline-overdue' : 'deadline-badge';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-header">
                    <input type="checkbox"
                           class="task-checkbox"
                           ${task.completed ? 'checked' : ''}
                           onchange="taskManager.toggleTaskComplete('${task.id}')">
                    <div class="task-content">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}

                        <div class="task-meta">
                            <span class="task-badge priority-${task.priority}">
                                優先度: ${this.getPriorityLabel(task.priority)}
                            </span>
                            <span class="category-badge">
                                ${this.getCategoryLabel(task.category)}
                            </span>
                            ${task.deadline ? `
                                <span class="${deadlineClass}">
                                    期限: ${this.formatDate(task.deadline)}
                                    ${isOverdue ? ' (期限超過)' : ''}
                                </span>
                            ` : ''}
                        </div>

                        <div class="task-actions">
                            <button class="btn-edit" onclick="taskManager.editTask('${task.id}')">
                                編集
                            </button>
                            <button class="btn-delete" onclick="taskManager.deleteTask('${task.id}')">
                                削除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // タスクを編集
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.showForm(task);
        }
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // レンダリング
    render() {
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            this.tasksList.innerHTML = '';
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            this.tasksList.innerHTML = filteredTasks
                .map(task => this.createTaskHTML(task))
                .join('');
        }

        this.updateStats();

        // カレンダービューも更新
        if (window.calendarView) {
            window.calendarView.refresh();
        }
    }
}

// カレンダービュー
class CalendarView {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.currentDate = new Date();
        this.currentView = 'month'; // 'month', 'week', 'day'
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.monthView = document.getElementById('monthView');
        this.weekView = document.getElementById('weekView');
        this.dayView = document.getElementById('dayView');
        this.currentPeriodEl = document.getElementById('currentPeriod');
        this.monthDays = document.getElementById('monthDays');
        this.weekGrid = document.getElementById('weekGrid');
        this.dayGrid = document.getElementById('dayGrid');
        this.dayHeader = document.getElementById('dayHeader');
    }

    attachEventListeners() {
        // ビュー切り替えタブ
        document.querySelectorAll('.calendar-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // ナビゲーションボタン
        document.getElementById('prevPeriod').addEventListener('click', () => this.navigate(-1));
        document.getElementById('nextPeriod').addEventListener('click', () => this.navigate(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // カレンダーアイテムのクリックイベント（イベント委譲）
        const calendarContainer = document.querySelector('.calendar-container');
        calendarContainer.addEventListener('click', (e) => {
            // カレンダータスクアイテムがクリックされた場合
            const taskItem = e.target.closest('.calendar-task-item');
            if (taskItem && taskItem.dataset.taskId) {
                e.preventDefault();
                this.taskManager.editTask(taskItem.dataset.taskId);
                return;
            }

            // 編集・削除ボタンがクリックされた場合
            const editBtn = e.target.closest('.btn-edit');
            if (editBtn && editBtn.dataset.taskId) {
                e.preventDefault();
                this.taskManager.editTask(editBtn.dataset.taskId);
                return;
            }

            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn && deleteBtn.dataset.taskId) {
                e.preventDefault();
                this.taskManager.deleteTask(deleteBtn.dataset.taskId);
                return;
            }
        });

        // チェックボックスの変更イベント（イベント委譲）
        calendarContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox') && e.target.dataset.taskId) {
                this.taskManager.toggleTaskComplete(e.target.dataset.taskId);
            }
        });
    }

    switchView(view) {
        this.currentView = view;

        // タブの状態を更新
        document.querySelectorAll('.calendar-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });

        // ビューの表示/非表示
        this.monthView.classList.toggle('hidden', view !== 'month');
        this.weekView.classList.toggle('hidden', view !== 'week');
        this.dayView.classList.toggle('hidden', view !== 'day');

        this.render();
    }

    navigate(direction) {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        } else if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        } else if (this.currentView === 'day') {
            this.currentDate.setDate(this.currentDate.getDate() + direction);
        }
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    render() {
        this.updatePeriodLabel();

        if (this.currentView === 'month') {
            this.renderMonthView();
        } else if (this.currentView === 'week') {
            this.renderWeekView();
        } else if (this.currentView === 'day') {
            this.renderDayView();
        }
    }

    updatePeriodLabel() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        const day = this.currentDate.getDate();

        if (this.currentView === 'month') {
            this.currentPeriodEl.textContent = `${year}年${month}月`;
        } else if (this.currentView === 'week') {
            const weekStart = this.getWeekStart(this.currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            this.currentPeriodEl.textContent = `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
        } else if (this.currentView === 'day') {
            this.currentPeriodEl.textContent = `${year}年${month}月${day}日`;
        }
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const totalCells = 42; // 6週間分

        for (let i = 0; i < totalCells; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            days.push(this.createDayCell(currentDate, month));
        }

        this.monthDays.innerHTML = days.join('');
    }

    createDayCell(date, currentMonth) {
        const isToday = this.isSameDay(date, new Date());
        const isOtherMonth = date.getMonth() !== currentMonth;
        const tasksOnDay = this.getTasksForDate(date);

        const classes = ['calendar-day'];
        if (isToday) classes.push('today');
        if (isOtherMonth) classes.push('other-month');

        const taskItems = tasksOnDay.slice(0, 3).map(task => `
            <div class="calendar-task-item priority-${task.priority}" data-task-id="${task.id}">
                ${this.escapeHtml(task.title)}
            </div>
        `).join('');

        const moreCount = tasksOnDay.length > 3 ? `
            <div class="task-count">+${tasksOnDay.length - 3}件</div>
        ` : '';

        return `
            <div class="${classes.join(' ')}">
                <div class="day-number">${date.getDate()}</div>
                <div class="calendar-tasks">
                    ${taskItems}
                    ${moreCount}
                </div>
            </div>
        `;
    }

    renderWeekView() {
        const weekStart = this.getWeekStart(this.currentDate);
        const hours = Array.from({length: 24}, (_, i) => i);

        let html = '';
        hours.forEach(hour => {
            html += `<div class="week-time-slot">${hour}:00</div>`;
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + i);
                const tasks = this.getTasksForDate(date);
                const taskItems = tasks.map(task => `
                    <div class="calendar-task-item priority-${task.priority}" data-task-id="${task.id}">
                        ${this.escapeHtml(task.title)}
                    </div>
                `).join('');
                html += `<div class="week-day-slot">${taskItems}</div>`;
            }
        });

        this.weekGrid.innerHTML = html;
    }

    renderDayView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        const day = this.currentDate.getDate();
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const weekday = weekdays[this.currentDate.getDay()];

        this.dayHeader.innerHTML = `
            <h3>${year}年${month}月${day}日 (${weekday})</h3>
        `;

        const tasks = this.getTasksForDate(this.currentDate);

        if (tasks.length === 0) {
            this.dayGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h3>この日のタスクはありません</h3>
                </div>
            `;
        } else {
            const taskCards = tasks.map(task => `
                <div class="day-task-card">
                    <div class="task-header">
                        <input type="checkbox"
                               class="task-checkbox"
                               ${task.completed ? 'checked' : ''}
                               data-task-id="${task.id}">
                        <div class="task-content">
                            <div class="task-title">${this.escapeHtml(task.title)}</div>
                            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                            <div class="task-meta">
                                <span class="task-badge priority-${task.priority}">
                                    優先度: ${this.getPriorityLabel(task.priority)}
                                </span>
                                <span class="category-badge">
                                    ${this.getCategoryLabel(task.category)}
                                </span>
                            </div>
                            <div class="task-actions">
                                <button class="btn-edit" data-task-id="${task.id}">編集</button>
                                <button class="btn-delete" data-task-id="${task.id}">削除</button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            this.dayGrid.innerHTML = `<div class="day-task-list">${taskCards}</div>`;
        }
    }

    getTasksForDate(date) {
        return this.taskManager.tasks.filter(task => {
            if (!task.deadline) return false;
            const taskDate = new Date(task.deadline);
            return this.isSameDay(taskDate, date);
        }).sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    getPriorityLabel(priority) {
        const labels = { high: '高', medium: '中', low: '低' };
        return labels[priority] || priority;
    }

    getCategoryLabel(category) {
        const labels = {
            meeting: '会議',
            project: 'プロジェクト',
            decision: '重要決定',
            delegation: 'デリゲーション',
            finance: '財務',
            strategy: '戦略',
            other: 'その他'
        };
        return labels[category] || category;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // タスクが更新されたときにカレンダーを再描画
    refresh() {
        this.render();
    }
}

// アプリケーションの初期化
let taskManager;
let authSystem;
let calendarView;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
    // taskManagerは認証成功後にAuthSystem内で初期化されます
});
