# ShareLinkPlugin and MusicService Integration

## Overview

Enhanced the `SoCoService` to support container-type favorites (Spotify artists, playlists, etc.) using SoCo's `ShareLinkPlugin` and added `MusicService` helper methods for future features.

## Changes Made

### 1. **Enhanced `play_favorite()` Method**

The method now uses a **three-tier fallback approach**:

```python
# Tier 1: Try favorite.reference property
if hasattr(the_fav, 'reference') and the_fav.reference:
    # Play the referenced DIDL object
    
# Tier 2: Try favorite.resources directly
if the_fav.resources:
    # Play using add_to_queue()
    
# Tier 3: Try ShareLinkPlugin for streaming services
plugin = ShareLinkPlugin(playback_device)
uri = extract_service_uri(the_fav.item_id)  # e.g., spotify:artist:xxx
plugin.add_share_link_to_queue(uri, as_next=True)
```

### 2. **ShareLinkPlugin Integration**

- **Handles container-type favorites** that previously failed
- **Extracts service URIs** from item_id (spotify:, tidal:, apple:)
- **Works with:** Artist pages, playlists, albums from streaming services
- **Automatic fallback:** Only tries ShareLinkPlugin if resources/reference fail

### 3. **MusicService Helper Methods**

Added two new async methods for future features:

#### `search_music_service(service_name, search_term, category)`
Search within a music service (Spotify, Apple Music, etc.)

```python
results = await service.search_music_service(
    'Spotify',
    'Die Antwoord',
    category='artists'
)
```

#### `get_music_service_metadata(service_name, item_id)`
Get metadata for a specific item

```python
metadata = await service.get_music_service_metadata(
    'Spotify',
    'spotify:track:6NmXV4o6bmp704aPGyTVVG'
)
```

## Use Cases

### Previously Failing
```python
# ❌ Would fail with "cannot be played directly"
await service.play_favorite('Office', 'Chet Faker')  # Spotify artist page
```

### Now Working
```python
# ✅ Now works via ShareLinkPlugin
await service.play_favorite('Office', 'Chet Faker')

# Logs:
# INFO: Attempting ShareLinkPlugin for container-type favorite
# INFO: Extracted Spotify URI: spotify:artist:7c0XG5cIJTrrAgEC3ULPiq
# INFO: Using ShareLinkPlugin to add URI: spotify:artist:7c0XG5cIJTrrAgEC3ULPiq
# INFO: Successfully played favorite via ShareLinkPlugin: Chet Faker
```

## Technical Details

### URI Extraction Logic

The code extracts streaming service URIs from the `item_id` field:

```python
# Example item_ids:
# "S://spotify/spotify:artist:7c0XG5cIJTrrAgEC3ULPiq"
# "x-sonos-http:tidal:track:12345?sid=..."

if 'spotify:' in item_id:
    start_idx = item_id.find('spotify:')
    uri = item_id[start_idx:].split('?')[0]  # spotify:artist:xxx
```

### Supported Services

- **Spotify** - `spotify:artist:xxx`, `spotify:playlist:xxx`, `spotify:album:xxx`
- **Tidal** - `tidal:artist:xxx`, `tidal:playlist:xxx`
- **Apple Music** - `apple:artist:xxx`, `apple:playlist:xxx`

## Future Enhancements

The `MusicService` integration enables:

1. **Voice search** - "Play songs by Die Antwoord"
2. **Smart playlists** - Create playlists from search results
3. **Service browsing** - Browse music service catalogs
4. **Recommendations** - Get related artists/tracks
5. **Advanced features** - Lyrics, artist info, similar tracks

## Testing

Test the enhanced favorite playback:

```bash
cd api-python
.venv/bin/python test_favorites_enhanced.py
```

Or via API:

```bash
# Play a container-type favorite
curl -X POST "http://localhost:8000/api/sonos/speakers/Office/play-favorite/Chet%20Faker"

# The response will show success and the logs will detail the ShareLinkPlugin usage
```

## Compatibility

- **Backwards compatible** - All existing favorites still work
- **Graceful fallback** - If ShareLinkPlugin fails, clear error message
- **No breaking changes** - API remains unchanged

## Performance Notes

- `ShareLinkPlugin` is only used as a last resort (Tier 3)
- `MusicService` instances are cached (`@lru_cache`)
- All blocking I/O runs in thread pool via `asyncio.to_thread()`
