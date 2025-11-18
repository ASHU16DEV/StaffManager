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
        .setName('strikehistory')
        .setDescription('View strike history for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view strike history for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, client, db, errorHandler) {
        try {
            const user = interaction.options.getUser('user');

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
                        'Only server owner and managers can view strike history.',
                        'error'
                    )],
                    ephemeral: true
                });
            }

            const allStrikes = db.getAllUserStrikesHistory(interaction.guild.id, user.id);
            const activeStrikes = db.getUserStrikes(interaction.guild.id, user.id);
            const strikeLimit = db.getStrikeLimit(interaction.guild.id);

            if (allStrikes.length === 0) {
                return await interaction.reply({
                    embeds: [createEmbed(
                        `${emojis.success} No Strikes`,
                        `${user} has no strike history.`,
                        'success'
                    )],
                    ephemeral: true
                });
            }

            const embed = createEmbed(
                `${emojis.info} Strike History`,
                `Showing complete strike history for ${user}`,
                'info'
            );

            embed.addFields({
                name: `${emojis.warning} Current Status`,
                value: `Active Strikes: **${activeStrikes.length}/${strikeLimit}**\nTotal Strikes (All Time): **${allStrikes.length}**`,
                inline: false
            });

            // Sort strikes by date (newest first)
            const sortedStrikes = allStrikes.sort((a, b) => b.addedAt - a.addedAt);

            // Split into active and expired
            const active = sortedStrikes.filter(s => s.endTime > Date.now());
            const expired = sortedStrikes.filter(s => s.endTime <= Date.now());

            // Show active strikes
            if (active.length > 0) {
                const activeList = active.slice(0, 5).map((s, index) => {
                    const addedBy = `<@${s.addedBy}>`;
                    const added = `<t:${Math.floor(s.addedAt / 1000)}:R>`;
                    const expires = `<t:${Math.floor(s.endTime / 1000)}:R>`;
                    return `**${index + 1}.** ${s.reason}\n└ Added by ${addedBy} ${added}\n└ Expires ${expires} | ID: \`${s.id}\``;
                }).join('\n\n');

                embed.addFields({
                    name: `${emojis.error} Active Strikes (${active.length})`,
                    value: activeList + (active.length > 5 ? `\n\n*...and ${active.length - 5} more*` : ''),
                    inline: false
                });
            }

            // Show expired strikes
            if (expired.length > 0) {
                const expiredList = expired.slice(0, 5).map((s, index) => {
                    const addedBy = `<@${s.addedBy}>`;
                    const added = `<t:${Math.floor(s.addedAt / 1000)}:d>`;
                    const expired = `<t:${Math.floor(s.endTime / 1000)}:d>`;
                    return `**${index + 1}.** ${s.reason}\n└ Added by ${addedBy} on ${added}\n└ Expired on ${expired}`;
                }).join('\n\n');

                embed.addFields({
                    name: `${emojis.success} Expired Strikes (${expired.length})`,
                    value: expiredList + (expired.length > 5 ? `\n\n*...and ${expired.length - 5} more*` : ''),
                    inline: false
                });
            }

            embed.setFooter({ text: `Use /strikeremove to remove specific strikes` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'strikehistory',
                user: interaction.user.tag,
                guild: interaction.guild?.name
            });
        }
    }
};
