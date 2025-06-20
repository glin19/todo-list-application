import Auth from './components/auth.js';
import TodoList from './components/todoList.js';
import ThemeManager from './utils/themeManager.js';

class App {
    constructor() {
        this.auth = new Auth();
        this.todoList = new TodoList();
        this.themeManager = new ThemeManager();
        
        // initialize app
        this.init();
    }

    init() {
        // check auth status
        const user = this.auth.checkAuthStatus();

        this.themeManager.init();
        
        if (user) {
            // trigger userLoggedIn to initialize todo list
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
        }
    }
}

// start app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});