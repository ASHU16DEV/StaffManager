async function processExpiredInactiveMembers(client, db, errorHandler) {
    try {
        if (!db || typeof db.getAllInactiveMembers !== 'function') {
            console.error('[Task Processor] Database object is invalid or getAllInactiveMembers function not found');
            return 0;
        }

        const inactiveMembers = db.getAllInactiveMembers();
        if (!inactiveMembers || !Array.isArray(inactiveMembers)) {
            return 0;
        }

        const now = Date.now();
        let processedCount = 0;

        for (const inactiveMember of inactiveMembers) {
            if (inactiveMember.endTime && inactiveMember.endTime <= now) {
                try {
                    const guild = await client.guilds.fetch(inactiveMember.guildId).catch(() => null);
                    if (!guild) {
                        db.removeInactiveMember(inactiveMember.userId, inactiveMember.guildId);
                        continue;
                    }

                    const member = await guild.members.fetch(inactiveMember.userId).catch(() => null);
                    if (!member) {
                        db.removeInactiveMember(inactiveMember.userId, inactiveMember.guildId);
                        continue;
                    }

                    const inactiveRoleId = db.getInactiveRole(guild.id);
                    let roleRemoved = false;
                    
                    if (inactiveRoleId) {
                        const inactiveRole = await guild.roles.fetch(inactiveRoleId).catch(() => null);
                        if (inactiveRole && member.roles.cache.has(inactiveRoleId)) {
                            await member.roles.remove(inactiveRole);
                            roleRemoved = true;
                            console.log(`[Task Processor] ✅ Removed inactive role from ${member.user.tag} in ${guild.name}`);
                        }
                    }

                    if (roleRemoved) {
                        try {
                            const { EmbedBuilder } = require('discord.js');
                            const emojis = require('../emojis');
                            
                            const DurationParser = require('./durationParser');
                            const duration = inactiveMember.endTime - inactiveMember.timestamp;
                            const formattedDuration = DurationParser.format(duration);
                            
                            const dmEmbed = new EmbedBuilder()
                                .setColor('#10B981')
                                .setTitle(`${emojis.accept} Inactive Period Ended`)
                                .setDescription(`Your inactive period in **${guild.name}** has ended and your inactive role has been automatically removed.\n\n**Duration:** ${formattedDuration}\n**Status:** You are now active again!`)
                                .addFields(
                                    { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                                    { name: `${emojis.info} Welcome Back!`, value: 'Your inactive status has been cleared. You can resume your normal staff duties.', inline: false }
                                )
                                .setFooter({ text: client.config.settings.footerText })
                                .setTimestamp();

                            await member.user.send({ embeds: [dmEmbed] }).catch(() => {
                                console.log(`[Task Processor] Could not send DM to ${member.user.tag} about inactive period ending`);
                            });
                        } catch (dmError) {
                            console.log(`[Task Processor] Error sending DM notification: ${dmError.message}`);
                        }
                    }

                    db.removeInactiveMember(inactiveMember.userId, inactiveMember.guildId);
                    processedCount++;
                } catch (error) {
                    console.error('[Task Processor] Error processing expired inactive member:', error);
                    if (errorHandler && typeof errorHandler.handleError === 'function') {
                        await errorHandler.handleError(error, {
                            task: 'processExpiredInactiveMembers',
                            userId: inactiveMember.userId,
                            guildId: inactiveMember.guildId
                        });
                    }
                }
            }
        }

        if (processedCount > 0) {
            console.log(`[Task Processor] ✅ Processed ${processedCount} expired inactive member(s)`);
        }

        return processedCount;
    } catch (error) {
        console.error('[Task Processor] Error in processExpiredInactiveMembers:', error);
        if (errorHandler && typeof errorHandler.handleError === 'function') {
            await errorHandler.handleError(error, { task: 'processExpiredInactiveMembers' });
        }
        return 0;
    }
}

module.exports = {
    processExpiredInactiveMembers
};
