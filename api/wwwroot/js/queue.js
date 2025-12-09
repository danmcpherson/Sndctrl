/**
 * Queue Management Module
 */
window.queue = {
    currentQueue: [],
    currentPosition: 0,
    selectedSpeaker: null,

    /**
     * Initializes the queue module
     */
    async init() {
        this.setupEventListeners();
    },

    /**
     * Sets up event listeners
     */
    setupEventListeners() {
        // Clear queue button
        document.getElementById('clear-queue-btn')?.addEventListener('click', () => {
            this.clearQueue();
        });

        // Save queue button
        document.getElementById('save-queue-btn')?.addEventListener('click', () => {
            this.showSaveQueueDialog();
        });

        // Add share link button
        document.getElementById('add-sharelink-btn')?.addEventListener('click', () => {
            this.showAddShareLinkDialog();
        });
    },

    /**
     * Loads the queue for the selected speaker
     */
    async load() {
        console.log('queue.load() called');
        const speaker = this.getSelectedSpeaker();
        console.log('Queue load - speaker:', speaker);
        
        if (!speaker) {
            this.showEmptyState('Select a speaker to view its queue');
            return;
        }

        const container = document.getElementById('queue-tracks');
        container.innerHTML = '<div class="loading-message"><div class="spinner"></div><p>Loading queue...</p></div>';

        try {
            const [queueResponse, positionResponse] = await Promise.all([
                api.getQueue(speaker),
                api.getQueuePosition(speaker)
            ]);

            console.log('Queue API response:', queueResponse);
            console.log('Position API response:', positionResponse);

            this.currentQueue = queueResponse.tracks || [];
            this.currentPosition = positionResponse.position || 0;

            // Retry once if we got empty tracks but have raw data (soco-cli sometimes returns partials)
            if (this.currentQueue.length === 0 && queueResponse.exitCode === 0 && queueResponse.raw && queueResponse.raw.trim()) {
                console.log('Queue empty but raw data present, retrying fetch...');
                await new Promise(resolve => setTimeout(resolve, 500));
                const retryResponse = await api.getQueue(speaker);
                console.log('Queue retry response:', retryResponse);
                this.currentQueue = retryResponse.tracks || [];
            }

            console.log('Queue loaded:', this.currentQueue.length, 'tracks');

            this.render();
        } catch (error) {
            console.error('Failed to load queue:', error);
            container.innerHTML = `
                <div class="info-message error">
                    <p>Error loading queue: ${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Renders the queue
     */
    render() {
        const container = document.getElementById('queue-tracks');
        const countEl = document.getElementById('queue-count');

        if (countEl) {
            countEl.textContent = `${this.currentQueue.length} tracks`;
        }

        if (this.currentQueue.length === 0) {
            container.innerHTML = `
                <div class="info-message">
                    <p>Queue is empty. Add favorites or playlists to start.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        this.currentQueue.forEach((track, index) => {
            const trackEl = this.createTrackElement(track, index + 1);
            container.appendChild(trackEl);
        });
    },

    /**
     * Creates a track element for the queue
     * @param {Object} track - The track object
     * @param {number} position - Track position in queue
     * @returns {HTMLElement}
     */
    createTrackElement(track, position) {
        const isPlaying = track.isCurrent || position === this.currentPosition;
        const el = document.createElement('div');
        el.className = `queue-track ${isPlaying ? 'playing' : ''}`;
        el.dataset.position = position;

        // Handle both old format (name) and new format (title/artist/album)
        const title = track.title || track.name || 'Unknown Track';
        const artist = track.artist || '';

        el.innerHTML = `
            <div class="queue-track-position">${position}</div>
            <div class="queue-track-info">
                <div class="queue-track-name">${title}</div>
                ${artist ? `<div class="queue-track-artist">${artist}</div>` : ''}
            </div>
            <div class="queue-track-actions">
                <button class="btn btn-icon btn-sm" title="Play this track" data-action="play">▶</button>
                <button class="btn btn-icon btn-sm" title="Remove from queue" data-action="remove">✕</button>
            </div>
        `;

        el.querySelector('[data-action="play"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.playTrack(position);
        });

        el.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeTrack(position);
        });

        el.addEventListener('click', () => {
            this.playTrack(position);
        });

        return el;
    },

    /**
     * Plays a track from the queue
     * @param {number} position - Track position
     */
    async playTrack(position) {
        const speaker = this.getSelectedSpeaker();
        if (!speaker) {
            showToast('Please select a speaker', 'warning');
            return;
        }

        try {
            await api.playFromQueue(speaker, position);
            this.currentPosition = position;
            this.render();
            showToast('Playing track', 'success');
        } catch (error) {
            showToast(`Failed to play track: ${error.message}`, 'error');
        }
    },

    /**
     * Removes a track from the queue
     * @param {number} position - Track position
     */
    async removeTrack(position) {
        const speaker = this.getSelectedSpeaker();
        if (!speaker) {
            showToast('Please select a speaker', 'warning');
            return;
        }

        try {
            await api.removeFromQueue(speaker, position.toString());
            showToast('Track removed from queue', 'success');
            await this.load();
        } catch (error) {
            showToast(`Failed to remove track: ${error.message}`, 'error');
        }
    },

    /**
     * Clears the entire queue
     */
    async clearQueue() {
        const speaker = this.getSelectedSpeaker();
        if (!speaker) {
            showToast('Please select a speaker', 'warning');
            return;
        }

        if (!confirm('Clear the entire queue?')) return;

        try {
            await api.clearQueue(speaker);
            showToast('Queue cleared', 'success');
            this.currentQueue = [];
            this.render();
        } catch (error) {
            showToast(`Failed to clear queue: ${error.message}`, 'error');
        }
    },

    /**
     * Shows the save queue as playlist dialog
     */
    showSaveQueueDialog() {
        const speaker = this.getSelectedSpeaker();
        if (!speaker) {
            showToast('Please select a speaker', 'warning');
            return;
        }

        if (this.currentQueue.length === 0) {
            showToast('Queue is empty', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Save Queue as Playlist</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="playlist-name-input">Playlist Name</label>
                        <input type="text" id="playlist-name-input" class="form-control" placeholder="Enter playlist name">
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" id="cancel-save">Cancel</button>
                        <button class="btn btn-primary" id="confirm-save">Save</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector('#playlist-name-input');
        input.focus();

        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-save').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        modal.querySelector('#confirm-save').addEventListener('click', async () => {
            const name = input.value.trim();
            if (!name) {
                showToast('Please enter a playlist name', 'warning');
                return;
            }

            try {
                await api.saveQueueAsPlaylist(speaker, name);
                showToast(`Queue saved as "${name}"`, 'success');
                modal.remove();
            } catch (error) {
                showToast(`Failed to save playlist: ${error.message}`, 'error');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                modal.querySelector('#confirm-save').click();
            }
        });
    },

    /**
     * Shows the add share link dialog
     */
    showAddShareLinkDialog() {
        const speaker = this.getSelectedSpeaker();
        if (!speaker) {
            showToast('Please select a speaker', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Add Share Link</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="form-hint" style="margin-bottom: 16px;">
                        Paste a share link from Spotify, Apple Music, Tidal, or Deezer.
                    </p>
                    <div class="form-group">
                        <label for="sharelink-input">Share Link URL</label>
                        <input type="text" id="sharelink-input" class="form-control" 
                               placeholder="https://open.spotify.com/track/...">
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" id="cancel-sharelink">Cancel</button>
                        <button class="btn btn-primary" id="confirm-sharelink">Add to Queue</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector('#sharelink-input');
        input.focus();

        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-sharelink').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        modal.querySelector('#confirm-sharelink').addEventListener('click', async () => {
            const url = input.value.trim();
            if (!url) {
                showToast('Please enter a share link', 'warning');
                return;
            }

            try {
                await api.addShareLinkToQueue(speaker, url);
                showToast('Added to queue', 'success');
                modal.remove();
                await this.load();
            } catch (error) {
                showToast(`Failed to add link: ${error.message}`, 'error');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                modal.querySelector('#confirm-sharelink').click();
            }
        });
    },

    /**
     * Shows empty state message
     * @param {string} message - Message to display
     */
    showEmptyState(message) {
        const container = document.getElementById('queue-tracks');
        container.innerHTML = `
            <div class="info-message">
                <p>${message}</p>
            </div>
        `;
    },

    /**
     * Gets the currently selected speaker
     * @returns {string|null}
     */
    getSelectedSpeaker() {
        const selector = document.getElementById('queue-speaker-select');
        return selector?.value || (speakers.currentSpeakers.length > 0 ? speakers.currentSpeakers[0] : null);
    },

    /**
     * Updates the speaker selector dropdown
     */
    updateSpeakerSelector() {
        const selector = document.getElementById('queue-speaker-select');
        if (!selector) return;

        const currentValue = selector.value;
        selector.innerHTML = speakers.currentSpeakers.map(name => 
            `<option value="${name}" ${name === currentValue ? 'selected' : ''}>${name}</option>`
        ).join('');
    }
};
