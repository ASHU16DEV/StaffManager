const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client, db, errorHandler) {
        try {
            const serverLink = db.getServerLink();
            if (!serverLink) return;

            if (member.guild.id === serverLink.staffServerId) {
                const mainGuild = await client.guilds.fetch(serverLink.mainServerId).catch(() => null);
                if (!mainGuild) return;

                const mainMember = await mainGuild.members.fetch(member.id).catch(() => null);
                if (!mainMember) return;

                const roleMaps = db.getRoleMaps();
                const rolesToRemove = [];

                for (const map of roleMaps) {
                    if (mainMember.roles.cache.has(map.mainRoleId)) {
                        const mainRole = await mainGuild.roles.fetch(map.mainRoleId).catch(() => null);
                        if (mainRole) {
                            await mainMember.roles.remove(mainRole).catch(console.error);
                            rolesToRemove.push(mainRole.name);
                        }
                    }
                }

                if (rolesToRemove.length > 0) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle(`${emojis.sync} Member Left/Kicked - Roles Synced`)
                        .setDescription(`Member left/kicked from staff server, roles removed from main server`)
                        .addFields(
                            { name: 'User', value: `${member.user} (${member.user.tag})`, inline: false },
                            { name: 'Roles Removed', value: rolesToRemove.join(', '), inline: false }
                        )
                        .setFooter({ text: client.config.settings.footerText })
                        .setTimestamp();

                    await errorHandler.sendRoleSyncLog(logEmbed);
                }
            } else if (member.guild.id === serverLink.mainServerId) {
                const staffGuild = await client.guilds.fetch(serverLink.staffServerId).catch(() => null);
                if (!staffGuild) return;

                const staffMember = await staffGuild.members.fetch(member.id).catch(() => null);
                if (!staffMember) return;

                const roleMaps = db.getRoleMaps();
                const rolesToRemove = [];

                for (const map of roleMaps) {
                    if (staffMember.roles.cache.has(map.staffRoleId)) {
                        const staffRole = await staffGuild.roles.fetch(map.staffRoleId).catch(() => null);
                        if (staffRole) {
                            await staffMember.roles.remove(staffRole).catch(console.error);
                            rolesToRemove.push(staffRole.name);
                        }
                    }
                }

                if (rolesToRemove.length > 0) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle(`${emojis.sync} Member Left/Kicked - Roles Synced`)
                        .setDescription(`Member left/kicked from main server, roles removed from staff server`)
                        .addFields(
                            { name: 'User', value: `${member.user} (${member.user.tag})`, inline: false },
                            { name: 'Roles Removed', value: rolesToRemove.join(', '), inline: false }
                        )
                        .setFooter({ text: client.config.settings.footerText })
                        .setTimestamp();

                    await errorHandler.sendRoleSyncLog(logEmbed);
                }
            }

        } catch (error) {
            await errorHandler.handleError(error, {
                event: 'guildMemberRemove',
                guild: member.guild.name,
                user: member.user.tag
            });
        }
    },
};
