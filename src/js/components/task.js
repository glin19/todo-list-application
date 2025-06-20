import { getElement, createElement, clearElement } from '../utils/domHelpers.js';
import { formatDate, getTodayDate } from '../utils/dateFormatter.js';

class Task {
    constructor(todoListManager) {
        // DOM Elements
        this.taskInputSection = getElement('taskInputSection');
        this.todoInput = getElement('todoInput');
        this.dueDateInput = getElement('dueDateInput');
        this.priorityInput = getElement('priorityInput');
        this.todoList = getElement('todoList');

        this.todoListManager = todoListManager;
        this.todos = [];
        this.initializeDateInput();
        
        this.addTodo = this.addTodo.bind(this);
        this.deleteTodo = this.deleteTodo.bind(this);
        this.toggleComplete = this.toggleComplete.bind(this);

        // filter elements
        this.statusFilter = getElement('statusFilter');
        this.priorityFilter = getElement('priorityFilter');
        this.sortOption = getElement('sortOption');
        this.searchInput = getElement('searchInput');
        this.filterButton = getElement('filterButton');
        this.filterPanel = getElement('filterPanel');
        this.filterIndicator = getElement('filterIndicator');
        this.applyFiltersBtn = getElement('applyFilters');
        this.clearFiltersBtn = getElement('clearFiltersPanelBtn');
        
        // filter states
        this.filters = {
            status: 'all',
            priority: 'all',
            search: ''
        };
        this.sortBy = 'dueDate';
        this.filterPanelVisible = false;
        
        this.setupEventListeners();
        this.setupFilterEventListeners();
    }

    setupEventListeners() {
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        getElement('addTaskButton').addEventListener('click', this.addTodo);
    }

    initializeDateInput() {
        const today = getTodayDate();
        this.dueDateInput.min = today;
        this.dueDateInput.value = today;
    }

    setupFilterEventListeners() {
        // filter button
        this.filterButton.addEventListener('click', () => {
            this.toggleFilterPanel();
        });
        
        // apply filters
        this.applyFiltersBtn.addEventListener('click', () => {
            this.applyFilters();
            this.toggleFilterPanel(false); // Hide panel
        });
        
        // search input
        this.searchInput.addEventListener('input', () => {
            this.filters.search = this.searchInput.value.trim().toLowerCase();
            this.updateFilterIndicator();
            this.renderTodos();
        });
        
        // clear filters
        getElement('clearFiltersPanelBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        document.addEventListener('click', (e) => {
            if (this.filterPanelVisible && 
                !this.filterPanel.contains(e.target) && 
                !this.filterButton.contains(e.target)) {
                this.toggleFilterPanel(false);
            }
        });
        
        this.updateFilterIndicator();
    }

    toggleFilterPanel(forceState) {
        // forceState is provided, use it, otherwise toggle
        this.filterPanelVisible = forceState !== undefined ? forceState : !this.filterPanelVisible;
        
        if (this.filterPanelVisible) {
            this.filterPanel.classList.add('visible');
            this.filterPanel.classList.remove('hidden');
            this.filterButton.classList.add('active');
        } else {
            this.filterPanel.classList.remove('visible');
            this.filterPanel.classList.add('hidden');
            this.filterButton.classList.remove('active');
        }
    }
    
    applyFilters() {
        this.filters.status = this.statusFilter.value;
        this.filters.priority = this.priorityFilter.value;
        this.sortBy = this.sortOption.value;
        
        this.updateFilterIndicator();
        this.renderTodos();
    }
    
    clearFilters() {
        this.statusFilter.value = 'all';
        this.priorityFilter.value = 'all';
        this.sortOption.value = 'dueDate';
        this.searchInput.value = '';
        
        this.filters.status = 'all';
        this.filters.priority = 'all';
        this.filters.search = '';
        this.sortBy = 'dueDate';
        
        this.updateFilterIndicator();
        this.renderTodos();
    }
    
    updateFilterIndicator() {
        // check active filters
        const hasActiveFilters = 
            this.filters.status !== 'all' || 
            this.filters.priority !== 'all' || 
            this.filters.search !== '';
        
        // update filter
        if (hasActiveFilters) {
            this.filterIndicator.classList.add('active');
            this.clearFiltersBtn.classList.remove('hidden');
        } else {
            this.filterIndicator.classList.remove('active');
            this.clearFiltersBtn.classList.add('hidden');
        }
    }

    filterTodos(todos) {
        return todos.filter(todo => {
            // status filter
            if (this.filters.status === 'active' && todo.completed) return false;
            if (this.filters.status === 'completed' && !todo.completed) return false;
            
            // priority filter
            if (this.filters.priority !== 'all' && todo.priority !== this.filters.priority) return false;
            
            // search filter
            if (this.filters.search && !todo.text.toLowerCase().includes(this.filters.search)) return false;
            
            return true;
        });
    }

    sortTodos(todos) {
        return [...todos].sort((a, b) => {
            // completed tasks go to bottom
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // completed tasks (true) go after incomplete tasks (false)
            }
            
            // apply sorting
            switch(this.sortBy) {
                case 'dueDate':
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority': {
                    const priorityOrder = { high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                case 'name':
                    return a.text.localeCompare(b.text);
                default:
                    return 0;
            }
        });
    }

    createTodoElement(todo) {
        const todoItem = createElement('div', `todo-item ${todo.completed ? 'completed' : ''}`);
        
        const todoContent = createElement('div', 'todo-content');
        const todoText = createElement('div', 'todo-text', todo.text);
        const todoDetails = createElement('div', 'todo-details');
        
        // add list name if in "All Tasks" view
        if (!this.todoListManager.getActiveListId()) {
            const list = this.todoListManager.todoLists.find(l => l.id === todo.listId);
            if (list) {
                const listSpan = createElement('span', '', list.name);
                todoDetails.appendChild(listSpan);
            }
        }
        
        const dateSpan = createElement('span', '', `Due: ${formatDate(todo.dueDate)}`);
        const prioritySpan = createElement('span', 
            `priority-badge priority-${todo.priority}`, 
            todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)
        );
        
        todoDetails.appendChild(dateSpan);
        todoDetails.appendChild(prioritySpan);
        todoContent.appendChild(todoText);
        todoContent.appendChild(todoDetails);
        
        const actions = this.createTodoActions(todo, todoItem);
        
        todoItem.appendChild(todoContent);
        todoItem.appendChild(actions);
        
        return todoItem;
    }

    createTodoActions(todo, todoItem) {
        const actions = createElement('div', 'todo-actions');
        
        const editButton = createElement('button', 'edit-btn', 'Edit');
        editButton.onclick = () => this.editTodo(todo, todoItem);
        
        const completeButton = createElement('button', 'complete-btn', todo.completed ? 'Undo' : 'Complete');
        completeButton.onclick = () => this.toggleComplete(todo, todoItem);
        
        const deleteButton = createElement('button', 'delete-btn', 'Delete');
        deleteButton.onclick = () => this.deleteTodo(todo, todoItem);
        
        actions.appendChild(editButton);
        actions.appendChild(completeButton);
        actions.appendChild(deleteButton);
        
        return actions;
    }

    addTodo() {
        const activeListId = this.todoListManager.getActiveListId();
        if (!activeListId) {
            alert('Please select a todo list first!');
            return;
        }

        const todoText = this.todoInput.value.trim();
        if (todoText === '') {
            alert('Please enter a task!');
            return;
        }

        const todo = {
            id: Date.now(),
            listId: activeListId,
            text: todoText,
            completed: false,
            dueDate: this.dueDateInput.value,
            priority: this.priorityInput.value
        };
        
        this.todos.push(todo);
        this.todoListManager.saveUserData();
        this.renderTodos();
        this.todoListManager.updateTaskCountBadges();
        
        // reset input
        this.todoInput.value = '';
        this.dueDateInput.value = getTodayDate();
        this.priorityInput.value = 'low';
    }

    editTodo(todo, todoItem) {
        const form = createElement('form', 'edit-form');
        
        const textInput = createElement('input');
        textInput.type = 'text';
        textInput.className = 'edit-input';
        textInput.value = todo.text;
        
        const dateInput = createElement('input');
        dateInput.type = 'date';
        dateInput.value = todo.dueDate;
        dateInput.min = getTodayDate();
        
        const prioritySelect = createElement('select');
        prioritySelect.className = 'priority-input';
        prioritySelect.innerHTML = this.priorityInput.innerHTML;
        prioritySelect.value = todo.priority;
        
        const buttonRow = createElement('div', 'button-row');
        
        const saveButton = createElement('button', 'save-btn', 'Save');
        saveButton.type = 'submit';
        
        const cancelButton = createElement('button', 'cancel-btn', 'Cancel');
        cancelButton.type = 'button';
        cancelButton.onclick = () => this.renderTodos();
        
        buttonRow.appendChild(saveButton);
        buttonRow.appendChild(cancelButton);
        
        form.appendChild(textInput);
        form.appendChild(dateInput);
        form.appendChild(prioritySelect);
        form.appendChild(buttonRow);
        
        form.onsubmit = (e) => {
            e.preventDefault();
            todo.text = textInput.value.trim();
            todo.dueDate = dateInput.value;
            todo.priority = prioritySelect.value;
            this.todoListManager.saveUserData();
            this.renderTodos();
        };
        
        clearElement(todoItem);
        todoItem.appendChild(form);
    }

    toggleComplete(todo, todoItem) {
        todo.completed = !todo.completed;
        this.todoListManager.saveUserData();
        this.todoListManager.updateTaskCountBadges();

        todoItem.classList.add('status-changing');
        this.renderTodos();
    }

    deleteTodo(todo, todoItem) {
        todoItem.classList.add('deleting');

        this.todoListManager.updateTaskCountBadges();
        
        // wait for animation to complete then delete
        setTimeout(() => {
            this.todos = this.todos.filter(t => t.id !== todo.id);
            
            // save data and update todos
            this.todoListManager.saveUserData();
            this.renderTodos();
        }, 400); // match the animation duration (0.4s = 400ms)
    }

    deleteTodosByListId(listId) {
        this.todos = this.todos.filter(todo => todo.listId !== listId);
    }

    renderTodos() {
        clearElement(this.todoList);
        let filteredTodos = this.todos;
        
        const activeListId = this.todoListManager.getActiveListId();
        if (activeListId) {
            filteredTodos = this.todos.filter(todo => todo.listId === activeListId);
        }
        
        // filter and sort
        filteredTodos = this.filterTodos(filteredTodos);
        filteredTodos = this.sortTodos(filteredTodos);
        
        if (filteredTodos.length === 0) {
            const emptyMessage = createElement('div', 'empty-list-message');
            if (this.filters.status !== 'all' || this.filters.priority !== 'all' || this.filters.search) {
                emptyMessage.textContent = 'No tasks match your filters';
            } else {
                emptyMessage.textContent = 'No tasks in this list yet.';
            }
            this.todoList.appendChild(emptyMessage);
        } else {
            filteredTodos.forEach(todo => {
                this.todoList.appendChild(this.createTodoElement(todo));
            });
        }
    }

    showTaskInput() {
        this.taskInputSection.classList.remove('hidden');
        getElement('taskFilterSection').classList.remove('hidden');
    }

    hideTaskInput() {
        this.taskInputSection.classList.add('hidden');
    }

    setTodos(todos) {
        this.todos = todos;
    }

    getTodos() {
        return this.todos;
    }
}

export default Task;