/**
 * Reusable UI Components
 */

/**
 * Shows a toast notification
 * Shows a toast notification
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Updates the status indicator
 */
function updateStatus(isConnected, message = '') {
    const indicator = document.getElementById('status-indicator');
    const statusText = indicator.querySelector('.status-text');
    
    if (isConnected) {
        indicator.className = 'status-indicator connected';
        statusText.textContent = message || 'Connected';
    } else {
        indicator.className = 'status-indicator error';
        statusText.textContent = message || 'Disconnected';
    }
}

/**
 * Creates a speaker card element with enhanced controls
 */
function createSpeakerCard(speakerName) {
    const card = document.createElement('div');
    card.className = 'speaker-card';
    card.dataset.speaker = speakerName;
    
    card.innerHTML = `
        <div class="speaker-header">
            <div>
                <h3 class="speaker-name">${speakerName}</h3>
                <div class="speaker-group-info" style="display: none;"></div>
            </div>
            <span class="speaker-status stopped">Stopped</span>
        </div>
        
        <div class="speaker-track">
            <div class="track-title">No track playing</div>
            <div class="track-artist"></div>
        </div>
        
        <div class="speaker-controls">
            <button class="control-btn" onclick="speakers.previous('${speakerName}')" title="Previous">⏮︎</button>
            <button class="control-btn primary" onclick="speakers.playPause('${speakerName}')" title="Play/Pause">▶</button>
            <button class="control-btn" onclick="speakers.next('${speakerName}')" title="Next">⏭︎</button>
            <button class="control-btn" onclick="speakers.toggleMute('${speakerName}')" title="Mute">◖</button>
        </div>
        
        <!-- Play Mode Controls (Phase 2) -->
        <div class="playmode-controls">
            <button class="control-btn small playmode-btn" data-control="shuffle" onclick="speakers.toggleShuffle('${speakerName}')" title="Shuffle">
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="4" y1="20" x2="21" y2="3"></line>
                    <polyline points="21 16 21 21 16 21"></polyline>
                    <line x1="15" y1="15" x2="21" y2="21"></line>
                    <line x1="4" y1="4" x2="9" y2="9"></line>
                </svg>
            </button>
            <button class="control-btn small playmode-btn" data-control="repeat" onclick="speakers.cycleRepeat('${speakerName}')" title="Repeat">
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
            </button>
            <button class="control-btn small" onclick="speakers.showSleepTimer('${speakerName}')" title="Sleep Timer">
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            </button>
            <button class="control-btn small" onclick="speakers.showGroupMenu('${speakerName}')" title="Grouping">
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            </button>
        </div>
        
        <div class="volume-control">
            <div class="volume-label">
                <span>Volume</span>
                <span class="volume-value">--</span>
            </div>
            <input type="range" class="volume-slider" min="0" max="100" value="50" 
                   oninput="speakers.setVolume('${speakerName}', this.value)">
        </div>
    `;
    
    return card;
}

/**
 * Creates a macro card element
 */
function createMacroCard(macro) {
    const card = document.createElement('div');
    card.className = `macro-card ${macro.isFavorite ? 'favorite' : ''}`;
    card.dataset.macroName = macro.name;
    
    const categoryHtml = macro.category 
        ? `<span class="macro-category">${macro.category}</span>` 
        : '';
    
    const descriptionHtml = macro.description 
        ? `<p class="macro-description">${macro.description}</p>` 
        : '';
    
    const parametersInfo = macro.parameters && macro.parameters.length > 0
        ? `<small style="color: var(--color-gray-600); display: block; margin-bottom: 8px;">
             Parameters: ${macro.parameters.length}
           </small>`
        : '';
    
    card.innerHTML = `
        <div class="macro-header">
            <h3 class="macro-name">${macro.name}</h3>
            ${categoryHtml}
        </div>
        ${descriptionHtml}
        ${parametersInfo}
        <div class="macro-definition">${macro.definition}</div>
        <div class="macro-actions-bar">
            <button class="btn btn-primary btn-sm" onclick="macros.execute('${macro.name}')">
                Run
            </button>
            <button class="btn btn-secondary btn-sm" onclick="macros.edit('${macro.name}')">
                Edit
            </button>
            <button class="btn btn-secondary btn-sm" onclick="macros.delete('${macro.name}')">
                Delete
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Shows/hides the macro editor modal
 */
function toggleMacroModal(show) {
    const modal = document.getElementById('macro-editor-modal');
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

/**
 * Tab navigation handler
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Trigger tab-specific actions
            console.log('Tab switched to:', tabName);
            switch(tabName) {
                case 'macros':
                    macros.load();
                    break;
                case 'favorites':
                    favorites.updateSpeakerSelector();
                    favorites.switchSubTab('sonos-favorites');
                    break;
                case 'queue':
                    console.log('Loading queue tab...');
                    queue.updateSpeakerSelector();
                    queue.load();
                    break;
            }
        });
    });
}

/**
 * Formats playback state for display
 */
function formatPlaybackState(state) {
    const stateMap = {
        'stopped': 'stopped',
        'paused': 'paused',
        'playing': 'playing',
        'in progress': 'playing',
        'transitioning': 'paused'
    };
    return stateMap[state?.toLowerCase()] || 'stopped';
}

/**
 * Truncates text with ellipsis
 */
function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Debounce function for volume sliders
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
