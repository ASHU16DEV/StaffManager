module.exports = {
    title: 'Staff Management Bot - Help',
    description: `A comprehensive staff management system with dual-server synchronization.
    
**📋 Staff Commands:**
• \`/stafflist\` - View all staff members (auto-updates)
• \`/inactiverequest\` - Request inactive/absent time (supports flexible duration: 2h, 30m, 5d, 1month)
• \`/resign\` - Resign from staff position

**👔 Manager Commands:**
• \`/promote\` - Promote a user to a staff role
• \`/demote\` - Demote a user from a staff role
• \`/fire\` - Fire a staff member
• \`/staffstats\` - View staff activity statistics and leaderboard
• \`/staffhistory\` - View staff action history
• \`/staffrole\` - Manage staff roles
• \`/staff\` - Manage staff command permissions
• \`/strikeadd\` - Add strike to a staff member (supports flexible duration: 2h, 7d, 1month)
• \`/strikeremove\` - Remove strike(s) from a user
• \`/strikelist\` - View all active strikes
• \`/strikehistory\` - View user's complete strike history

**👑 Owner/Administrator Commands:**
• \`/manager\` - Manage manager roles
• \`/linkserver\` - Link main and staff servers
• \`/rolemap\` - Map roles between servers (shows actual role names)
• \`/reset\` - Reset all bot data (DANGEROUS)
• \`/channelset\` - Set action log channels
• \`/inactiverequestchannel\` - Set inactive request channel
• \`/inactiverole\` - Set inactive role
• \`/rolesynclogchannel\` - Set role sync log channel
• \`/errorlogchannel\` - Set error log channel
• \`/strikechannel\` - Set strike log channel
• \`/strikelimit\` - Set or view maximum strikes before auto-kick

**✨ Features:**
• Automatic role synchronization between main and staff servers
• Activity tracking with messages, commands, and actions
• Flexible duration formats for inactive requests
• Real-time staff list updates every 30 seconds
• Professional embeds with clean design
• Staff performance statistics and leaderboards
• Strike system with auto-kick on limit
• Auto-removal of expired strikes
• Complete strike history tracking`
};
