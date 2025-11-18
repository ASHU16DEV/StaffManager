const { SlashCommandBuilder } = require('discord.js');
const { hasManagerPermission } = require('../utils/permissions');
const EmbedFactory = require('../utils/embedFactory');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staffstats')
        .setDescription('View staff activity statistics (Manager/Owner only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('View specific user stats (optional)')
                .setRequired(false)),

    async execute(interaction, client, db, errorHandler) {
        try {
            const embedFactory = new EmbedFactory(client.config);

            if (!hasManagerPermission(interaction.member, db)) {
                const embed = embedFactory.error('Permission Denied', 'Only managers and owners can use this command.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            const serverLink = db.getServerLink();

            if (!serverLink) {
                const embed = embedFactory.warning('No Server Link', 'Server link is not configured.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const mainGuild = await client.guilds.fetch(serverLink.mainServerId).catch(() => null);
            if (!mainGuild) {
                const embed = embedFactory.error('Server Error', 'Could not fetch main server.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (targetUser) {
                const stats = db.getActivityStats(targetUser.id);
                const member = await mainGuild.members.fetch(targetUser.id).catch(() => null);

                if (!member) {
                    const embed = embedFactory.error('User Not Found', 'User not found in the main server.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const lastActive = stats.lastActive 
                    ? `<t:${Math.floor(stats.lastActive / 1000)}:R>`
                    : '*Never*';

                const embed = embedFactory.createBase()
                    .setColor(embedFactory.colors.info)
                    .setTitle(`${emojis.staff} Staff Statistics`)
                    .setDescription(`Statistics for ${targetUser}`)
                    .addFields(
                        { name: `${emojis.log} Messages`, value: `${stats.messages}`, inline: true },
                        { name: `${emojis.settings} Commands`, value: `${stats.commands}`, inline: true },
                        { name: `${emojis.shield} Actions`, value: `${stats.actions}`, inline: true },
                        { name: `${emojis.time} Last Active`, value: lastActive, inline: false }
                    );

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else {
                const allStats = db.getAllActivityStats();
                const staffRoles = db.getStaffRoles(mainGuild.id);

                const staffMembers = [];
                for (const roleId of staffRoles) {
                    const role = await mainGuild.roles.fetch(roleId).catch(() => null);
                    if (!role) continue;
                    
                    role.members.forEach(member => {
                        if (!member.user.bot && !staffMembers.some(m => m.id === member.id)) {
                            staffMembers.push(member);
                        }
                    });
                }

                const statsArray = staffMembers
                    .map(member => {
                        const stats = allStats[member.id] || { messages: 0, commands: 0, actions: 0, lastActive: null };
                        return {
                            member,
                            ...stats,
                            total: stats.messages + stats.commands + stats.actions
                        };
                    })
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 15);

                const embed = embedFactory.createBase()
                    .setColor(embedFactory.colors.primary)
                    .setTitle(`${emojis.staff} Staff Activity Leaderboard`)
                    .setDescription(`Top ${statsArray.length} most active staff members in ${mainGuild.name}`);

                let leaderboard = '';
                statsArray.forEach((stat, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    leaderboard += `${medal} ${stat.member} - **${stat.total}** total (${stat.messages}M/${stat.commands}C/${stat.actions}A)\n`;
                });

                if (leaderboard) {
                    embed.addFields({
                        name: `${emojis.list} Leaderboard`,
                        value: leaderboard,
                        inline: false
                    });
                } else {
                    embed.setDescription('No activity data available yet.');
                }

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'staffstats',
                user: interaction.user.tag,
                guild: interaction.guild?.name
            });
            
            const embedFactory = new EmbedFactory(client.config);
            const errorEmbed = embedFactory.error('Command Error', 'An error occurred while executing this command.');

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};
