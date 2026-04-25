// storage.js - LocalStorage utilities
const STORAGE_KEYS = {
  CHATS: 'faq_chats',
  ACTIVE: 'faq_active_chat',
  THEME: 'faq_theme'
};

export const storage = {
  getChats() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS)) || []; }
    catch { return []; }
  },
  saveChats(chats) {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },
  getActiveId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE);
  },
  saveActiveId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE, String(id));
  },
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  },
  saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
};
