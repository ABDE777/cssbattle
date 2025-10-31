// Safe localStorage access utilities
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
    }
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Safe sessionStorage access utilities
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error(`Error reading from sessionStorage key "${key}":`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error writing to sessionStorage key "${key}":`, error);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing from sessionStorage key "${key}":`, error);
    }
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }
};