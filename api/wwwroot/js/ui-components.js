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
        
        <div class="volume-control group-volume-control" style="display: none;">
            <div class="volume-label">
                <span class="volume-label-text">
                    <svg class="volume-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </svg>
                    Group
                </span>
                <span class="group-volume-value">--</span>
            </div>
            <input type="range" class="group-volume-slider" min="0" max="100" value="50" 
                   oninput="speakers.setGroupVolume('${speakerName}', this.value)">
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
            <div class="macro-header-content">
                <h3 class="macro-name">${macro.name}</h3>
                ${categoryHtml}
            </div>
            <button class="macro-copy-btn" onclick="macros.copyUrl('${macro.name}')" title="Copy Macro Run Url">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
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
            <button class="btn btn-secondary btn-sm" onclick="macros.duplicate('${macro.name}')">
                Duplicate
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
 * Shows a confirmation modal and returns a promise
 * @param {string} message - The confirmation message
 * @param {string} title - The modal title (optional)
 * @param {string} confirmText - The confirm button text (optional)
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
function showConfirmModal(message, title = 'Confirm Action', confirmText = 'Confirm') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-modal-title');
        const messageEl = document.getElementById('confirm-modal-message');
        const confirmBtn = document.getElementById('confirm-modal-confirm-btn');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;
        
        // Show modal
        modal.classList.add('active');
        
        // Handle confirm
        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };
        
        // Handle cancel
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        // Cleanup function
        const cleanup = () => {
            modal.classList.remove('active');
            confirmBtn.removeEventListener('click', handleConfirm);
        };
        
        // Set up event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        
        // Store cancel handler globally so it can be called from onclick
        window.hideConfirmModal = handleCancel;
    });
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

/**
 * Custom Searchable Dropdown Component
 */
class SearchableDropdown {
    constructor(containerId, options = [], config = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.options = options;
        this.value = null;
        this.onChange = null;
        this.placeholder = 'Select option...';
        this.allowCustom = config.allowCustom || false;
        
        this.render();
        this.attachEvents();
    }
    
    setOptions(options) {
        this.options = options;
        this.renderOptions();
    }
    
    setValue(value) {
        this.value = value;
        this.updateTrigger();
        this.updateSelectedOption();
    }
    
    getValue() {
        return this.value;
    }
    
    render() {
        this.container.classList.add('custom-select-container');
        const searchPlaceholder = this.allowCustom ? 'Search or type custom value...' : 'Search...';
        this.container.innerHTML = `
            <div class="custom-select-trigger" tabindex="0">
                <span>${this.placeholder}</span>
            </div>
            <div class="custom-select-dropdown">
                <div class="custom-select-search">
                    <input type="text" placeholder="${searchPlaceholder}">
                </div>
                <div class="custom-select-options"></div>
            </div>
        `;
        
        this.trigger = this.container.querySelector('.custom-select-trigger');
        this.dropdown = this.container.querySelector('.custom-select-dropdown');
        this.searchInput = this.container.querySelector('input');
        this.optionsContainer = this.container.querySelector('.custom-select-options');
        
        this.renderOptions();
    }
    
    renderOptions() {
        if (this.options.length === 0) {
            this.optionsContainer.innerHTML = '<div class="custom-select-empty">No options available</div>';
            return;
        }
        
        this.optionsContainer.innerHTML = this.options.map(opt => `
            <div class="custom-select-option" data-value="${opt.value}">
                ${opt.label}
            </div>
        `).join('');
        
        this.updateSelectedOption();
    }
    
    updateTrigger() {
        const selectedOption = this.options.find(o => o.value === this.value);
        const span = this.trigger.querySelector('span');
        if (selectedOption) {
            span.textContent = selectedOption.label;
            span.style.color = 'var(--color-gray-900)';
        } else if (this.value) {
            // Display value even if not in options (for custom values)
            span.textContent = this.value;
            span.style.color = 'var(--color-gray-900)';
        } else {
            span.textContent = this.placeholder;
            span.style.color = 'var(--color-gray-500)';
        }
    }
    
    updateSelectedOption() {
        const options = this.optionsContainer.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
            if (opt.dataset.value === this.value) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }
    
    attachEvents() {
        // Toggle dropdown
        this.trigger.addEventListener('click', () => {
            this.toggleDropdown();
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Search filter
        this.searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const options = this.optionsContainer.querySelectorAll('.custom-select-option:not(.custom-select-option-custom)');
            let hasVisible = false;
            
            options.forEach(opt => {
                const text = opt.textContent.toLowerCase();
                if (text.includes(term)) {
                    opt.classList.remove('hidden');
                    hasVisible = true;
                } else {
                    opt.classList.add('hidden');
                }
            });

            // Handle custom value option
            if (this.allowCustom) {
                let customOption = this.optionsContainer.querySelector('.custom-select-option-custom');
                
                if (term) {
                    // Show custom option whenever user is typing (unless exact match exists)
                    const visibleOpts = Array.from(options).filter(opt => !opt.classList.contains('hidden'));
                    const exactMatch = visibleOpts.some(opt => opt.textContent.toLowerCase() === term);
                    
                    if (!exactMatch) {
                        if (!customOption) {
                            customOption = document.createElement('div');
                            customOption.className = 'custom-select-option custom-select-option-custom';
                            this.optionsContainer.prepend(customOption);
                        }
                        customOption.innerHTML = `<span style="font-weight: 600;">✨ Use custom value:</span> "${e.target.value}"`;
                        customOption.dataset.value = e.target.value;
                        customOption.classList.remove('hidden');
                        hasVisible = true;
                    } else if (customOption) {
                        customOption.remove();
                    }
                } else if (customOption) {
                    customOption.remove();
                }
            }
            
            let emptyMsg = this.optionsContainer.querySelector('.custom-select-empty');
            if (!hasVisible) {
                if (!emptyMsg) {
                    emptyMsg = document.createElement('div');
                    emptyMsg.className = 'custom-select-empty';
                    emptyMsg.textContent = 'No matches found';
                    this.optionsContainer.appendChild(emptyMsg);
                }
            } else if (emptyMsg) {
                emptyMsg.remove();
            }
        });
        
        // Select option
        this.optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (option) {
                const value = option.dataset.value;
                this.setValue(value);
                this.closeDropdown();
                if (this.onChange) {
                    this.onChange(value);
                }
            }
        });

        // Handle Enter key in search input
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const customOption = this.optionsContainer.querySelector('.custom-select-option-custom');
                const visibleOptions = Array.from(this.optionsContainer.querySelectorAll('.custom-select-option:not(.hidden):not(.custom-select-option-custom)'));
                
                if (visibleOptions.length === 1) {
                    // Select the single visible option
                    const value = visibleOptions[0].dataset.value;
                    this.setValue(value);
                    this.closeDropdown();
                    if (this.onChange) this.onChange(value);
                } else if (customOption && !customOption.classList.contains('hidden')) {
                    // Select custom option
                    const value = customOption.dataset.value;
                    this.setValue(value);
                    this.closeDropdown();
                    if (this.onChange) this.onChange(value);
                }
            }
        });
    }
    
    toggleDropdown() {
        const isOpen = this.dropdown.classList.contains('open');
        if (isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    openDropdown() {
        this.dropdown.classList.add('open');
        this.trigger.classList.add('active');
        this.searchInput.value = '';
        this.searchInput.focus();
        
        // Reset filter
        const options = this.optionsContainer.querySelectorAll('.custom-select-option');
        options.forEach(opt => opt.classList.remove('hidden'));
        const emptyMsg = this.optionsContainer.querySelector('.custom-select-empty');
        if (emptyMsg && this.options.length > 0) emptyMsg.remove();
    }
    
    closeDropdown() {
        this.dropdown.classList.remove('open');
        this.trigger.classList.remove('active');
    }
}
