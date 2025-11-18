const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

class Database {
    constructor(filePath = './data/database.yml') {
        this.filePath = filePath;
        this.data = {
            servers: {},
            staffRoles: {},
            managerRoles: {},
            staffCommandRoles: {},
            inactiveRequests: [],
            staffRecords: [],
            inactiveMembers: [],
            serverLinks: null,
            roleMaps: [],
            channels: {},
            activityStats: {}
        };
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const fileContents = fs.readFileSync(this.filePath, 'utf8');
                this.data = yaml.load(fileContents) || this.data;
                console.log('[Database] Data loaded successfully');
            } else {
                this.save();
                console.log('[Database] New database file created');
            }
        } catch (error) {
            console.error('[Database] Error loading data:', error);
        }
    }

    save() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const yamlStr = yaml.dump(this.data, { indent: 2 });
            fs.writeFileSync(this.filePath, yamlStr, 'utf8');
        } catch (error) {
            console.error('[Database] Error saving data:', error);
        }
    }

    getServerData(guildId) {
        if (!this.data.servers[guildId]) {
            this.data.servers[guildId] = {
                staffRoles: [],
                managerRoles: [],
                staffCommandRoles: [],
                inactiveRole: null,
                strikes: [],
                strikeLimit: 3,
                strikeChannelId: null,
                channels: {
                    inactiveRequest: null,
                    promote: null,
                    demote: null,
                    resign: null,
                    fire: null,
                    roleSyncLog: null,
                    errorLog: null
                }
            };
            this.save();
        }
        
        // Ensure strike fields exist for older servers
        if (!this.data.servers[guildId].strikes) {
            this.data.servers[guildId].strikes = [];
        }
        if (this.data.servers[guildId].strikeLimit === undefined) {
            this.data.servers[guildId].strikeLimit = 3;
        }
        if (this.data.servers[guildId].strikeChannelId === undefined) {
            this.data.servers[guildId].strikeChannelId = null;
        }
        
        return this.data.servers[guildId];
    }

    addStaffRole(guildId, roleId) {
        const server = this.getServerData(guildId);
        if (!server.staffRoles.includes(roleId)) {
            server.staffRoles.push(roleId);
            this.save();
            return true;
        }
        return false;
    }

    removeStaffRole(guildId, roleId) {
        const server = this.getServerData(guildId);
        const index = server.staffRoles.indexOf(roleId);
        if (index > -1) {
            server.staffRoles.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    getStaffRoles(guildId) {
        return this.getServerData(guildId).staffRoles;
    }

    addManagerRole(guildId, roleId) {
        const server = this.getServerData(guildId);
        if (!server.managerRoles.includes(roleId)) {
            server.managerRoles.push(roleId);
            this.save();
            return true;
        }
        return false;
    }

    removeManagerRole(guildId, roleId) {
        const server = this.getServerData(guildId);
        const index = server.managerRoles.indexOf(roleId);
        if (index > -1) {
            server.managerRoles.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    getManagerRoles(guildId) {
        return this.getServerData(guildId).managerRoles;
    }

    addStaffCommandRole(guildId, roleId) {
        const server = this.getServerData(guildId);
        if (!server.staffCommandRoles.includes(roleId)) {
            server.staffCommandRoles.push(roleId);
            this.save();
            return true;
        }
        return false;
    }

    removeStaffCommandRole(guildId, roleId) {
        const server = this.getServerData(guildId);
        const index = server.staffCommandRoles.indexOf(roleId);
        if (index > -1) {
            server.staffCommandRoles.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    getStaffCommandRoles(guildId) {
        return this.getServerData(guildId).staffCommandRoles;
    }

    setInactiveRole(guildId, roleId) {
        const server = this.getServerData(guildId);
        server.inactiveRole = roleId;
        this.save();
    }

    getInactiveRole(guildId) {
        return this.getServerData(guildId).inactiveRole;
    }

    setChannel(guildId, channelType, channelId) {
        const server = this.getServerData(guildId);
        server.channels[channelType] = channelId;
        this.save();
    }

    getChannel(guildId, channelType) {
        return this.getServerData(guildId).channels[channelType];
    }

    addInactiveRequest(requestData) {
        this.data.inactiveRequests.push(requestData);
        this.save();
    }

    removeInactiveRequest(messageId) {
        this.data.inactiveRequests = this.data.inactiveRequests.filter(
            req => req.messageId !== messageId
        );
        this.save();
    }

    getInactiveRequest(messageId) {
        return this.data.inactiveRequests.find(req => req.messageId === messageId);
    }

    addStaffRecord(record) {
        this.data.staffRecords.push(record);
        this.save();
    }

    getStaffRecords(userId) {
        return this.data.staffRecords.filter(record => record.userId === userId);
    }

    addInactiveMember(memberData) {
        this.data.inactiveMembers.push(memberData);
        this.save();
    }

    removeInactiveMember(userId, guildId) {
        this.data.inactiveMembers = this.data.inactiveMembers.filter(
            member => !(member.userId === userId && member.guildId === guildId)
        );
        this.save();
    }

    getInactiveMember(userId, guildId) {
        return this.data.inactiveMembers.find(
            member => member.userId === userId && member.guildId === guildId
        );
    }

    getAllInactiveMembers() {
        return this.data.inactiveMembers;
    }

    setServerLink(mainServerId, staffServerId) {
        this.data.serverLinks = {
            mainServerId,
            staffServerId
        };
        this.save();
    }

    getServerLink() {
        return this.data.serverLinks;
    }

    addRoleMap(mainRoleId, staffRoleId) {
        const exists = this.data.roleMaps.find(
            map => map.mainRoleId === mainRoleId || map.staffRoleId === staffRoleId
        );
        if (!exists) {
            this.data.roleMaps.push({ mainRoleId, staffRoleId });
            this.save();
            return true;
        }
        return false;
    }

    removeRoleMap(mainRoleId, staffRoleId) {
        const index = this.data.roleMaps.findIndex(
            map => map.mainRoleId === mainRoleId && map.staffRoleId === staffRoleId
        );
        if (index > -1) {
            this.data.roleMaps.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    getRoleMaps() {
        return this.data.roleMaps;
    }

    getMainRoleFromStaffRole(staffRoleId) {
        const map = this.data.roleMaps.find(m => m.staffRoleId === staffRoleId);
        return map ? map.mainRoleId : null;
    }

    getStaffRoleFromMainRole(mainRoleId) {
        const map = this.data.roleMaps.find(m => m.mainRoleId === mainRoleId);
        return map ? map.staffRoleId : null;
    }

    getMainRoleFromStaffRole(staffRoleId) {
        const map = this.data.roleMaps.find(m => m.staffRoleId === staffRoleId);
        return map ? map.mainRoleId : null;
    }

    trackMessage(userId, guildId) {
        if (!this.data.activityStats[userId]) {
            this.data.activityStats[userId] = {
                messages: 0,
                commands: 0,
                actions: 0,
                lastActive: Date.now(),
                guildId: guildId
            };
        }
        this.data.activityStats[userId].messages++;
        this.data.activityStats[userId].lastActive = Date.now();
        this.save();
    }

    trackCommand(userId, guildId) {
        if (!this.data.activityStats[userId]) {
            this.data.activityStats[userId] = {
                messages: 0,
                commands: 0,
                actions: 0,
                lastActive: Date.now(),
                guildId: guildId
            };
        }
        this.data.activityStats[userId].commands++;
        this.data.activityStats[userId].lastActive = Date.now();
        this.save();
    }

    trackAction(userId, guildId) {
        if (!this.data.activityStats[userId]) {
            this.data.activityStats[userId] = {
                messages: 0,
                commands: 0,
                actions: 0,
                lastActive: Date.now(),
                guildId: guildId
            };
        }
        this.data.activityStats[userId].actions++;
        this.data.activityStats[userId].lastActive = Date.now();
        this.save();
    }

    getActivityStats(userId) {
        return this.data.activityStats[userId] || {
            messages: 0,
            commands: 0,
            actions: 0,
            lastActive: null,
            guildId: null
        };
    }

    getAllActivityStats() {
        return this.data.activityStats;
    }

    resetData() {
        this.data = {
            servers: {},
            staffRoles: {},
            managerRoles: {},
            staffCommandRoles: {},
            inactiveRequests: [],
            staffRecords: [],
            inactiveMembers: [],
            serverLinks: null,
            roleMaps: [],
            channels: {},
            activityStats: {}
        };
        this.save();
    }

    getAllStaffRecords() {
        return this.data.staffRecords;
    }

    // Strike System Methods
    addStrike(guildId, userId, reason, duration, addedBy) {
        const server = this.getServerData(guildId);
        const endTime = Date.now() + duration;
        const strike = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId,
            reason,
            addedAt: Date.now(),
            duration,
            endTime,
            addedBy,
            guildId
        };
        
        server.strikes.push(strike);
        this.save();
        return strike;
    }

    removeStrike(guildId, strikeId) {
        const server = this.getServerData(guildId);
        const index = server.strikes.findIndex(s => s.id === strikeId);
        if (index !== -1) {
            const strike = server.strikes[index];
            server.strikes.splice(index, 1);
            this.save();
            return strike;
        }
        return null;
    }

    removeAllUserStrikes(guildId, userId) {
        const server = this.getServerData(guildId);
        const userStrikes = server.strikes.filter(s => s.userId === userId);
        server.strikes = server.strikes.filter(s => s.userId !== userId);
        this.save();
        return userStrikes.length;
    }

    getUserStrikes(guildId, userId) {
        const server = this.getServerData(guildId);
        return server.strikes.filter(s => s.userId === userId && s.endTime > Date.now());
    }

    getAllUserStrikesHistory(guildId, userId) {
        const server = this.getServerData(guildId);
        return server.strikes.filter(s => s.userId === userId);
    }

    getAllStrikes(guildId) {
        const server = this.getServerData(guildId);
        return server.strikes.filter(s => s.endTime > Date.now());
    }

    getAllStrikesHistory(guildId) {
        const server = this.getServerData(guildId);
        return server.strikes;
    }

    clearExpiredStrikes(guildId) {
        const server = this.getServerData(guildId);
        const before = server.strikes.length;
        server.strikes = server.strikes.filter(s => s.endTime > Date.now());
        const after = server.strikes.length;
        
        if (before !== after) {
            this.save();
        }
        
        return before - after;
    }

    clearAllExpiredStrikes() {
        let totalCleared = 0;
        for (const guildId in this.data.servers) {
            totalCleared += this.clearExpiredStrikes(guildId);
        }
        return totalCleared;
    }

    setStrikeLimit(guildId, limit) {
        const server = this.getServerData(guildId);
        server.strikeLimit = limit;
        this.save();
    }

    getStrikeLimit(guildId) {
        const server = this.getServerData(guildId);
        return server.strikeLimit || 3;
    }

    setStrikeChannel(guildId, channelId) {
        const server = this.getServerData(guildId);
        server.strikeChannelId = channelId;
        this.save();
    }

    getStrikeChannel(guildId) {
        const server = this.getServerData(guildId);
        return server.strikeChannelId;
    }
}

module.exports = Database;
