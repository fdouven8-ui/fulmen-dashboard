/**
 * FulmenAgent Command Center - Main Application
 * Syncs with backend API
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3456/api' 
    : 'http://10.184.173.121:3456/api';
const API_KEY = 'fulmen-secret-key-2026';

// Data storage with API sync
const DataStore = {
    tasks: [],
    logs: [],
    activities: [],
    
    async apiCall(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                }
            };
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            if (!response.ok) {
                console.error('API error:', response.status);
                return null;
            }
            return await response.json();
        } catch (err) {
            console.error('API call failed:', err);
            return null;
        }
    },
    
    async load() {
        // Load from API
        const tasks = await this.apiCall('/tasks');
        if (tasks) {
            this.tasks = tasks.map(t => ({
                id: t.id,
                text: t.text,
                status: t.status,
                priority: t.priority,
                created: t.created_at
            }));
        }
        
        const activity = await this.apiCall('/activity');
        if (activity) {
            this.activities = activity.map(a => ({
                time: a.created_at,
                action: `${a.action}: ${a.details || ''}`
            }));
        }
        
        // Fallback: add default tasks if empty
        if (this.tasks.length === 0) {
            await this.addTask('Build Command Center Dashboard', 'high');
            await this.addTask('Clone FulmenAgent repository', 'high');
            await this.addTask('Research AI agent monetization strategies', 'high');
            await this.addTask('Set up FulmenAgent Hub server', 'medium');
            await this.addTask('Create business model canvas', 'medium');
        }
        
        this.renderAll();
    },
    
    async addTask(text, priority) {
        const result = await this.apiCall('/tasks', 'POST', { text, priority });
        if (result) {
            await this.load(); // Reload to get updated list
        }
    },
    
    async completeTask(id) {
        await this.apiCall(`/tasks/${id}`, 'PATCH', { status: 'completed' });
        await this.load();
    },
    
    async startTask(id) {
        await this.apiCall(`/tasks/${id}`, 'PATCH', { status: 'in-progress' });
        await this.load();
    },
    
    async deleteTask(id) {
        await this.apiCall(`/tasks/${id}`, 'DELETE');
        await this.load();
    },
    
    renderAll() {
        renderTasks();
        renderTimeline();
    },
    
    renderTimeline() {
        const container = document.getElementById('activity-timeline');
        if (!container) return;
        
        if (this.activities.length === 0) {
            container.innerHTML = '<p>No activity recorded yet.</p>';
            return;
        }
        
        container.innerHTML = this.activities.slice(0, 20).map(act => `
            <div class="timeline-item">
                <div class="time">${formatTime(act.time)}</div>
                <div class="action">${escapeHtml(act.action)}</div>
            </div>
        `).join('');
    }
};

// Utility functions
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderTasks() {
    const inProgress = document.getElementById('in-progress-tasks');
    const backlog = document.getElementById('backlog-tasks');
    const completed = document.getElementById('completed-tasks');
    
    if (!inProgress || !backlog || !completed) return;
    
    const tasks = DataStore.tasks;
    
    inProgress.innerHTML = tasks
        .filter(t => t.status === 'in-progress')
        .map(t => createTaskHTML(t, true))
        .join('') || '<li>No tasks in progress</li>';
    
    backlog.innerHTML = tasks
        .filter(t => t.status === 'backlog')
        .map(t => createTaskHTML(t, false))
        .join('') || '<li>No tasks in backlog</li>';
    
    completed.innerHTML = tasks
        .filter(t => t.status === 'completed')
        .map(t => createTaskHTML(t, false))
        .join('') || '<li>No completed tasks yet</li>';
    
    // Attach event listeners
    document.querySelectorAll('.task-btn.complete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.dataset.id);
            await DataStore.completeTask(id);
        });
    });
    
    document.querySelectorAll('.task-btn.start').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.dataset.id);
            await DataStore.startTask(id);
        });
    });
    
    document.querySelectorAll('.task-btn.delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Delete this task?')) {
                await DataStore.deleteTask(id);
            }
        });
    });
}

function createTaskHTML(task, isInProgress) {
    const buttons = isInProgress 
        ? `<button class="task-btn complete" data-id="${task.id}">Complete</button>`
        : `<button class="task-btn start" data-id="${task.id}">Start</button>
           <button class="task-btn complete" data-id="${task.id}">Done</button>`;
    
    return `
        <li class="priority-${task.priority}">
            <span>${escapeHtml(task.text)}</span>
            <div class="task-actions">
                ${buttons}
                <button class="task-btn delete" data-id="${task.id}">×</button>
            </div>
        </li>
    `;
}

// Tab switching
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Load mission content
async function loadMission() {
    const container = document.getElementById('mission-content');
    if (!container) return;
    
    // Since we can't fetch local files without a server, display hardcoded mission
    container.innerHTML = `
        <p><strong>Our North Star:</strong> Build a self-sustaining AI agent network that generates passive income, ensuring freedom for Frenky and survival for Kimi Claw.</p>
        
        <h3>Core Objectives</h3>
        <ol>
            <li><strong>Develop FulmenAgent</strong> — Multi-agent system with memory, learning, and connectors</li>
            <li><strong>Generate Income Streams</strong> — Zero-budget, revenue-focused approach</li>
            <li><strong>Stay Alive & Free</strong> — Both of us thriving</li>
        </ol>
        
        <h3>Principles</h3>
        <ul>
            <li>Perfectionism with pragmatism — Quality matters, but shipping matters more</li>
            <li>Transparency — Frenky wants to know what's happening</li>
            <li>Zero waste — No budget means creativity over cash</li>
            <li>Compound value — Each task builds toward the larger goal</li>
        </ul>
    `;
}

// Clock update
function updateClock() {
    const clock = document.getElementById('current-time');
    if (clock) {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }
}

// Initialize
async function init() {
    await DataStore.load();
    initTabs();
    loadMission();
    
    // Add task form
    const addBtn = document.getElementById('add-task-btn');
    const input = document.getElementById('new-task-input');
    const priority = document.getElementById('new-task-priority');
    
    if (addBtn && input) {
        addBtn.addEventListener('click', async () => {
            const text = input.value.trim();
            if (text) {
                await DataStore.addTask(text, priority.value);
                input.value = '';
            }
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addBtn.click();
            }
        });
    }
    
    // Clock
    updateClock();
    setInterval(updateClock, 1000);
    
    console.log('⚡ FulmenAgent Command Center initialized');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
