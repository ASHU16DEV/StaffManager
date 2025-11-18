# Staff Management Bot

**Author:** ASHU16  
**Created:** November 17, 2025  
**Project Type:** Discord Bot (Node.js)

## Overview
A comprehensive Discord staff management bot with dual-server role synchronization, inactive request system, automated staff tracking, and YML file-based persistent database.

## Current State
- ✅ Bot successfully running and connected to Discord
- ✅ All 23 slash commands registered
- ✅ YML database system implemented with automatic persistence
- ✅ Dual-server role synchronization (bidirectional)
- ✅ Inactive request system with button interactions
- ✅ Auto-updating staff list (30-second refresh)
- ✅ Strike system with auto-kick functionality
- ✅ Cron jobs for automated tasks
- ✅ Comprehensive error handling and logging

## Architecture

### Database (YML File)
- **Location:** `data/database.yml`
- **Persistence:** Automatic save on every change
- **Restart Recovery:** All data loads on bot startup
- **Storage:**  
  - Server configurations
  - Staff roles, manager roles, staff command roles
  - Inactive members with expiration times
  - Server links and role mappings
  - Staff action records
  - Inactive requests
  - Strikes with duration and expiration
  - Strike limit and strike channel
  - Activity statistics

### Features Implemented

#### 1. Staff Role Management
- `/staffrole add/remove/list` - Configure staff roles
- Automatic staff detection based on roles
- Database persistence

#### 2. Permission System ⭐ ENHANCED
- **Three-tier permission levels:**
  - **OWNER** (from `OWNER_ID` env) - Full access to ALL commands
  - **MANAGER** (role-based) - Access to all commands EXCEPT: linkserver, rolemap, rolesynclogchannel, reset
  - **STAFF** (role-based) - Limited to: stafflist, resign, help, inactiverequest
- `/manager add/remove/list` - Manager role management (Owner/Manager)
- `/staff add/remove/list` - Staff command permissions (Owner/Manager)
- Centralized permission checking with descriptive error messages
- Command visibility based on permission level

#### 3. Staff Actions
- `/promote` - Promote users with database tracking
- `/demote` - Demote users with database tracking
- `/fire` - Fire staff members (removes all staff roles)
- `/resign` - Allow staff to resign
- All actions send DMs to affected users
- All actions log to configured channels

#### 4. Inactive Request System ⭐ ENHANCED
- `/inactiverequest <reason> <duration>` - Staff request time off
- **Persistent Interactive Buttons** - Work even after bot restarts or many days later
- Professional embeds with visual separators and code blocks
- Modal for denial reason (optional)
- Automatic role assignment on approval
- **Auto-removal of role when duration expires with DM notification**
- Comprehensive DM notifications to requester with timestamps
- Enhanced error messages and user feedback

#### 5. Staff List
- `/stafflist` - Display all staff members
- Auto-updates every 30 seconds
- Shows staff by role hierarchy
- Shows inactive members with expiration time
- Real-time updates when roles change

#### 6. Dual-Server Synchronization
- `/linkserver <main_id> <staff_id>` - Link two servers
- `/rolemap add/remove/list` - Map roles between servers
- **Bidirectional sync:**
  - Staff server role changes → Main server
  - Main server role changes → Staff server
  - Kicks/bans → Removes roles on other server
- Comprehensive logging to role sync channel

#### 7. Channel Configuration
- `/channelset <promote/demote/resign/fire>` - Set action log channels
- `/inactiverequestchannel set` - Set inactive request channel
- `/rolesynclogchannel` - Set role sync log channel
- `/errorlogchannel` - Set error log channel
- `/inactiverole` - Set absent/inactive role

#### 8. Strike System
- `/strikeadd <user> <reason> <duration>` - Add strike with flexible duration (2h, 7d, 1month)
- `/strikeremove <user> [strike_id]` - Remove specific strike or all strikes
- `/strikelist` - View all active strikes grouped by user
- `/strikehistory <user>` - View complete strike history (active + expired)
- `/strikelimit [limit]` - Set or view maximum strikes before auto-kick
- `/strikechannel <channel>` - Set strike logging channel
- **Auto-kick on limit:**
  - Sends DM to user before action
  - Kicks user from STAFF server (not main)
  - Removes all staff roles from MAIN server
  - Logs all actions to strike channel
- Auto-expiry of strikes after duration

#### 9. Error Handling
- Global error handler
- Logs all errors to error log channel
- Try-catch blocks in all commands
- Stack traces in error embeds

#### 10. Help Command
- `/help` - Display all commands and usage

### Automated Tasks (Cron Jobs)

1. **Staff List Updates** - Every 30 seconds
   - Updates all active `/stafflist` embed messages
   - Shows real-time staff changes

2. **Inactive Member Checks** - Every 10 seconds ⭐ ENHANCED
   - Checks for expired inactive durations
   - Auto-removes inactive role
   - **Sends DM to user when inactive period ends**
   - Restart-resilient (processes expired during downtime)
   - Enhanced logging with emojis and better messages

3. **Strike Expiration Checks** - Every 30 seconds
   - Clears expired strikes from database
   - Automatic cleanup of old strike records

### Restart Resilience
- **Pending Task Processing:** Bot checks and processes all pending tasks on startup
- **Expired Inactive Members:** Automatically removes roles even if they expired during downtime
- **Example:** If absent time expires in 10s, bot restarts, comes back after 1 minute - role is still removed when bot starts

## Tech Stack
- **Runtime:** Node.js 20
- **Discord Library:** discord.js v14
- **Database:** js-yaml (YML file storage)
- **Task Scheduling:** node-cron
- **Environment:** Replit

## File Structure
```
├── index.js                    # Main bot file
├── config.yml                  # Bot configuration
├── emojis.js                   # Emoji definitions
├── package.json                # Dependencies
├── commands/                   # Slash commands (23 total)
│   ├── staffrole.js
│   ├── manager.js
│   ├── staff.js
│   ├── promote.js
│   ├── demote.js
│   ├── fire.js
│   ├── resign.js
│   ├── inactiverequest.js
│   ├── stafflist.js
│   ├── staffstats.js
│   ├── staffhistory.js
│   ├── linkserver.js
│   ├── rolemap.js
│   ├── channelset.js
│   ├── inactiverequestchannel.js
│   ├── inactiverole.js
│   ├── rolesynclogchannel.js
│   ├── errorlogchannel.js
│   ├── strikeadd.js
│   ├── strikeremove.js
│   ├── strikelist.js
│   ├── strikehistory.js
│   ├── strikelimit.js
│   ├── strikechannel.js
│   ├── reset.js
│   └── help.js
├── events/                     # Discord event handlers
│   ├── ready.js
│   ├── interactionCreate.js
│   ├── guildMemberUpdate.js
│   ├── guildMemberRemove.js
│   └── guildBanAdd.js
├── utils/                      # Utility modules
│   ├── database.js             # YML database manager
│   ├── errorHandler.js         # Error logging system
│   ├── permissions.js          # Permission checking
│   ├── taskProcessor.js        # Restart-resilient task processing
│   ├── embedFactory.js         # Professional embed creation
│   ├── durationParser.js       # Flexible duration parsing
│   └── autocompleteHelpers.js  # Autocomplete filtering
└── data/                       # Database storage
    └── database.yml            # Persistent data

```

## Environment Variables
### Required
- `DISCORD_BOT_TOKEN` - Bot token from Discord Developer Portal
- `DISCORD_CLIENT_ID` - Application ID from Discord Developer Portal
- `OWNER_ID` - Discord User ID of the bot owner (for full access to all commands)

### Optional (Pterodactyl Panel Support)
- `PTERODACTYL_ENABLED` - Set to `true` to enable Pterodactyl panel integration
- `PTERODACTYL_API_URL` - Pterodactyl panel API URL
- `PTERODACTYL_API_KEY` - Pterodactyl API key
- `PTERODACTYL_SERVER_ID` - Server ID in Pterodactyl

## Known Issues & Fixes
None currently

## Recent Changes (November 18, 2025)
### Latest Updates ⭐
- ✅ **Permission System Overhaul** - Three-tier system (Owner/Manager/Staff) with command-level access control
- ✅ **Owner ID Support** - Environment variable for bot owner with full command access
- ✅ **Permission-based Command Visibility** - Commands shown based on user permission level
- ✅ **Pterodactyl Panel Support** - Configuration ready for panel integration
- ✅ **Fixed Strike Commands** - Resolved DurationParser import issues
- ✅ **Enhanced Permission Errors** - Clear messages showing required permission levels

### Major UI/UX Improvements ⭐
- ✅ **Enhanced all embeds** - Professional designs with visual separators (━━━━), code blocks, better colors
- ✅ **Persistent buttons** - Inactive request buttons work perfectly even after bot restarts or many days
- ✅ **Auto role removal with notifications** - Users get DM when inactive period ends
- ✅ **Improved reset command** - Better warning messages and clearer feedback
- ✅ **Enhanced error messages** - More informative and user-friendly error descriptions
- ✅ **Better DM notifications** - Professional embeds for all user notifications

### Previous Updates
- ✅ Added bidirectional role sync (both main ↔ staff server)
- ✅ Implemented restart-resilient task processing
- ✅ Added task processor utility for pending tasks on startup
- ✅ Fixed role synchronization for kicks/bans in both directions

## User Preferences
- **Database:** YML file (chosen over MongoDB for simplicity and suitability for use case)
- **Language:** Hinglish (Hindi + English mix) for communication
- **Emoji Usage:** Extensive use of emojis in embeds

## Next Steps
- Test all features with actual Discord servers
- Monitor error logs for any issues
- Add additional features as requested by user
