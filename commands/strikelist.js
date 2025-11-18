const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const EmbedFactory = require('../utils/embedFactory');
const emojis = require('../emojis');

// Helper function to create embeds
function createEmbed(title, description, type, config) {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    return new EmbedBuilder()
        .setColor(colors[type] || colors.info)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: config?.settings?.footerText || 'Staff Management Bot | Made by ASHU16' })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('strikelist')
        .setDescription('View all active strikes in the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, client, db, errorHandler) {
        try {
            // Check if user is manager or owner
            const serverData = db.getServerData(interaction.guild.id);
            const isOwner = interaction.guild.ownerId === interaction.user.id;
            const isManager = serverData.managerRoles.some(roleId => 
                interaction.member.roles.cache.has(roleId)
            );

            if (!isOwner && !isManager) {
                return await interaction.reply({
                    embeds: [createEmbed(
                        `${emojis.error} Permission Denied`,
                        'Only server owner and managers can view strikes.',
                        'error'
                    )],
                    ephemeral: true
                });
            }

            const allStrikes = db.getAllStrikes(interaction.guild.id);
            const strikeLimit = db.getStrikeLimit(interaction.guild.id);

            if (allStrikes.length === 0) {
                return await interaction.reply({
                    embeds: [createEmbed(
                        `${emojis.success} No Active Strikes`,
                        'There are currently no active strikes.',
                        'success'
                    )],
                    ephemeral: true
                });
            }

            // Group strikes by user
            const strikesByUser = {};
            for (const strike of allStrikes) {
                if (!strikesByUser[strike.userId]) {
                    strikesByUser[strike.userId] = [];
                }
                strikesByUser[strike.userId].push(strike);
            }

            const embed = createEmbed(
                `${emojis.warning} Active Strikes`,
                `Showing all active strikes in the server\nStrike Limit: **${strikeLimit}**`,
                'warning'
            );

            for (const [userId, strikes] of Object.entries(strikesByUser)) {
                const strikeList = strikes.map((s, index) => {
                    const expiry = `<t:${Math.floor(s.endTime / 1000)}:R>`;
                    return `**${index + 1}.** ${s.reason}\n└ Expires: ${expiry} | ID: \`${s.id}\``;
                }).join('\n\n');

                embed.addFields({
                    name: `<@${userId}> - ${strikes.length}/${strikeLimit} Strikes`,
                    value: strikeList,
                    inline: false
                });
            }

            embed.setFooter({ text: `Total: ${allStrikes.length} active strike${allStrikes.length !== 1 ? 's' : ''}` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'strikelist',
                user: interaction.user.tag,
                guild: interaction.guild?.name
            });
        }
    }
};
