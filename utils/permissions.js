function isOwner(userId, config) {
    if (!config || !config.bot || !config.bot.ownerId) return false;
    return userId === config.bot.ownerId;
}

function hasManagerPermission(member, db) {
    if (!member || !member.guild) return false;
    
    try {
        if (member.permissions.has('Administrator')) return true;
        
        const managerRoles = db.getManagerRoles(member.guild.id) || [];
        return member.roles.cache.some(role => managerRoles.includes(role.id));
    } catch (error) {
        console.error('[Permissions] Error in hasManagerPermission:', error.message);
        return false;
    }
}

function hasStaffCommandPermission(member, db) {
    if (!member || !member.guild) return false;
    
    try {
        if (hasManagerPermission(member, db)) return true;
        
        const staffRoles = db.getStaffCommandRoles(member.guild.id) || [];
        return member.roles.cache.some(role => staffRoles.includes(role.id));
    } catch (error) {
        console.error('[Permissions] Error in hasStaffCommandPermission:', error.message);
        return false;
    }
}

function isStaffMember(member, db) {
    if (!member || !member.guild) return false;
    
    try {
        const staffRoles = db.getStaffRoles(member.guild.id) || [];
        return member.roles.cache.some(role => staffRoles.includes(role.id));
    } catch (error) {
        console.error('[Permissions] Error in isStaffMember:', error.message);
        return false;
    }
}

function getUserPermissionLevel(userId, member, db, config) {
    if (isOwner(userId, config)) {
        return 'owner';
    }
    
    if (!member || !member.guild) {
        return null;
    }
    
    try {
        if (hasManagerPermission(member, db)) {
            return 'manager';
        }
        
        if (isStaffMember(member, db)) {
            return 'staff';
        }
    } catch (error) {
        console.error('[Permissions] Error getting permission level:', error);
        return null;
    }
    
    return null;
}

function hasCommandPermission(commandName, userId, member, db, config) {
    if (isOwner(userId, config)) {
        console.log(`[Permissions] User ${userId} (OWNER) can use all commands including /${commandName}`);
        return true;
    }
    
    if (!config || !config.commandPermissions) {
        console.error('[Permissions] Config or commandPermissions missing');
        return false;
    }
    
    const allowedLevels = config.commandPermissions[commandName];
    if (!allowedLevels || !Array.isArray(allowedLevels)) {
        console.warn(`[Permissions] No permissions defined for command: ${commandName}`);
        return false;
    }
    
    const userLevel = getUserPermissionLevel(userId, member, db, config);
    if (!userLevel) {
        console.log(`[Permissions] No permission level for user ${userId} on command ${commandName}`);
        return false;
    }
    
    const hasAccess = allowedLevels.includes(userLevel);
    console.log(`[Permissions] User ${userId} (${userLevel}) ${hasAccess ? 'CAN' : 'CANNOT'} use /${commandName}`);
    
    return hasAccess;
}

function getPermissionErrorMessage(commandName, config) {
    if (!config || !config.commandPermissions) {
        return 'You do not have permission to use this command.';
    }
    
    const allowedLevels = config.commandPermissions[commandName];
    if (!allowedLevels) {
        return 'You do not have permission to use this command.';
    }
    
    if (allowedLevels.includes('owner') && allowedLevels.length === 1) {
        return 'This command is **OWNER ONLY**.\n\nOnly the bot owner can use this command.';
    }
    
    if (allowedLevels.includes('manager') && !allowedLevels.includes('staff')) {
        return 'This command requires **MANAGER** or **OWNER** permissions.\n\nYou need a manager role to use this command.';
    }
    
    return 'You do not have permission to use this command.';
}

module.exports = {
    isOwner,
    hasManagerPermission,
    hasStaffCommandPermission,
    isStaffMember,
    getUserPermissionLevel,
    hasCommandPermission,
    getPermissionErrorMessage
};
