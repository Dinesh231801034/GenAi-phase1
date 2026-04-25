// app.js - Main Application Controller
import { getBotResponse } from './js/chatEngine.js';
import { storage } from './js/storage.js';

// ── State ──────────────────────────────────────────────────────────────────
let chats = storage.getChats();
if (!chats.length) {
  chats = [{ id: Date.now(), title: 'New Chat', messages: [], context: {} }];
  storage.saveChats(chats);
}
let activeId = Number(storage.getActiveId()) || chats[0].id;
let theme = storage.getTheme();

// ── DOM Refs ───────────────────────────────────────────────────────────────
const chatList       = document.getElementById('chat-list');
const messagesEl     = document.getElementById('messages');
const inputEl        = document.getElementById('user-input');
const sendBtn        = document.getElementById('send-btn');
const newChatBtn     = document.getElementById('new-chat-btn');
const themeToggle    = document.getElementById('theme-toggle');
const typingEl       = document.getElementById('typing-indicator');
const sidebarToggle  = document.getElementById('sidebar-toggle');
const sidebar        = document.getElementById('sidebar');
const chatTitle      = document.getElementById('chat-title');

// ── Theme ──────────────────────────────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  storage.saveTheme(theme);
  applyTheme();
});

// ── Sidebar toggle (mobile) ────────────────────────────────────────────────
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// ── Helpers ────────────────────────────────────────────────────────────────
function getActiveChat() {
  return chats.find(c => c.id === activeId);
}

function saveAndRender() {
  storage.saveChats(chats);
  renderChatList();
  renderMessages();
}

// ── Render Chat List ───────────────────────────────────────────────────────
function renderChatList() {
  chatList.innerHTML = '';
  chats.forEach(chat => {
    const li = document.createElement('li');
    li.className = 'chat-item' + (chat.id === activeId ? ' active' : '');
    li.innerHTML = `
      <span class="chat-icon">💬</span>
      <span class="chat-name">${chat.title || 'New Chat'}</span>
      <button class="delete-chat-btn" data-id="${chat.id}" title="Delete">🗑️</button>
    `;
    li.querySelector('.chat-name').addEventListener('click', () => selectChat(chat.id));
    li.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });
    chatList.appendChild(li);
  });
}

// ── Render Messages ────────────────────────────────────────────────────────
function renderMessages() {
  const chat = getActiveChat();
  chatTitle.textContent = chat?.title || 'FAQ Assistant';
  messagesEl.innerHTML = '';

  if (!chat || !chat.messages.length) {
    messagesEl.innerHTML = `
      <div class="welcome-screen">
        <div class="welcome-icon">🤖</div>
        <h2>FAQ Assistant</h2>
        <p>Ask me anything about CS topics or click a quick topic below.</p>
        <div class="quick-buttons">
          <button class="quick-btn" data-query="What is an Operating System?">🖥️ Operating Systems</button>
          <button class="quick-btn" data-query="What is DBMS?">🗄️ DBMS</button>
          <button class="quick-btn" data-query="Explain the OSI model">🌐 Computer Networks</button>
          <button class="quick-btn" data-query="What is OOP?">💻 Programming</button>
          <button class="quick-btn" data-query="What is a Data Structure?">📊 Data Structures</button>
          <button class="quick-btn" data-query="What is Software Engineering?">⚙️ Software Engineering</button>
        </div>
      </div>`;
    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.dataset.query));
    });
    return;
  }

  chat.messages.forEach(msg => appendMessage(msg.role, msg.html, msg.text));
  scrollToBottom();
}

// ── Append Message ─────────────────────────────────────────────────────────
function appendMessage(role, html, text) {
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'bot' ? '🤖' : '👤';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (role === 'bot') {
    bubble.innerHTML = html || text;
  } else {
    bubble.textContent = text;
  }

  if (role === 'bot') {
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
  } else {
    wrapper.appendChild(bubble);
    wrapper.appendChild(avatar);
  }

  messagesEl.appendChild(wrapper);
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── Send Message ───────────────────────────────────────────────────────────
async function sendMessage(text) {
  text = (text || inputEl.value).trim();
  if (!text) return;
  inputEl.value = '';
  sendBtn.disabled = true;

  const chat = getActiveChat();
  if (!chat) return;

  // Title from first message
  if (!chat.messages.length) {
    chat.title = text.length > 32 ? text.substring(0, 32) + '…' : text;
  }

  // Add user message
  chat.messages.push({ role: 'user', text });
  appendMessage('user', null, text);
  scrollToBottom();

  // Show typing
  typingEl.style.display = 'flex';
  scrollToBottom();

  // Delay for realism
  await new Promise(r => setTimeout(r, 600 + Math.random() * 700));

  const result = await getBotResponse(text, chat.context || {});
  chat.context = result.newContext;
  chat.messages.push({ role: 'bot', html: result.html });

  typingEl.style.display = 'none';
  appendMessage('bot', result.html, null);
  scrollToBottom();
  storage.saveChats(chats);
  renderChatList();
  sendBtn.disabled = false;
}

// ── Chat Management ────────────────────────────────────────────────────────
function selectChat(id) {
  activeId = id;
  storage.saveActiveId(id);
  saveAndRender();
  if (window.innerWidth < 768) sidebar.classList.remove('open');
}

function deleteChat(id) {
  chats = chats.filter(c => c.id !== id);
  if (!chats.length) {
    chats = [{ id: Date.now(), title: 'New Chat', messages: [], context: {} }];
  }
  if (activeId === id) activeId = chats[0].id;
  storage.saveActiveId(activeId);
  saveAndRender();
}

newChatBtn.addEventListener('click', () => {
  const nc = { id: Date.now(), title: 'New Chat', messages: [], context: {} };
  chats.unshift(nc);
  activeId = nc.id;
  storage.saveActiveId(activeId);
  saveAndRender();
  if (window.innerWidth < 768) sidebar.classList.remove('open');
});

// ── Input events ───────────────────────────────────────────────────────────
sendBtn.addEventListener('click', () => sendMessage());
inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ── Init ───────────────────────────────────────────────────────────────────
applyTheme();
saveAndRender();
