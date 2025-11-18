const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    needsParams: true,
    async execute(client, db, errorHandler) {
        console.log(`[Ready] Logged in as ${client.user.tag}`);
        
        const config = client.config;
        
        if (config.bot.activity) {
            const activityTypeMap = {
                'PLAYING': ActivityType.Playing,
                'STREAMING': ActivityType.Streaming,
                'LISTENING': ActivityType.Listening,
                'WATCHING': ActivityType.Watching,
                'COMPETING': ActivityType.Competing
            };

            client.user.setPresence({
                activities: [{
                    name: config.bot.activity.name,
                    type: activityTypeMap[config.bot.activity.type] || ActivityType.Playing
                }],
                status: config.bot.status || 'online'
            });
        }

        console.log(`[Ready] Bot is ready! Serving ${client.guilds.cache.size} servers`);
        console.log(`[Ready] Loaded ${client.commands.size} commands`);

        console.log(`[Ready] Processing pending tasks after restart...`);
        
        const { processExpiredInactiveMembers } = require('../utils/taskProcessor');
        const processedCount = await processExpiredInactiveMembers(client, db, errorHandler);
        
        if (processedCount > 0) {
            console.log(`[Ready] Caught up on ${processedCount} expired inactive members`);
        } else {
            console.log(`[Ready] No pending tasks to process`);
        }
    },
};
