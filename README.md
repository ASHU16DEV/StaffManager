# Staff Management Bot

A comprehensive Discord staff management bot with dual-server role synchronization, inactive request system, and automated staff tracking.

**Author:** ASHU16

## Features

- **Staff Role Management**: Automatically detect staff members based on configured roles
- **Promotion & Demotion System**: Track all staff changes with database records
- **Resign & Fire Commands**: Allow staff to resign or be fired with proper logging
- **Interactive Inactive Requests**: Staff can request time off with manager approval system
- **Auto-Updating Staff List**: Real-time staff list that updates every 30 seconds
- **Dual-Server Role Sync**: Automatically sync roles between main and staff servers
- **Comprehensive Logging**: Separate channels for role sync logs and error logs
- **Persistent Database**: All data saved in YML format with automatic recovery

## Setup Instructions

### 1. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section and click "Add Bot"
4. Enable these Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
5. Copy your bot token
6. Go to "OAuth2" > "General" and copy your Application ID (Client ID)

### 2. Configure Bot

1. Open `config.yml` and update:
   - `token`: Your bot token
   - `clientId`: Your application ID
   - Customize `status`, `activity`, and help text as needed

### 3. Invite Bot to Your Servers

Use this URL (replace CLIENT_ID with your Application ID):
```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 4. Run the Bot

```bash
npm start
```

## Commands

### Owner Commands
- `/manager add/remove/list` - Manage manager roles
- `/linkserver` - Link main and staff servers
- `/rolemap add/remove/list` - Map roles between servers
- `/staffrole add/remove/list` - Configure staff roles
- `/inactiverole` - Set inactive/absent role
- `/rolesynclogchannel` - Set role sync log channel
- `/errorlogchannel` - Set error log channel

### Manager Commands
- `/staff add/remove/list` - Manage staff command permissions
- `/promote` - Promote a user
- `/demote` - Demote a user
- `/fire` - Fire a staff member
- `/channelset` - Set action log channels
- `/inactiverequestchannel set` - Set inactive request channel

### Staff Commands
- `/stafflist` - View all staff members (auto-updates)
- `/inactiverequest` - Request inactive time
- `/resign` - Resign from staff position
- `/help` - View help information

## Configuration Guide

### Setting Up Dual-Server Sync

1. Add bot to both main server and staff server
2. Run `/linkserver <main_server_id> <staff_server_id>`
3. Add role mappings: `/rolemap add <main_role_id> <staff_role_id>`
4. Set role sync log channel: `/rolesynclogchannel #channel`

### Setting Up Staff System

1. Configure staff roles: `/staffrole add @role`
2. Set manager roles: `/manager add @role`
3. Set staff command roles: `/staff add @role`
4. Set inactive role: `/inactiverole @role`
5. Configure log channels:
   - `/channelset promote #channel`
   - `/channelset demote #channel`
   - `/channelset resign #channel`
   - `/channelset fire #channel`
   - `/inactiverequestchannel set #channel`
   - `/errorlogchannel #channel`

## Database

All data is stored in `data/database.yml` with automatic saving. The bot will automatically restore all data after restarts, including:
- Server configurations
- Staff roles and manager roles
- Inactive member tracking
- Server links and role mappings
- Staff records

## Support

For issues or questions, contact ASHU16

## License

MIT License
