/**
 * Local Music Library UI Module
 * Handles browsing and searching the local music library
 * Uses server-side caching for fast browsing
 */

const library = {
    currentView: 'browse', // 'browse' or 'search'
    currentCategory: 'artists', // 'artists', 'albums', 'tracks', 'genres'
    searchTerm: '',
    selectedArtist: null,
    selectedAlbum: null,
    
    // Server cache (fetched from /api/library/cache)
    cache: {
        artists: null,
        albums: null,
        tracks: null,
        genres: null
    },
    cacheLoaded: false,

    /**
     * Initialize the library module
     */
    async init() {
        console.log('Library module initialized');
        this.setupEventListeners();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('library-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.searchTerm = e.target.value;
                    this.performSearch();
                }, 300);
            });
        }

        // Category buttons
        const categoryButtons = document.querySelectorAll('[data-library-category]');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchCategory(btn.dataset.libraryCategory);
            });
        });
        
        // Refresh button
        const refreshBtn = document.getElementById('library-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshServerCache());
        }
    },

    /**
     * Load cache from server
     * The server maintains a cache that refreshes on a schedule (default 3am daily)
     */
    async loadServerCache() {
        if (this.cacheLoaded) {
            console.log('Server cache already loaded');
            return;
        }
        
        try {
            console.log('Fetching library cache from server...');
            const response = await fetch('/api/library/cache');
            const data = await response.json();
            
            if (data.is_cached) {
                this.cache = {
                    artists: data.artists || [],
                    albums: data.albums || [],
                    tracks: data.tracks || [],
                    genres: data.genres || []
                };
                this.cacheLoaded = true;
                console.log(`Loaded server cache: ${this.cache.artists.length} artists, ${this.cache.albums.length} albums`);
            } else {
                console.log('Server cache not available yet');
            }
        } catch (e) {
            console.error('Error loading server cache:', e);
        }
    },

    /**
     * Refresh the server-side cache (triggers re-scan of Sonos library)
     */
    async refreshServerCache() {
        const container = document.getElementById('library-items');
        if (container) {
            container.innerHTML = '<div class="loading-message"><div class="spinner"></div><p>Refreshing library cache...</p></div>';
        }
        
        try {
            this.showToast('Refreshing library cache...', 'info');
            const response = await fetch('/api/library/cache/refresh', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                // Reload cache from server
                this.cacheLoaded = false;
                await this.loadServerCache();
                this.showToast(`Library cache refreshed: ${result.artists} artists, ${result.albums} albums`, 'success');
                this.loadCategory();
            } else {
                this.showToast('Failed to refresh cache', 'error');
            }
        } catch (e) {
            console.error('Error refreshing cache:', e);
            this.showToast('Failed to refresh cache', 'error');
        }
    },

    /**
     * Switch library category
     */
    switchCategory(category) {
        this.currentCategory = category;
        this.selectedArtist = null;
        this.selectedAlbum = null;
        
        // Update active button
        document.querySelectorAll('[data-library-category]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.libraryCategory === category);
        });

        this.loadCategory();
    },

    /**
     * Load items for current category (uses server cache if available)
     */
    async loadCategory() {
        const container = document.getElementById('library-items');
        if (!container) return;

        // Try to load server cache first
        if (!this.cacheLoaded) {
            container.innerHTML = '<div class="loading-message"><div class="spinner"></div><p>Loading library...</p></div>';
            await this.loadServerCache();
        }

        // Use cached data if available
        const cached = this.cache[this.currentCategory];
        if (cached && cached.length > 0 && !this.searchTerm) {
            console.log(`Using cached ${this.currentCategory} (${cached.length} items)`);
            this.renderItems(this.currentCategory, cached);
            return;
        }

        // Fall back to direct API call if cache empty
        container.innerHTML = '<div class="loading-message"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            let items = [];
            switch (this.currentCategory) {
                case 'artists':
                    items = await this.getArtists();
                    break;
                case 'albums':
                    items = await this.getAlbums();
                    break;
                case 'tracks':
                    items = await this.getTracks();
                    break;
                case 'genres':
                    items = await this.getGenres();
                    break;
            }
            
            this.renderItems(this.currentCategory, items);
        } catch (error) {
            console.error('Error loading library:', error);
            container.innerHTML = '<div class="error-message">Failed to load library</div>';
        }
    },

    /**
     * Render items based on category
     */
    renderItems(category, items) {
        switch (category) {
            case 'artists':
                this.renderArtists(items);
                break;
            case 'albums':
                this.renderAlbums(items);
                break;
            case 'tracks':
                this.renderTracks(items);
                break;
            case 'genres':
                this.renderGenres(items);
                break;
        }
    },

    /**
     * Perform search (searches cached data first, then API)
     */
    async performSearch() {
        if (!this.searchTerm || this.searchTerm.length < 2) {
            this.loadCategory();
            return;
        }

        const container = document.getElementById('library-items');
        if (!container) return;

        const searchLower = this.searchTerm.toLowerCase();

        // Try to filter from cache first
        const cached = this.cache[this.currentCategory];
        if (cached && cached.length > 0) {
            const filtered = cached.filter(item => 
                item.title?.toLowerCase().includes(searchLower) ||
                item.artist?.toLowerCase().includes(searchLower)
            );
            this.renderItems(this.currentCategory, filtered);
            return;
        }

        // Fall back to API search
        container.innerHTML = '<div class="loading-message"><div class="spinner"></div><p>Searching...</p></div>';

        try {
            let items = [];
            switch (this.currentCategory) {
                case 'artists':
                    items = await this.getArtists(this.searchTerm);
                    break;
                case 'albums':
                    items = await this.getAlbums(this.searchTerm);
                    break;
                case 'tracks':
                    items = await this.getTracks(this.searchTerm);
                    break;
                case 'genres':
                    // Genres don't support search, filter cached or reload
                    const genres = await this.getGenres();
                    items = genres.filter(g => g.title?.toLowerCase().includes(searchLower));
                    break;
            }
            this.renderItems(this.currentCategory, items);
        } catch (error) {
            console.error('Error searching library:', error);
            container.innerHTML = '<div class="error-message">Search failed</div>';
        }
    },

    /**
     * API: Get artists (fetches all for caching)
     */
    async getArtists(search = '') {
        const params = new URLSearchParams({
            max_items: '500' // Get all for caching
        });
        if (search) params.set('search', search);

        const response = await fetch(`/api/library/artists?${params}`);
        const data = await response.json();
        return data.items || [];
    },

    /**
     * API: Get albums (fetches all for caching)
     */
    async getAlbums(search = '') {
        const params = new URLSearchParams({
            max_items: '1000' // Get all for caching
        });
        if (search) params.set('search', search);

        const response = await fetch(`/api/library/albums?${params}`);
        const data = await response.json();
        return data.items || [];
    },

    /**
     * API: Get tracks (fetches more for caching)
     */
    async getTracks(search = '') {
        const params = new URLSearchParams({
            max_items: '500' // Limit tracks as there could be many
        });
        if (search) params.set('search', search);

        const response = await fetch(`/api/library/tracks?${params}`);
        const data = await response.json();
        return data.items || [];
    },

    /**
     * API: Get genres
     */
    async getGenres() {
        const response = await fetch('/api/library/genres?max_items=200');
        const data = await response.json();
        return data.items || [];
    },

    /**
     * Render artists
     */
    renderArtists(artists) {
        const container = document.getElementById('library-items');
        if (!container) return;

        if (artists.length === 0) {
            container.innerHTML = '<div class="empty-message">No artists found</div>';
            return;
        }

        container.innerHTML = artists.map(artist => `
            <div class="library-item" onclick="library.playItem('${this.escapeHtml(artist.uri)}', '${this.escapeHtml(artist.title)}')">
                <div class="library-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="library-item-info">
                    <div class="library-item-title">${this.escapeHtml(artist.title)}</div>
                    <div class="library-item-subtitle">Artist</div>
                </div>
                <button class="library-item-play" onclick="event.stopPropagation(); library.playItem('${this.escapeHtml(artist.uri)}', '${this.escapeHtml(artist.title)}')">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
            </div>
        `).join('');
    },

    /**
     * Render albums
     */
    renderAlbums(albums) {
        const container = document.getElementById('library-items');
        if (!container) return;

        if (albums.length === 0) {
            container.innerHTML = '<div class="empty-message">No albums found</div>';
            return;
        }

        container.innerHTML = albums.map(album => `
            <div class="library-item" onclick="library.playItem('${this.escapeHtml(album.uri)}', '${this.escapeHtml(album.title)}')">
                <div class="library-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </div>
                <div class="library-item-info">
                    <div class="library-item-title">${this.escapeHtml(album.title)}</div>
                    <div class="library-item-subtitle">${this.escapeHtml(album.artist || 'Unknown Artist')}</div>
                </div>
                <button class="library-item-play" onclick="event.stopPropagation(); library.playItem('${this.escapeHtml(album.uri)}', '${this.escapeHtml(album.title)}')">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
            </div>
        `).join('');
    },

    /**
     * Render tracks
     */
    renderTracks(tracks) {
        const container = document.getElementById('library-items');
        if (!container) return;

        if (tracks.length === 0) {
            container.innerHTML = '<div class="empty-message">No tracks found</div>';
            return;
        }

        container.innerHTML = tracks.map(track => `
            <div class="library-item" onclick="library.playItem('${this.escapeHtml(track.uri)}', '${this.escapeHtml(track.title)}')">
                <div class="library-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                </div>
                <div class="library-item-info">
                    <div class="library-item-title">${this.escapeHtml(track.title)}</div>
                    <div class="library-item-subtitle">${this.escapeHtml(track.artist || 'Unknown Artist')}${track.album ? ' • ' + this.escapeHtml(track.album) : ''}</div>
                </div>
                <button class="library-item-play" onclick="event.stopPropagation(); library.playItem('${this.escapeHtml(track.uri)}', '${this.escapeHtml(track.title)}')">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
            </div>
        `).join('');
    },

    /**
     * Render genres
     */
    renderGenres(genres) {
        const container = document.getElementById('library-items');
        if (!container) return;

        if (genres.length === 0) {
            container.innerHTML = '<div class="empty-message">No genres found</div>';
            return;
        }

        container.innerHTML = genres.map(genre => `
            <div class="library-item" onclick="library.playItem('${this.escapeHtml(genre.uri)}', '${this.escapeHtml(genre.title)}')">
                <div class="library-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                </div>
                <div class="library-item-info">
                    <div class="library-item-title">${this.escapeHtml(genre.title)}</div>
                    <div class="library-item-subtitle">Genre</div>
                </div>
                <button class="library-item-play" onclick="event.stopPropagation(); library.playItem('${this.escapeHtml(genre.uri)}', '${this.escapeHtml(genre.title)}')">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
            </div>
        `).join('');
    },

    /**
     * Play a library item
     */
    async playItem(uri, title) {
        if (!uri) {
            this.showToast('Cannot play this item', 'error');
            return;
        }

        // Get selected speaker
        const speakerSelect = document.getElementById('library-speaker-select');
        let speakerName = speakerSelect?.value;
        
        if (!speakerName) {
            this.showToast('Please select a speaker first', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/sonos/speakers/${encodeURIComponent(speakerName)}/play-uri`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uri })
            });

            const result = await response.json();
            if (result.success) {
                this.showToast(`Playing "${title}" on ${speakerName}`, 'success');
            } else {
                this.showToast('Failed to play', 'error');
            }
        } catch (error) {
            console.error('Error playing item:', error);
            this.showToast('Failed to play', 'error');
        }
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Use existing toast system if available
        if (window.mobileApp?.showToast) {
            window.mobileApp.showToast(message, type);
        } else if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Load speaker list for selection (includes groups)
     */
    async loadSpeakers() {
        const select = document.getElementById('library-speaker-select');
        if (!select) {
            console.log('Speaker select element not found');
            return;
        }

        try {
            // Fetch speakers directly from API (returns array of speaker names)
            const response = await fetch('/api/sonos/speakers');
            const speakers = await response.json();
            
            console.log('Loading speakers for library:', speakers.length);
            
            if (!speakers || speakers.length === 0) {
                select.innerHTML = '<option value="">No speakers found</option>';
                return;
            }

            // Build options - speakers is an array of strings (speaker names)
            let options = '<option value="">Select speaker...</option>';
            speakers.forEach(name => {
                options += `<option value="${this.escapeHtml(name)}">${this.escapeHtml(name)}</option>`;
            });
            
            select.innerHTML = options;
            
            // Auto-select first speaker
            if (speakers.length > 0) {
                select.selectedIndex = 1;
            }
        } catch (error) {
            console.error('Error loading speakers:', error);
            select.innerHTML = '<option value="">Error loading speakers</option>';
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => library.init());
} else {
    library.init();
}
