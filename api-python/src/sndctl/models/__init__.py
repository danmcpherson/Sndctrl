"""Pydantic models for Sound Control API."""

from .sonos import (
    Speaker,
    SocoCliResponse,
    SocoServerStatus,
    SonosCommandRequest,
    TrackInfo,
    ListItem,
    Favorite,
    QueueItem,
    ShareLinkRequest,
)
from .macro import (
    Macro,
    MacroParameter,
    MacroExecuteRequest,
)
from .voice import (
    ApiKeyRequest,
)

__all__ = [
    "Speaker",
    "SocoCliResponse",
    "SocoServerStatus",
    "SonosCommandRequest",
    "TrackInfo",
    "ListItem",
    "Favorite",
    "QueueItem",
    "ShareLinkRequest",
    "Macro",
    "MacroParameter",
    "MacroExecuteRequest",
    "ApiKeyRequest",
]
