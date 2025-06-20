import { saveToStorage, getFromStorage, removeFromStorage } from '../utils/storage.js';
import { getElement } from '../utils/domHelpers.js';

class Auth {
    constructor() {
        // DOM Elements
        this.authContainer = getElement('authContainer');
        this.appContainer = getElement('appContainer');
        this.loginForm = getElement('loginForm');
        this.registrationForm = getElement('registrationForm');
        this.userDisplay = getElement('userDisplay');
        
        this.handleLogin = this.handleLogin.bind(this);
        this.handleRegistration = this.handleRegistration.bind(this);
        this.logout = this.logout.bind(this);
        
        // init
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.loginForm.addEventListener('submit', this.handleLogin);
        this.registrationForm.addEventListener('submit', this.handleRegistration);
        getElement('showLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        getElement('showRegisterLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegistrationForm();
        });
        getElement('logoutButton').addEventListener('click', this.logout);

        getElement('forgotPasswordLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotPasswordModal();
        });
    }

    showLoginForm() {
        this.loginForm.classList.remove('hidden');
        this.registrationForm.classList.add('hidden');
        this.loginForm.reset();
    }

    showRegistrationForm() {
        this.loginForm.classList.add('hidden');
        this.registrationForm.classList.remove('hidden');
        this.registrationForm.reset();
    }

    handleLogin(e) {
        e.preventDefault();
        const email = getElement('loginEmail').value.trim();
        const password = getElement('loginPassword').value;

        const users = getFromStorage('users', []);
        const userIndex = users.findIndex(u => u.email === email && u.password === this.hashPassword(password));
        
        // get user data
        if (userIndex !== -1) {
            const currentUser = users[userIndex];
            saveToStorage('currentUser', currentUser);
            this.userDisplay.textContent = currentUser.username;
            this.showApp();
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: currentUser }));
        } else {
            alert('Invalid email or password!');
        }
    }

    handleRegistration(e) {
        e.preventDefault();
        
        const username = getElement('regUsername').value.trim();
        const email = getElement('regEmail').value.trim();
        const password = getElement('regPassword').value;
        const confirmPassword = getElement('regConfirmPassword').value;

        if (!this.validateRegistration(username, email, password, confirmPassword)) {
            return;
        }

        const newUser = this.createUser(username, email, password);
        this.saveNewUser(newUser);
        
        // clear registration form
        this.registrationForm.reset();
        
        this.showApp();
        
        // login success event with new user data
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: newUser }));
    }

    validateRegistration(username, email, password, confirmPassword) {
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return false;
        }

        if (password.length < 8) {
            alert("Password must be at least 8 characters long!");
            return false;
        }

        const users = getFromStorage('users', []);
        if (users.some(user => user.email === email)) {
            alert('A user with this email already exists!');
            return false;
        }
        if (users.some(user => user.username === username)) {
            alert('This username is already taken!');
            return false;
        }

        return true;
    }

    createUser(username, email, password) {
        return {
            id: Date.now(),
            username,
            email,
            password: this.hashPassword(password),
            todoLists: [],
            todos: []
        };
    }

    saveNewUser(newUser) {
        // get existing users
        const users = getFromStorage('users', []);
        
        // add user
        users.push(newUser);
        
        // save user
        saveToStorage('users', users);
        
        // set current user to the user
        saveToStorage('currentUser', newUser);
        
        // update display
        this.userDisplay.textContent = newUser.username;
        
        console.log('New user created:', newUser);
    }

    logout() {
        removeFromStorage('currentUser');
        this.showAuth();
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }

    checkAuthStatus() {
        const user = getFromStorage('currentUser', null);
        if (user) {
            this.userDisplay.textContent = user.username;
            this.showApp();
            return user;
        } else {
            this.showAuth();
            this.showLoginForm();
            return null;
        }
    }

    showAuth() {
        this.authContainer.classList.remove('hidden');
        this.appContainer.classList.add('hidden');
    }

    showApp() {
        this.authContainer.classList.add('hidden');
        this.appContainer.classList.remove('hidden');
    }

    // simple password hashing
    hashPassword(password) {
        return btoa(password);
    }

    showForgotPasswordModal() {
        const modal = getElement('forgotPasswordModal');
        modal.classList.remove('hidden');
        
        // setup event listeners for the modal
        const okBtn = getElement('forgotPasswordOkBtn');
        const closeBtn = modal.querySelector('.close-modal');
        
        // remove any existing event listeners to stop duplicates
        const newOkBtn = okBtn.cloneNode(true);
        const newCloseBtn = closeBtn.cloneNode(true);
        
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        // add new event listeners
        newOkBtn.addEventListener('click', () => {
            this.hideForgotPasswordModal();
        });
        
        newCloseBtn.addEventListener('click', () => {
            this.hideForgotPasswordModal();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideForgotPasswordModal();
            }
        });
    }

    hideForgotPasswordModal() {
        const modal = getElement('forgotPasswordModal');
        modal.classList.add('hidden');
    }
}

export default Auth;