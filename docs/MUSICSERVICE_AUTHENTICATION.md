# MusicService Authentication Guide

## Overview

The `MusicService` class from SoCo library allows searching and browsing music services (Spotify, Apple Music, etc.). However, **authentication has significant limitations** for modern Sonos systems.

## ⚠️ Critical Limitation Discovered

**Accounts configured through the modern Sonos app (AppLink/DeviceLink auth) cannot be accessed by SoCo.**

### What This Means

Even if you have Apple Music or Spotify set up in your Sonos app:
- ✅ **Playing favorites works** (uses Sonos system auth)
- ✅ **Browsing through Sonos app works** (native auth)
- ❌ **MusicService search fails** (can't access encrypted credentials)
- ❌ **MusicService metadata fails** (requires search auth)

### Why This Happens

Modern Sonos systems (circa 2020+) use encrypted account storage:
1. When you add a service in the Sonos app, credentials are stored encrypted
2. The old XML endpoint (`/status/accounts`) no longer exposes these credentials
3. SoCo's `Account.get_accounts()` can only retrieve unencrypted legacy accounts
4. AppLink/DeviceLink services (Spotify, Apple Music) use encrypted tokens

### Test Results (Real System)

```bash
$ curl http://<speaker-ip>:1400/status/accounts

# Returns only:
Serial 0: Service Type: 65031 (TuneIn - Anonymous, always works)

# Does NOT return:
# - Apple Music (52231) - configured but encrypted
# - Spotify (2311) - configured but encrypted
```

## Authentication Types

### Anonymous (Works Perfectly)

**Services**: TuneIn, Sonos Radio

**Status**: ✅ Fully functional
- No authentication needed
- Search and browse work immediately
- No setup required

**Example**:
```python
tunein = MusicService('TuneIn')
results = tunein.search(category='stations', term='BBC')
# Returns results immediately
```

### UserId (Legacy - May Work)

**Services**: Deezer (older implementations), some regional services

**Status**: ⚡ Works if configured through legacy methods
- Requires username/password stored in plain text
- Older authentication method
- Rare in modern Sonos systems

### AppLink/DeviceLink (Broken for External Apps)

**Services**: Spotify, Apple Music, Tidal, Amazon Music, YouTube Music

**Status**: ❌ Cannot access credentials
- Modern OAuth-like authentication
- Credentials encrypted and inaccessible
- Configured in Sonos app but SoCo can't retrieve them
- Would require complete re-authentication through SoCo

**Error**:
```
Search failed for Apple Music: ('There was an error processing your request', 'SOAP-ENV:Server')
```

## What Works vs. What Doesn't

### ✅ Working Features (No MusicService Needed)

1. **Play Favorites**
   - Uses Sonos system's existing authentication
   - Works for Spotify, Apple Music, any configured service
   - Uses direct URIs or container references
   - Implemented in our 4-tier fallback system

2. **Speaker Control**
   - Volume, mute, play/pause
   - Grouping, ungrouping
   - Queue management
   - All direct SoCo operations

3. **TuneIn Integration**
   - Search TuneIn stations
   - Browse TuneIn categories
   - Full metadata access
   - No authentication required

### ❌ Broken Features (Need Credentials)

These operations **need configured accounts**:
- ❌ `POST /api/sonos/music-services/{service}/search` - Search music
- ❌ `GET /api/sonos/music-services/{service}/metadata/{item_id}` - Get metadata
- ❌ Voice command "search for artist X" (when implemented)

## Future Enhancements

Potential improvements:

1. **Account Management Endpoint**
   ```
   GET /api/sonos/music-services/accounts
   → Returns list of configured accounts
   ```

2. **Service Status Endpoint**
   ```
   GET /api/sonos/music-services/{service}/status
   → Returns: { "configured": true, "account": "user@example.com" }
   ```

3. **Authentication Flow** (Advanced)
   - Implement device link flow in our API
   - Guide users through linking without Sonos app
   - Requires MusicService.begin_authentication() / complete_authentication()

## Debugging

### Check Configured Accounts

```python
from soco.music_services import Account
import soco

device = soco.discovery.any_soco()
accounts = Account.get_accounts(device)

for serial, account in accounts.items():
    print(f"Account {serial}:")
    print(f"  Service Type: {account.service_type}")
    print(f"  Username: {account.username}")
    print(f"  Nickname: {account.nickname}")
```

### Enable Debug Logging

In `soco_service.py`, the `_get_music_service()` method logs:
- ℹ️ INFO: When using an account
- ⚠️ WARNING: When no account is configured
- ❌ ERROR: When service creation fails

## Conclusion

**Current Reality (Tested on Real System):**

Even though Apple Music shows as "Connected" in your Sonos app:
- ❌ Account credentials are encrypted and inaccessible to SoCo
- ❌ MusicService search/browse fails with SOAP errors
- ✅ Playing Apple Music favorites still works (uses Sonos system auth)

**The Limitation:**
This is a fundamental security restriction in modern Sonos systems (post-2020). AppLink/DeviceLink authenticated services store credentials in an encrypted format that third-party applications cannot access through the `/status/accounts` endpoint.

**What This Means:**
1. **Favorites playback**: ✅ Works perfectly for all services
2. **Direct playback**: ✅ Works with URIs and references  
3. **TuneIn search**: ✅ Works (Anonymous auth)
4. **Spotify/Apple Music search**: ❌ Blocked (encrypted credentials)
5. **Service browse**: ❌ Blocked (same reason)

**Recommendations:**
1. Use favorites for Spotify/Apple Music content (fully functional)
2. Use TuneIn for searchable radio/podcast content
3. Consider implementing SoCo authentication flow if search is critical (complex, several days of work)
4. Focus on what works great: favorites, playback control, TuneIn integration
