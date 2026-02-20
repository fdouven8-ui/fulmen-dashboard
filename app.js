/**
 * FulmenAgent Command Center - Main Application
 * Local-only, zero external dependencies
 */

// Data storage (in-memory with localStorage backup if available)
const DataStore = {
    tasks: [],
    logs: [],
    activities: [],
    
    load() {
        try {
            const saved = localStorage.getItem('fulmen-data');
            if (saved) {
                const data = JSON.parse(saved);
                this.tasks = data.tasks || [];
                this.logs = data.logs || [];
                this.activities = data.activities || [];
            }
        } catch (e) {
            console.log('localStorage not available, using memory only');
        }
        this.loadFromFiles();
    },
    
    save() {
        try {
            localStorage.setItem('fulmen-data', JSON.stringify({
                tasks: this.tasks,
                logs: this.logs,
                activities: this.activities
            }));
        } catch (e) {
            // Silent fail - memory-only mode
        }
    },
    
    // Attempt to load from local markdown files
    async loadFromFiles() {
        // This would require a file server, so we'll simulate with defaults
        if (this.tasks.length === 0) {
            this.tasks = [
                { id: 1, text: 'Build Command Center Dashboard', status: 'completed', priority: 'high', created: new Date().toISOString() },
                { id: 2, text: 'Clone FulmenAgent repository', status: 'in-progress', priority: 'high', created: new Date().toISOString() },
                { id: 3, text: 'Research AI agent monetization strategies', status: 'backlog', priority: 'high', created: new Date().toISOString() },
                { id: 4, text: 'Set up FulmenAgent Hub server', status: 'backlog', priority: 'medium', created: new Date().toISOString() },
                { id: 5, text: 'Create business model canvas', status: 'backlog', priority: 'medium', created: new Date().toISOString() }
            ];
        }
        
        if (this.activities.length === 0) {
            this.activities = [
                { time: new Date().toISOString(), action: 'Dashboard created and initialized' }
            ];
        }
        
        this.save();
        this.renderAll();
    },
    
    addTask(text, priority) {
        const task = {
            id: Date.now(),
            text,
            priority,
            status: 'backlog',
            created: new Date().toISOString()
        };
        this.tasks.push(task);
        this.save();
        this.renderAll();
        this.addActivity(`Added task: ${text}`);
    },
    
    completeTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = 'completed';
            task.completed = new Date().toISOString();
            this.save();
            this.renderAll();
            this.addActivity(`Completed task: ${task.text}`);
        }
    },
    
    startTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = 'in-progress';
            this.save();
            this.renderAll();
            this.addActivity(`Started task: ${task.text}`);
        }
    },
    
    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.save();
            this.renderAll();
            this.addActivity(`Deleted task: ${task.text}`);
        }
    },
    
    addActivity(action) {
        this.activities.unshift({
            time: new Date().toISOString(),
            action
        });
        // Keep only last 50 activities
        if (this.activities.length > 50) {
            this.activities = this.activities.slice(0, 50);
        }
        this.save();
        this.renderTimeline();
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
        
        container.innerHTML = this.activities.map(act => `
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
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            DataStore.completeTask(id);
        });
    });
    
    document.querySelectorAll('.task-btn.start').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            DataStore.startTask(id);
        });
    });
    
    document.querySelectorAll('.task-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Delete this task?')) {
                DataStore.deleteTask(id);
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
function init() {
    DataStore.load();
    initTabs();
    loadMission();
    
    // Add task form
    const addBtn = document.getElementById('add-task-btn');
    const input = document.getElementById('new-task-input');
    const priority = document.getElementById('new-task-priority');
    
    if (addBtn && input) {
        addBtn.addEventListener('click', () => {
            const text = input.value.trim();
            if (text) {
                DataStore.addTask(text, priority.value);
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
