export const createElement = (tag, className, text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
};

export const clearElement = (element) => {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};

export const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with id '${id}' not found`);
    }
    return element;
};