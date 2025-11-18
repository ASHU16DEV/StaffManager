const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client, db, errorHandler) {
        try {
            const serverLink = db.getServerLink();
            if (!serverLink) return;

            const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

            if (newMember.guild.id === serverLink.staffServerId) {
                const mainGuild = await client.guilds.fetch(serverLink.mainServerId).catch(() => null);
                if (!mainGuild) return;

                const mainMember = await mainGuild.members.fetch(newMember.id).catch(() => null);
                if (!mainMember) return;

                for (const [roleId, role] of addedRoles) {
                    const mainRoleId = db.getMainRoleFromStaffRole(roleId);
                    if (mainRoleId) {
                        const mainRole = await mainGuild.roles.fetch(mainRoleId).catch(() => null);
                        if (mainRole && !mainMember.roles.cache.has(mainRoleId)) {
                            await mainMember.roles.add(mainRole).catch(console.error);

                            const logEmbed = new EmbedBuilder()
                                .setColor('#00FF00')
                                .setTitle(`${emojis.sync} Role Added - Synced`)
                                .setDescription(`Role synchronized from staff server to main server`)
                                .addFields(
                                    { name: 'User', value: `${newMember.user} (${newMember.user.tag})`, inline: false },
                                    { name: 'Staff Server Role', value: `${role.name}`, inline: true },
                                    { name: 'Main Server Role', value: `${mainRole.name}`, inline: true }
                                )
                                .setFooter({ text: client.config.settings.footerText })
                                .setTimestamp();

                            await errorHandler.sendRoleSyncLog(logEmbed);
                        }
                    }
                }

                for (const [roleId, role] of removedRoles) {
                    const mainRoleId = db.getMainRoleFromStaffRole(roleId);
                    if (mainRoleId) {
                        const mainRole = await mainGuild.roles.fetch(mainRoleId).catch(() => null);
                        if (mainRole && mainMember.roles.cache.has(mainRoleId)) {
                            await mainMember.roles.remove(mainRole).catch(console.error);

                            const logEmbed = new EmbedBuilder()
                                .setColor('#FFA500')
                                .setTitle(`${emojis.sync} Role Removed - Synced`)
                                .setDescription(`Role synchronized from staff server to main server`)
                                .addFields(
                                    { name: 'User', value: `${newMember.user} (${newMember.user.tag})`, inline: false },
                                    { name: 'Staff Server Role', value: `${role.name}`, inline: true },
                                    { name: 'Main Server Role', value: `${mainRole.name}`, inline: true }
                                )
                                .setFooter({ text: client.config.settings.footerText })
                                .setTimestamp();

                            await errorHandler.sendRoleSyncLog(logEmbed);
                        }
                    }
                }
            } else if (newMember.guild.id === serverLink.mainServerId) {
                const staffGuild = await client.guilds.fetch(serverLink.staffServerId).catch(() => null);
                if (!staffGuild) return;

                const staffMember = await staffGuild.members.fetch(newMember.id).catch(() => null);
                if (!staffMember) return;

                for (const [roleId, role] of addedRoles) {
                    const staffRoleId = db.getStaffRoleFromMainRole(roleId);
                    if (staffRoleId) {
                        const staffRole = await staffGuild.roles.fetch(staffRoleId).catch(() => null);
                        if (staffRole && !staffMember.roles.cache.has(staffRoleId)) {
                            await staffMember.roles.add(staffRole).catch(console.error);

                            const logEmbed = new EmbedBuilder()
                                .setColor('#00FF00')
                                .setTitle(`${emojis.sync} Role Added - Synced`)
                                .setDescription(`Role synchronized from main server to staff server`)
                                .addFields(
                                    { name: 'User', value: `${newMember.user} (${newMember.user.tag})`, inline: false },
                                    { name: 'Main Server Role', value: `${role.name}`, inline: true },
                                    { name: 'Staff Server Role', value: `${staffRole.name}`, inline: true }
                                )
                                .setFooter({ text: client.config.settings.footerText })
                                .setTimestamp();

                            await errorHandler.sendRoleSyncLog(logEmbed);
                        }
                    }
                }

                for (const [roleId, role] of removedRoles) {
                    const staffRoleId = db.getStaffRoleFromMainRole(roleId);
                    if (staffRoleId) {
                        const staffRole = await staffGuild.roles.fetch(staffRoleId).catch(() => null);
                        if (staffRole && staffMember.roles.cache.has(staffRoleId)) {
                            await staffMember.roles.remove(staffRole).catch(console.error);

                            const logEmbed = new EmbedBuilder()
                                .setColor('#FFA500')
                                .setTitle(`${emojis.sync} Role Removed - Synced`)
                                .setDescription(`Role synchronized from main server to staff server`)
                                .addFields(
                                    { name: 'User', value: `${newMember.user} (${newMember.user.tag})`, inline: false },
                                    { name: 'Main Server Role', value: `${role.name}`, inline: true },
                                    { name: 'Staff Server Role', value: `${staffRole.name}`, inline: true }
                                )
                                .setFooter({ text: client.config.settings.footerText })
                                .setTimestamp();

                            await errorHandler.sendRoleSyncLog(logEmbed);
                        }
                    }
                }
            }

        } catch (error) {
            await errorHandler.handleError(error, {
                event: 'guildMemberUpdate',
                guild: newMember.guild.name,
                user: newMember.user.tag
            });
        }
    },
};
