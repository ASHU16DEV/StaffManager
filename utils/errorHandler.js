const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis');

class ErrorHandler {
    constructor(client, db) {
        this.client = client;
        this.db = db;
    }

    async handleError(error, context = {}) {
        console.error('[Error Handler]', error);

        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`${emojis.error} Error Occurred`)
            .setDescription('```' + (error.stack || error.message || 'Unknown error') + '```')
            .addFields(
                { name: 'Context', value: JSON.stringify(context, null, 2).substring(0, 1024) || 'No context', inline: false },
                { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setTimestamp();

        try {
            for (const [guildId, serverData] of Object.entries(this.db.data.servers)) {
                const errorChannelId = serverData.channels?.errorLog;
                if (errorChannelId) {
                    const errorChannel = await this.client.channels.fetch(errorChannelId).catch(() => null);
                    if (errorChannel) {
                        await errorChannel.send({ embeds: [errorEmbed] });
                    }
                }
            }
        } catch (logError) {
            console.error('[Error Handler] Failed to send error to channel:', logError);
        }
    }

    async logToChannel(guildId, channelType, embed) {
        try {
            const channelId = this.db.getChannel(guildId, channelType);
            if (!channelId) return;

            const channel = await this.client.channels.fetch(channelId).catch(() => null);
            if (!channel) return;

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`[Error Handler] Failed to log to ${channelType} channel:`, error);
        }
    }

    async sendRoleSyncLog(embed) {
        try {
            const serverLink = this.db.getServerLink();
            if (!serverLink) return;

            const mainChannelId = this.db.getChannel(serverLink.mainServerId, 'roleSyncLog');
            if (!mainChannelId) return;

            const channel = await this.client.channels.fetch(mainChannelId).catch(() => null);
            if (!channel) return;

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('[Error Handler] Failed to send role sync log:', error);
        }
    }
}

module.exports = ErrorHandler;
