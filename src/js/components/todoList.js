import { saveToStorage, getFromStorage } from '../utils/storage.js';
import { getElement, createElement, clearElement } from '../utils/domHelpers.js';
import Task from './task.js';

class TodoList {
    constructor() {
        this.newListButton = getElement('newListButton');
        this.todoListsContainer = getElement('todoListsContainer');
        this.listHeader = getElement('listHeader');
        
        this.newListModal = getElement('newListModal');
        this.modalListInput = getElement('modalListInput');
        this.saveListBtn = getElement('saveListBtn');
        this.cancelListBtn = getElement('cancelListBtn');
        this.closeModalBtn = document.querySelector('.close-modal');
        
        this.todoLists = [];
        this.activeListId = null;
        this.currentUser = null;
        this.taskManager = new Task(this);
        
        this.addTodoList = this.addTodoList.bind(this);
        this.deleteTodoList = this.deleteTodoList.bind(this);
        this.selectTodoList = this.selectTodoList.bind(this);
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.newListButton.addEventListener('click', () => this.showNewListModal());
        this.saveListBtn.addEventListener('click', this.addTodoList);
        this.cancelListBtn.addEventListener('click', () => this.hideNewListModal());
        this.closeModalBtn.addEventListener('click', () => this.hideNewListModal());
        
        this.modalListInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodoList();
        });
        
        // close modal when clicking outside modal
        window.addEventListener('click', (e) => {
            if (e.target === this.newListModal) {
                this.hideNewListModal();
            }
        });

        // user login/logout
        window.addEventListener('userLoggedIn', (e) => {
            this.currentUser = e.detail;
            this.loadUserData();
        });
        
        window.addEventListener('userLoggedOut', () => {
            this.todoLists = [];
            this.activeListId = null;
            this.currentUser = null;
        });
    }

    showNewListModal() {
        this.modalListInput.value = '';
        this.newListModal.classList.remove('hidden');
        this.modalListInput.focus();
    }

    hideNewListModal() {
        this.newListModal.classList.add('hidden');
    }

    addTodoList() {
        const listName = this.modalListInput.value.trim();
        
        if (listName === '') {
            alert('Please enter a list name!');
            return;
        }

        if (this.todoLists.some(list => list.name.toLowerCase() === listName.toLowerCase())) {
            alert('A list with this name already exists!');
            return;
        }

        const list = {
            id: Date.now(),
            name: listName
        };
        
        this.todoLists.push(list);
        this.saveUserData();
        this.renderTodoLists();
        this.hideNewListModal();
    }

    showDeleteConfirmModal(listId, listName) {
        const modal = getElement('deleteConfirmModal');
        const message = getElement('deleteConfirmMessage');
        const listNameSpan = `<span class="list-name-highlight">${listName}</span>`;
        
        // update the confirmation message with the list name
        message.innerHTML = `Are you sure you want to delete ${listNameSpan}? All tasks in this list will be permanently deleted.`;
        
        // show confirmation modal
        modal.classList.remove('hidden');
        
        // setup event listeners for the modal buttons
        const confirmBtn = getElement('confirmDeleteBtn');
        const cancelBtn = getElement('cancelDeleteBtn');
        const closeBtn = modal.querySelector('.close-modal');
        
        // remove any existing event listeners to prevent duplicates
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newCloseBtn = closeBtn.cloneNode(true);
        
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        newConfirmBtn.addEventListener('click', () => {
        this.deleteListConfirmed(listId);
        this.hideDeleteConfirmModal();
        });
        
        newCancelBtn.addEventListener('click', () => {
        this.hideDeleteConfirmModal();
        });
        
        newCloseBtn.addEventListener('click', () => {
        this.hideDeleteConfirmModal();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            this.hideDeleteConfirmModal();
        }
        });
    }
    
    hideDeleteConfirmModal() {
        const modal = getElement('deleteConfirmModal');
        modal.classList.add('hidden');
    }
    
    // actual deletion of list after confirmation from deleteTodoList()
    deleteListConfirmed(listId) {
        this.todoLists = this.todoLists.filter(list => list.id !== listId);
        this.taskManager.deleteTodosByListId(listId);
        this.saveUserData();
        this.renderTodoLists();
        
        if (this.activeListId === listId) {
        this.activeListId = null;
        this.showAllTasks();
        }
    }
    
    deleteTodoList(listId) {
        const list = this.todoLists.find(list => list.id === listId);
        if (list) {
        this.showDeleteConfirmModal(listId, list.name);
        }
    }

    selectTodoList(listId) {
        this.activeListId = listId;
        this.renderTodoLists();
        
        // update header with the selected list name
        const list = this.todoLists.find(l => l.id === listId);
        this.listHeader.innerHTML = `<h1>${list.name}</h1>`;
        
        this.taskManager.showTaskInput();
        this.taskManager.renderTodos();
    }

    showAllTasks() {
        this.activeListId = null;
        this.renderTodoLists();
        
        this.listHeader.innerHTML = '<h1>All Tasks</h1>';
        
        // hide task input as we can't add tasks without a specific list
        this.taskManager.hideTaskInput();
        
        this.taskManager.renderTodos();
    }

    updateTaskCountBadges() {
        const allTodos = this.taskManager.getTodos();
        
        // "All Tasks" badge
        const allTasksItem = this.todoListsContainer.querySelector('.all-tasks-item');
        if (allTasksItem) {
            const allTasksBadge = allTasksItem.querySelector('.task-count-badge');
            const activeTotalTaskCount = allTodos.filter(todo => !todo.completed).length;
            if (allTasksBadge) {
                allTasksBadge.firstChild.textContent = activeTotalTaskCount.toString();
            }
        }
        
        // todo list badges
        this.todoLists.forEach(list => {
            const listItem = this.todoListsContainer.querySelector(`[data-list-id="${list.id}"]`);
            if (listItem) {
                const listBadge = listItem.querySelector('.task-count-badge');
                const activeListTaskCount = allTodos
                    .filter(todo => todo.listId === list.id && !todo.completed).length;
                if (listBadge) {
                    listBadge.firstChild.textContent = activeListTaskCount.toString();
                }
            }
        });
    }

    renderTodoLists() {
        clearElement(this.todoListsContainer);
        
        const allTasksItem = createElement('div', `list-item all-tasks-item ${this.activeListId === null ? 'active' : ''}`);

        allTasksItem.setAttribute('data-list-id', 'all-tasks');
        
        const allTasksIcon = createElement('span', 'list-icon');
        allTasksIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5.25C4 3.45508 5.45507 2 7.25 2H20.75C22.5449 2 24 3.45507 24 5.25V17.3787C23.8796 17.4592 23.7653 17.5527 23.659 17.659L22.5 18.818V5.25C22.5 4.2835 21.7165 3.5 20.75 3.5H7.25C6.2835 3.5 5.5 4.2835 5.5 5.25V22.7497C5.5 23.7162 6.2835 24.4997 7.25 24.4997H15.3177L16.8177 25.9997H7.25C5.45507 25.9997 4 24.5446 4 22.7497V5.25Z" fill="#212121"/><path d="M10.5 8.75C10.5 9.44036 9.94036 10 9.25 10C8.55964 10 8 9.44036 8 8.75C8 8.05964 8.55964 7.5 9.25 7.5C9.94036 7.5 10.5 8.05964 10.5 8.75Z" fill="#212121"/><path d="M9.25 15.2498C9.94036 15.2498 10.5 14.6902 10.5 13.9998C10.5 13.3095 9.94036 12.7498 9.25 12.7498C8.55964 12.7498 8 13.3095 8 13.9998C8 14.6902 8.55964 15.2498 9.25 15.2498Z" fill="#212121"/><path d="M9.25 20.5C9.94036 20.5 10.5 19.9404 10.5 19.25C10.5 18.5596 9.94036 18 9.25 18C8.55964 18 8 18.5596 8 19.25C8 19.9404 8.55964 20.5 9.25 20.5Z" fill="#212121"/><path d="M12.75 8C12.3358 8 12 8.33579 12 8.75C12 9.16421 12.3358 9.5 12.75 9.5H19.25C19.6642 9.5 20 9.16421 20 8.75C20 8.33579 19.6642 8 19.25 8H12.75Z" fill="#212121"/><path d="M12 13.9998C12 13.5856 12.3358 13.2498 12.75 13.2498H19.25C19.6642 13.2498 20 13.5856 20 13.9998C20 14.414 19.6642 14.7498 19.25 14.7498H12.75C12.3358 14.7498 12 14.414 12 13.9998Z" fill="#212121"/><path d="M12.75 18.5C12.3358 18.5 12 18.8358 12 19.25C12 19.6642 12.3358 20 12.75 20H19.25C19.6642 20 20 19.6642 20 19.25C20 18.8358 19.6642 18.5 19.25 18.5H12.75Z" fill="#212121"/><path d="M25.7803 19.7803L19.7803 25.7803C19.6397 25.921 19.4489 26 19.25 26C19.0511 26 18.8603 25.921 18.7197 25.7803L15.7216 22.7823C15.4287 22.4894 15.4287 22.0145 15.7216 21.7216C16.0145 21.4287 16.4894 21.4287 16.7823 21.7216L19.25 24.1893L24.7197 18.7197C25.0126 18.4268 25.4874 18.4268 25.7803 18.7197C26.0732 19.0126 26.0732 19.4874 25.7803 19.7803Z" fill="#212121"/></svg>';

        const allTasksName = createElement('span', 'list-name', 'All Tasks');
        allTasksName.onclick = () => this.showAllTasks();

        // count active tasks for todo lists "All Tasks"
        const allTodos = this.taskManager.getTodos();
        const activeTotalTaskCount = allTodos.filter(todo => !todo.completed).length;
        const taskCountBadge = createElement('span', 'task-count-badge', activeTotalTaskCount.toString());
        
        allTasksItem.appendChild(allTasksIcon);
        allTasksItem.appendChild(allTasksName);
        allTasksItem.appendChild(taskCountBadge);
        this.todoListsContainer.appendChild(allTasksItem);
        
        this.todoLists.forEach(list => {
            const listItem = createElement('div', `list-item ${list.id === this.activeListId ? 'active' : ''}`);

            listItem.setAttribute('data-list-id', list.id);
            
            const listName = createElement('span', 'list-name', list.name);
            listName.onclick = () => this.selectTodoList(list.id);

            // count active tasks for todo lists
            const activeListTaskCount = this.taskManager.getTodos()
                .filter(todo => todo.listId === list.id && !todo.completed).length;
            const listCountBadge = createElement('span', 'task-count-badge', activeListTaskCount.toString());
            
            // trash icon that appears on hover
            const deleteOverlay = createElement('span', 'delete-list-overlay', '');
            deleteOverlay.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path></svg>';

            deleteOverlay.onclick = (e) => {
                e.stopPropagation(); //prevent list selection when clicking trash
                this.showDeleteConfirmModal(list.id, list.name);
            };
            
            listCountBadge.appendChild(deleteOverlay);
            listItem.appendChild(listName);
            listItem.appendChild(listCountBadge);
            this.todoListsContainer.appendChild(listItem);
        });
    }

    loadUserData() {
        if (this.currentUser) {
            const users = getFromStorage('users', []);
            const userData = users.find(u => u.id === this.currentUser.id);
            if (userData) {
                this.todoLists = userData.todoLists || [];
                this.taskManager.setTodos(userData.todos || []);
                this.renderTodoLists();
                this.showAllTasks();
            }
        }
    }

    saveUserData() {
        if (this.currentUser) {
            const users = getFromStorage('users', []);
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = {
                    ...users[userIndex],
                    todoLists: this.todoLists,
                    todos: this.taskManager.getTodos()
                };
                saveToStorage('users', users);
            }
        }
    }

    getActiveListId() {
        return this.activeListId;
    }
}

export default TodoList;