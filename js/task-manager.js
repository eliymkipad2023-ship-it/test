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
            this.taskDeadlineInput.value = task.deadline || '';
        } else {
            this.editingTaskId = null;
            this.formTitle.textContent = '新しいタスクを追加';
            this.taskForm.reset();
        }

        this.taskForm.classList.remove('hidden');
        this.btnShowForm.style.display = 'none';
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline);
        return deadlineDate < today;
    }

    // 日付をフォーマット
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
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
    }
}

// アプリケーションの初期化
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});
