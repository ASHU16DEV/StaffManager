module.exports = {
    bot: {
        token: process.env.DISCORD_BOT_TOKEN || '',
        clientId: process.env.DISCORD_CLIENT_ID || '',
        ownerId: process.env.OWNER_ID || '',
        status: 'online',
        activity: {
            type: 'WATCHING',
            name: 'over staff members'
        }
    },
    
    settings: {
        footerText: 'Staff Management Bot | Made by ASHU16',
        footerIcon: '',
        embedColor: '#5865F2'
    },
    
    pterodactyl: {
        enabled: process.env.PTERODACTYL_ENABLED === 'true' || false,
        apiUrl: process.env.PTERODACTYL_API_URL || '',
        apiKey: process.env.PTERODACTYL_API_KEY || '',
        serverId: process.env.PTERODACTYL_SERVER_ID || ''
    },
    
    permissions: {
        OWNER: 'owner',
        MANAGER: 'manager',
        STAFF: 'staff'
    },
    
    commandPermissions: {
        help: ['owner', 'manager', 'staff'],
        stafflist: ['owner', 'manager', 'staff'],
        resign: ['owner', 'manager', 'staff'],
        inactiverequest: ['owner', 'manager', 'staff'],
        
        staffrole: ['owner', 'manager'],
        manager: ['owner', 'manager'],
        staff: ['owner', 'manager'],
        promote: ['owner', 'manager'],
        demote: ['owner', 'manager'],
        fire: ['owner', 'manager'],
        inactiverequestchannel: ['owner', 'manager'],
        inactiverole: ['owner', 'manager'],
        channelset: ['owner', 'manager'],
        errorlogchannel: ['owner', 'manager'],
        strikeadd: ['owner', 'manager'],
        strikeremove: ['owner', 'manager'],
        strikelist: ['owner', 'manager'],
        strikehistory: ['owner', 'manager'],
        strikelimit: ['owner', 'manager'],
        strikechannel: ['owner', 'manager'],
        staffstats: ['owner', 'manager'],
        staffhistory: ['owner', 'manager'],
        
        linkserver: ['owner'],
        rolemap: ['owner'],
        rolesynclogchannel: ['owner'],
        reset: ['owner']
    }
};
