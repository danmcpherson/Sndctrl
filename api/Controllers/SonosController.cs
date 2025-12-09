using Microsoft.AspNetCore.Mvc;
using SonosSoundHub.Models;
using SonosSoundHub.Services;

namespace SonosSoundHub.Controllers;

/// <summary>
/// Controller for Sonos operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SonosController : ControllerBase
{
    private readonly ILogger<SonosController> _logger;
    private readonly SocoCliService _socoCliService;
    private readonly SonosCommandService _commandService;

    public SonosController(
        ILogger<SonosController> logger,
        SocoCliService socoCliService,
        SonosCommandService commandService)
    {
        _logger = logger;
        _socoCliService = socoCliService;
        _commandService = commandService;
    }

    /// <summary>
    /// Gets the status of the soco-cli server
    /// </summary>
    [HttpGet("status")]
    public ActionResult<SocoServerStatus> GetStatus()
    {
        return Ok(_socoCliService.GetStatus());
    }

    /// <summary>
    /// Starts the soco-cli HTTP API server
    /// </summary>
    [HttpPost("start")]
    public async Task<IActionResult> StartServer()
    {
        var result = await _socoCliService.StartServerAsync();
        if (result)
        {
            return Ok(new { message = "Server started successfully" });
        }
        return StatusCode(500, new { message = "Failed to start server" });
    }

    /// <summary>
    /// Stops the soco-cli HTTP API server
    /// </summary>
    [HttpPost("stop")]
    public IActionResult StopServer()
    {
        var result = _socoCliService.StopServer();
        if (result)
        {
            return Ok(new { message = "Server stopped successfully" });
        }
        return StatusCode(500, new { message = "Failed to stop server" });
    }

    /// <summary>
    /// Gets all discovered speakers
    /// </summary>
    [HttpGet("speakers")]
    public async Task<ActionResult<List<string>>> GetSpeakers()
    {
        var speakers = await _commandService.GetSpeakersAsync();
        return Ok(speakers);
    }

    /// <summary>
    /// Triggers speaker rediscovery
    /// </summary>
    [HttpPost("rediscover")]
    public async Task<ActionResult<List<string>>> RediscoverSpeakers()
    {
        var speakers = await _commandService.RediscoverSpeakersAsync();
        return Ok(speakers);
    }

    /// <summary>
    /// Gets detailed information about a speaker
    /// </summary>
    [HttpGet("speakers/{speakerName}")]
    public async Task<ActionResult<Speaker>> GetSpeakerInfo(string speakerName)
    {
        var speaker = await _commandService.GetSpeakerInfoAsync(speakerName);
        return Ok(speaker);
    }

    /// <summary>
    /// Executes a command on a speaker
    /// </summary>
    [HttpPost("command")]
    public async Task<ActionResult<SocoCliResponse>> ExecuteCommand([FromBody] SonosCommandRequest request)
    {
        var result = await _commandService.ExecuteCommandAsync(
            request.Speaker,
            request.Action,
            request.Args.ToArray()
        );
        return Ok(result);
    }

    /// <summary>
    /// Plays or pauses playback
    /// </summary>
    [HttpPost("speakers/{speakerName}/playpause")]
    public async Task<ActionResult<SocoCliResponse>> PlayPause(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "pauseplay");
        return Ok(result);
    }

    /// <summary>
    /// Sets the volume
    /// </summary>
    [HttpPost("speakers/{speakerName}/volume/{volume}")]
    public async Task<ActionResult<SocoCliResponse>> SetVolume(string speakerName, int volume)
    {
        if (volume < 0 || volume > 100)
        {
            return BadRequest(new { message = "Volume must be between 0 and 100" });
        }

        var result = await _commandService.ExecuteCommandAsync(speakerName, "volume", volume.ToString());
        return Ok(result);
    }

    /// <summary>
    /// Gets the current volume
    /// </summary>
    [HttpGet("speakers/{speakerName}/volume")]
    public async Task<ActionResult<int>> GetVolume(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "volume");
        if (result.ExitCode == 0 && int.TryParse(result.Result, out var volume))
        {
            return Ok(volume);
        }
        return StatusCode(500, new { message = "Failed to get volume" });
    }

    /// <summary>
    /// Toggles mute
    /// </summary>
    [HttpPost("speakers/{speakerName}/mute")]
    public async Task<ActionResult<SocoCliResponse>> ToggleMute(string speakerName)
    {
        // Get current mute state
        var currentState = await _commandService.ExecuteCommandAsync(speakerName, "mute");
        var newState = currentState.Result.ToLower() == "on" ? "off" : "on";
        
        var result = await _commandService.ExecuteCommandAsync(speakerName, "mute", newState);
        return Ok(result);
    }

    /// <summary>
    /// Gets the current track info
    /// </summary>
    [HttpGet("speakers/{speakerName}/track")]
    public async Task<ActionResult<string>> GetCurrentTrack(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "track");
        return Ok(new { track = result.Result });
    }

    /// <summary>
    /// Skips to the next track
    /// </summary>
    [HttpPost("speakers/{speakerName}/next")]
    public async Task<ActionResult<SocoCliResponse>> Next(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "next");
        return Ok(result);
    }

    /// <summary>
    /// Goes to the previous track
    /// </summary>
    [HttpPost("speakers/{speakerName}/previous")]
    public async Task<ActionResult<SocoCliResponse>> Previous(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "previous");
        return Ok(result);
    }

    // ========================================
    // Phase 2: Enhanced Playback Controls & Grouping
    // ========================================

    /// <summary>
    /// Gets all speaker groups
    /// </summary>
    [HttpGet("groups")]
    public async Task<ActionResult<object>> GetGroups()
    {
        // Use any speaker to get groups - they all see the same group info
        var speakers = await _commandService.GetSpeakersAsync();
        if (speakers.Count == 0)
        {
            return Ok(new { groups = new List<object>() });
        }

        var result = await _commandService.ExecuteCommandAsync(speakers[0], "groups");
        return Ok(new { groups = result.Result, exitCode = result.ExitCode });
    }

    /// <summary>
    /// Groups a speaker with another (coordinator)
    /// </summary>
    [HttpPost("speakers/{speakerName}/group/{coordinatorName}")]
    public async Task<ActionResult<SocoCliResponse>> GroupSpeaker(string speakerName, string coordinatorName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "group", coordinatorName);
        return Ok(result);
    }

    /// <summary>
    /// Ungroups a speaker from its group
    /// </summary>
    [HttpPost("speakers/{speakerName}/ungroup")]
    public async Task<ActionResult<SocoCliResponse>> UngroupSpeaker(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "ungroup");
        return Ok(result);
    }

    /// <summary>
    /// Activates party mode (groups all speakers)
    /// </summary>
    [HttpPost("speakers/{speakerName}/party")]
    public async Task<ActionResult<SocoCliResponse>> PartyMode(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "party_mode");
        return Ok(result);
    }

    /// <summary>
    /// Ungroups all speakers
    /// </summary>
    [HttpPost("speakers/{speakerName}/ungroup-all")]
    public async Task<ActionResult<SocoCliResponse>> UngroupAll(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "ungroup_all");
        return Ok(result);
    }

    /// <summary>
    /// Transfers playback to another speaker
    /// </summary>
    [HttpPost("speakers/{speakerName}/transfer/{targetSpeaker}")]
    public async Task<ActionResult<SocoCliResponse>> TransferPlayback(string speakerName, string targetSpeaker)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "transfer_playback", targetSpeaker);
        return Ok(result);
    }

    /// <summary>
    /// Gets or sets shuffle mode
    /// </summary>
    [HttpGet("speakers/{speakerName}/shuffle")]
    public async Task<ActionResult<object>> GetShuffle(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "shuffle");
        return Ok(new { shuffle = result.Result?.ToLower() == "on", raw = result.Result });
    }

    [HttpPost("speakers/{speakerName}/shuffle/{state}")]
    public async Task<ActionResult<SocoCliResponse>> SetShuffle(string speakerName, string state)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "shuffle", state);
        return Ok(result);
    }

    /// <summary>
    /// Gets or sets repeat mode
    /// </summary>
    [HttpGet("speakers/{speakerName}/repeat")]
    public async Task<ActionResult<object>> GetRepeat(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "repeat");
        return Ok(new { repeat = result.Result, exitCode = result.ExitCode });
    }

    [HttpPost("speakers/{speakerName}/repeat/{mode}")]
    public async Task<ActionResult<SocoCliResponse>> SetRepeat(string speakerName, string mode)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "repeat", mode);
        return Ok(result);
    }

    /// <summary>
    /// Gets or sets crossfade mode
    /// </summary>
    [HttpGet("speakers/{speakerName}/crossfade")]
    public async Task<ActionResult<object>> GetCrossfade(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "cross_fade");
        return Ok(new { crossfade = result.Result?.ToLower() == "on", raw = result.Result });
    }

    [HttpPost("speakers/{speakerName}/crossfade/{state}")]
    public async Task<ActionResult<SocoCliResponse>> SetCrossfade(string speakerName, string state)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "cross_fade", state);
        return Ok(result);
    }

    /// <summary>
    /// Gets or sets sleep timer
    /// </summary>
    [HttpGet("speakers/{speakerName}/sleep")]
    public async Task<ActionResult<object>> GetSleepTimer(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "sleep_timer");
        return Ok(new { remaining = result.Result, exitCode = result.ExitCode });
    }

    [HttpPost("speakers/{speakerName}/sleep/{duration}")]
    public async Task<ActionResult<SocoCliResponse>> SetSleepTimer(string speakerName, string duration)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "sleep_timer", duration);
        return Ok(result);
    }

    [HttpDelete("speakers/{speakerName}/sleep")]
    public async Task<ActionResult<SocoCliResponse>> CancelSleepTimer(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "sleep_timer", "off");
        return Ok(result);
    }

    /// <summary>
    /// Seeks to a position in the current track
    /// </summary>
    [HttpPost("speakers/{speakerName}/seek/{position}")]
    public async Task<ActionResult<SocoCliResponse>> Seek(string speakerName, string position)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "seek", position);
        return Ok(result);
    }

    // ========================================
    // Phase 3: Favorites and Playlists
    // ========================================

    /// <summary>
    /// Gets all Sonos favorites
    /// </summary>
    [HttpGet("favorites")]
    public async Task<ActionResult<object>> GetFavorites()
    {
        var speakers = await _commandService.GetSpeakersAsync();
        if (speakers.Count == 0)
        {
            return Ok(new { favorites = new List<object>() });
        }

        var result = await _commandService.ExecuteCommandAsync(speakers[0], "list_favs");
        var favorites = ParseNumberedList(result.Result);
        return Ok(new { favorites, raw = result.Result, exitCode = result.ExitCode });
    }

    /// <summary>
    /// Plays a favorite by name
    /// </summary>
    [HttpPost("speakers/{speakerName}/play-favorite/{favoriteName}")]
    public async Task<ActionResult<SocoCliResponse>> PlayFavorite(string speakerName, string favoriteName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "play_favourite", favoriteName);
        return Ok(result);
    }

    /// <summary>
    /// Plays a favorite by number
    /// </summary>
    [HttpPost("speakers/{speakerName}/play-favorite-number/{number}")]
    public async Task<ActionResult<SocoCliResponse>> PlayFavoriteByNumber(string speakerName, int number)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "play_favourite_number", number.ToString());
        return Ok(result);
    }

    /// <summary>
    /// Gets all Sonos playlists
    /// </summary>
    [HttpGet("playlists")]
    public async Task<ActionResult<object>> GetPlaylists()
    {
        var speakers = await _commandService.GetSpeakersAsync();
        if (speakers.Count == 0)
        {
            return Ok(new { playlists = new List<object>() });
        }

        var result = await _commandService.ExecuteCommandAsync(speakers[0], "list_playlists");
        var playlists = ParseNumberedList(result.Result);
        return Ok(new { playlists, raw = result.Result, exitCode = result.ExitCode });
    }

    /// <summary>
    /// Gets tracks in a playlist
    /// </summary>
    [HttpGet("playlists/{playlistName}/tracks")]
    public async Task<ActionResult<object>> GetPlaylistTracks(string playlistName)
    {
        var speakers = await _commandService.GetSpeakersAsync();
        if (speakers.Count == 0)
        {
            return Ok(new { tracks = new List<object>() });
        }

        var result = await _commandService.ExecuteCommandAsync(speakers[0], "list_playlist_tracks", playlistName);
        var tracks = ParseNumberedList(result.Result);
        return Ok(new { tracks, raw = result.Result, exitCode = result.ExitCode });
    }

    /// <summary>
    /// Gets favorite radio stations (TuneIn)
    /// </summary>
    [HttpGet("radio-stations")]
    public async Task<ActionResult<object>> GetRadioStations()
    {
        var speakers = await _commandService.GetSpeakersAsync();
        if (speakers.Count == 0)
        {
            return Ok(new { stations = new List<object>() });
        }

        var result = await _commandService.ExecuteCommandAsync(speakers[0], "favourite_radio_stations");
        var stations = ParseNumberedList(result.Result);
        return Ok(new { stations, raw = result.Result, exitCode = result.ExitCode });
    }

    /// <summary>
    /// Plays a radio station
    /// </summary>
    [HttpPost("speakers/{speakerName}/play-radio/{stationName}")]
    public async Task<ActionResult<SocoCliResponse>> PlayRadioStation(string speakerName, string stationName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "play_favourite_radio_station", stationName);
        return Ok(result);
    }

    // ========================================
    // Phase 4: Queue Management
    // ========================================

    /// <summary>
    /// Gets the current queue
    /// </summary>
    [HttpGet("speakers/{speakerName}/queue")]
    public async Task<ActionResult<object>> GetQueue(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "list_queue");

        // soco-cli can intermittently return an empty body; retry once if we got an empty result with success
        if (result.ExitCode == 0 && string.IsNullOrWhiteSpace(result.Result))
        {
            _logger.LogWarning("list_queue returned empty result for {Speaker}, retrying", speakerName);
            result = await _commandService.ExecuteCommandAsync(speakerName, "list_queue");
        }

        var tracks = ParseQueueList(result.Result);
        return Ok(new { tracks, raw = result.Result, exitCode = result.ExitCode });
    }

    /// <summary>
    /// Gets the queue length
    /// </summary>
    [HttpGet("speakers/{speakerName}/queue/length")]
    public async Task<ActionResult<object>> GetQueueLength(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "queue_length");
        int.TryParse(result.Result, out var length);
        return Ok(new { length, exitCode = result.ExitCode });
    }

    /// <summary>
    /// Gets the current queue position
    /// </summary>
    [HttpGet("speakers/{speakerName}/queue/position")]
    public async Task<ActionResult<object>> GetQueuePosition(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "queue_position");
        int.TryParse(result.Result, out var position);
        return Ok(new { position, exitCode = result.ExitCode });
    }

    /// <summary>
    /// Plays a track from the queue
    /// </summary>
    [HttpPost("speakers/{speakerName}/queue/play/{trackNumber}")]
    public async Task<ActionResult<SocoCliResponse>> PlayFromQueue(string speakerName, int trackNumber)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "play_from_queue", trackNumber.ToString());
        return Ok(result);
    }

    /// <summary>
    /// Plays the queue from the beginning
    /// </summary>
    [HttpPost("speakers/{speakerName}/queue/play")]
    public async Task<ActionResult<SocoCliResponse>> PlayQueue(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "play_queue");
        return Ok(result);
    }

    /// <summary>
    /// Clears the queue
    /// </summary>
    [HttpDelete("speakers/{speakerName}/queue")]
    public async Task<ActionResult<SocoCliResponse>> ClearQueue(string speakerName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "clear_queue");
        return Ok(result);
    }

    /// <summary>
    /// Removes a track from the queue
    /// </summary>
    [HttpDelete("speakers/{speakerName}/queue/{trackNumber}")]
    public async Task<ActionResult<SocoCliResponse>> RemoveFromQueue(string speakerName, string trackNumber)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "remove_from_queue", trackNumber);
        return Ok(result);
    }

    /// <summary>
    /// Adds a favorite to the queue
    /// </summary>
    [HttpPost("speakers/{speakerName}/queue/add-favorite/{favoriteName}")]
    public async Task<ActionResult<SocoCliResponse>> AddFavoriteToQueue(string speakerName, string favoriteName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "add_favourite_to_queue", favoriteName);
        return Ok(result);
    }

    /// <summary>
    /// Adds a playlist to the queue
    /// </summary>
    [HttpPost("speakers/{speakerName}/queue/add-playlist/{playlistName}")]
    public async Task<ActionResult<SocoCliResponse>> AddPlaylistToQueue(string speakerName, string playlistName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "add_playlist_to_queue", playlistName);
        return Ok(result);
    }

    /// <summary>
    /// Adds a share link (Spotify, Apple Music, etc.) to the queue
    /// </summary>
    [HttpPost("speakers/{speakerName}/queue/add-sharelink")]
    public async Task<ActionResult<SocoCliResponse>> AddShareLinkToQueue(string speakerName, [FromBody] ShareLinkRequest request)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "add_sharelink_to_queue", request.Url);
        return Ok(result);
    }

    /// <summary>
    /// Saves the current queue as a playlist
    /// </summary>
    [HttpPost("speakers/{speakerName}/queue/save/{playlistName}")]
    public async Task<ActionResult<SocoCliResponse>> SaveQueueAsPlaylist(string speakerName, string playlistName)
    {
        var result = await _commandService.ExecuteCommandAsync(speakerName, "save_queue", playlistName);
        return Ok(result);
    }

    // ========================================
    // Helper Methods
    // ========================================

    /// <summary>
    /// Parses a numbered list from soco-cli output (e.g., "1: Item One\n2: Item Two")
    /// </summary>
    private static List<ListItem> ParseNumberedList(string? output)
    {
        var items = new List<ListItem>();
        if (string.IsNullOrWhiteSpace(output)) return items;

        // Known soco-cli status responses that should not be parsed as list items
        var invalidResponses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "on", "off", "stopped", "playing", "paused", "transitioning",
            "in progress", "shuffle", "repeat", "crossfade"
        };

        var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            var trimmed = line.Trim();
            
            // Skip known status responses
            if (invalidResponses.Contains(trimmed))
            {
                continue;
            }
            
            var colonIndex = trimmed.IndexOf(':');
            if (colonIndex > 0 && int.TryParse(trimmed[..colonIndex].Trim(), out var number))
            {
                var name = trimmed[(colonIndex + 1)..].Trim();
                // Only add if the name is not empty and not a status response
                if (!string.IsNullOrWhiteSpace(name) && !invalidResponses.Contains(name))
                {
                    items.Add(new ListItem
                    {
                        Number = number,
                        Name = name
                    });
                }
            }
            // Removed the else branch that was adding non-numbered lines
            // This prevents status messages from being added as list items
        }

        return items;
    }

    /// <summary>
    /// Parses queue items from soco-cli output (format: "  N: Artist: X | Album: Y | Title: Z")
    /// </summary>
    private static List<QueueItem> ParseQueueList(string? output)
    {
        var items = new List<QueueItem>();
        if (string.IsNullOrWhiteSpace(output)) return items;

        var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            // Check for current track marker (* or *>) and remove it
            var isCurrent = line.Contains('*');
            var trimmed = line.Replace("*>", "").Replace("*", "").Trim();
            
            // Find the first colon (after the track number)
            var firstColonIndex = trimmed.IndexOf(':');
            if (firstColonIndex <= 0) continue;
            
            // Try to parse the track number
            if (!int.TryParse(trimmed[..firstColonIndex].Trim(), out var number))
                continue;
            
            var content = trimmed[(firstColonIndex + 1)..].Trim();
            
            // Parse Artist: X | Album: Y | Title: Z format
            string artist = "", album = "", title = "";
            
            var parts = content.Split('|');
            foreach (var part in parts)
            {
                var trimmedPart = part.Trim();
                if (trimmedPart.StartsWith("Artist:", StringComparison.OrdinalIgnoreCase))
                    artist = trimmedPart[7..].Trim();
                else if (trimmedPart.StartsWith("Album:", StringComparison.OrdinalIgnoreCase))
                    album = trimmedPart[6..].Trim();
                else if (trimmedPart.StartsWith("Title:", StringComparison.OrdinalIgnoreCase))
                    title = trimmedPart[6..].Trim();
            }
            
            // If no structured format, use the whole content as title
            if (string.IsNullOrEmpty(title) && string.IsNullOrEmpty(artist))
            {
                title = content;
            }
            
            items.Add(new QueueItem
            {
                Number = number,
                Title = title,
                Artist = artist,
                Album = album,
                IsCurrent = isCurrent
            });
        }

        return items;
    }
}
