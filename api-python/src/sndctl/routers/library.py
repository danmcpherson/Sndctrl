"""Local music library endpoints with server-side caching."""

import logging

from fastapi import APIRouter, HTTPException, Query

from ..models.library import (
    ArtistBrowseResult,
    AlbumBrowseResult,
    TrackBrowseResult,
    GenreBrowseResult,
)
from ..services.soco_service import SoCoService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/library", tags=["library"])

# Service instance set by main app
_soco_service: SoCoService | None = None


def init_router(soco_service: SoCoService):
    """Initialize the router with service instances.
    
    Args:
        soco_service: SoCo service instance.
    """
    global _soco_service
    _soco_service = soco_service
    logger.info("Library router initialized")


def _get_service() -> SoCoService:
    """Get the SoCo service, raising if not initialized."""
    if _soco_service is None:
        raise HTTPException(status_code=503, detail="Library service not initialized")
    return _soco_service


@router.get("/artists", response_model=ArtistBrowseResult)
async def get_artists(
    search: str | None = Query(None, description="Search term to filter artists"),
    max_items: int = Query(100, ge=1, le=1000, description="Maximum items to return"),
) -> ArtistBrowseResult:
    """Get artists from local music library.
    
    Args:
        search: Optional search term to filter artists.
        max_items: Maximum number of items to return (1-1000).
        
    Returns:
        Browse result with artists.
    """
    soco = _get_service()
    return await soco.get_library_artists(search=search, max_items=max_items)


@router.get("/albums", response_model=AlbumBrowseResult)
async def get_albums(
    artist_id: str | None = Query(None, description="Artist ID to filter by"),
    search: str | None = Query(None, description="Search term to filter albums"),
    max_items: int = Query(100, ge=1, le=1000, description="Maximum items to return"),
) -> AlbumBrowseResult:
    """Get albums from local music library.
    
    Args:
        artist_id: Optional artist ID to filter albums.
        search: Optional search term to filter albums.
        max_items: Maximum number of items to return (1-1000).
        
    Returns:
        Browse result with albums.
    """
    soco = _get_service()
    return await soco.get_library_albums(
        artist_id=artist_id,
        search=search,
        max_items=max_items
    )


@router.get("/tracks", response_model=TrackBrowseResult)
async def get_tracks(
    album_id: str | None = Query(None, description="Album ID to browse"),
    search: str | None = Query(None, description="Search term to filter tracks"),
    max_items: int = Query(100, ge=1, le=1000, description="Maximum items to return"),
) -> TrackBrowseResult:
    """Get tracks from local music library.
    
    Args:
        album_id: Optional album ID to browse tracks.
        search: Optional search term to filter tracks.
        max_items: Maximum number of items to return (1-1000).
        
    Returns:
        Browse result with tracks.
    """
    soco = _get_service()
    return await soco.get_library_tracks(
        album_id=album_id,
        search=search,
        max_items=max_items
    )


@router.get("/genres", response_model=GenreBrowseResult)
async def get_genres(
    max_items: int = Query(100, ge=1, le=1000, description="Maximum items to return"),
) -> GenreBrowseResult:
    """Get genres from local music library.
    
    Args:
        max_items: Maximum number of items to return (1-1000).
        
    Returns:
        Browse result with genres.
    """
    soco = _get_service()
    return await soco.get_library_genres(max_items=max_items)


# =============================================================================
# CACHE MANAGEMENT ENDPOINTS
# =============================================================================

@router.get("/cache")
async def get_cache():
    """Get the entire library cache for client-side caching.
    
    Returns all cached library data (artists, albums, tracks, genres).
    The client can cache this and filter locally for faster browsing.
    
    Returns:
        Dict with all cached library items and metadata.
    """
    soco = _get_service()
    return soco.get_library_cache()


@router.get("/cache/status")
async def get_cache_status():
    """Get the status of the library cache.
    
    Returns:
        Dict with cache status information.
    """
    soco = _get_service()
    return soco.get_library_cache_status()


@router.post("/cache/refresh")
async def refresh_cache():
    """Manually refresh the library cache.
    
    This fetches all library data from Sonos and updates the server cache.
    Useful after adding new music to the library.
    
    Returns:
        Dict with counts of cached items.
    """
    soco = _get_service()
    try:
        result = await soco.refresh_library_cache()
        return {
            "success": True,
            "message": "Library cache refreshed",
            **result
        }
    except Exception as e:
        logger.error("Failed to refresh library cache: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
