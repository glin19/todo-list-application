import { saveToStorage, getFromStorage } from './storage.js';

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.themeToggle = null;
        this.themeIcon = null;
        this.themeText = null;
        
        this.applyTheme(this.currentTheme);
    }

    init() {
        // Get DOM elements
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        this.themeText = null;
        
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        //match current theme
        this.updateThemeUI();
    }

    getStoredTheme() {
        return getFromStorage('theme', 'light');
    }

    saveTheme(theme) {
        saveToStorage('theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveTheme(theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.updateThemeUI();
    }

    updateThemeUI() {
        if (!this.themeIcon) return;

        if (this.currentTheme === 'dark') {
            // light icon
            this.themeIcon.innerHTML = `
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            `;
        } else {
            // dark icon
            this.themeIcon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            `;
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

export default ThemeManager;