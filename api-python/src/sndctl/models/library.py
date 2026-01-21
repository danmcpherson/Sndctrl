"""Data models for local music library."""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LibraryItem(BaseModel):
    """Base library item."""
    
    model_config = ConfigDict(alias_generator=lambda x: ''.join(
        word.capitalize() if i > 0 else word for i, word in enumerate(x.split('_'))
    ), populate_by_name=True)
    
    id: str = Field(..., description="Item ID")
    title: str = Field(..., description="Item title")
    uri: Optional[str] = Field(None, description="Item URI for playback")


class Artist(LibraryItem):
    """Music artist."""
    
    album_count: Optional[int] = Field(None, description="Number of albums")


class Album(LibraryItem):
    """Music album."""
    
    artist: Optional[str] = Field(None, description="Album artist")
    album_art_uri: Optional[str] = Field(None, description="Album art URL")


class Track(LibraryItem):
    """Music track."""
    
    artist: Optional[str] = Field(None, description="Track artist")
    album: Optional[str] = Field(None, description="Album name")
    album_art_uri: Optional[str] = Field(None, description="Album art URL")
    duration: Optional[str] = Field(None, description="Track duration")


class Genre(LibraryItem):
    """Music genre."""
    
    pass


class BrowseResult(BaseModel):
    """Browse/search results."""
    
    model_config = ConfigDict(alias_generator=lambda x: ''.join(
        word.capitalize() if i > 0 else word for i, word in enumerate(x.split('_'))
    ), populate_by_name=True)
    
    items: list[LibraryItem] = Field(..., description="Result items")
    total_matches: int = Field(..., description="Total matches available")
    number_returned: int = Field(..., description="Number of items returned")


class ArtistBrowseResult(BaseModel):
    """Artist browse results."""
    
    model_config = ConfigDict(alias_generator=lambda x: ''.join(
        word.capitalize() if i > 0 else word for i, word in enumerate(x.split('_'))
    ), populate_by_name=True)
    
    items: list[Artist] = Field(..., description="Artist items")
    total_matches: int = Field(..., description="Total matches available")
    number_returned: int = Field(..., description="Number of items returned")


class AlbumBrowseResult(BaseModel):
    """Album browse results."""
    
    model_config = ConfigDict(alias_generator=lambda x: ''.join(
        word.capitalize() if i > 0 else word for i, word in enumerate(x.split('_'))
    ), populate_by_name=True)
    
    items: list[Album] = Field(..., description="Album items")
    total_matches: int = Field(..., description="Total matches available")
    number_returned: int = Field(..., description="Number of items returned")


class TrackBrowseResult(BaseModel):
    """Track browse results."""
    
    model_config = ConfigDict(alias_generator=lambda x: ''.join(
        word.capitalize() if i > 0 else word for i, word in enumerate(x.split('_'))
    ), populate_by_name=True)
    
    items: list[Track] = Field(..., description="Track items")
    total_matches: int = Field(..., description="Total matches available")
    number_returned: int = Field(..., description="Number of items returned")


class GenreBrowseResult(BaseModel):
    """Genre browse results."""
    
    model_config = ConfigDict(alias_generator=lambda x: ''.join(
        word.capitalize() if i > 0 else word for i, word in enumerate(x.split('_'))
    ), populate_by_name=True)
    
    items: list[Genre] = Field(..., description="Genre items")
    total_matches: int = Field(..., description="Total matches available")
    number_returned: int = Field(..., description="Number of items returned")
