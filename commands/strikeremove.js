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
        .setName('strikeremove')
        .setDescription('Remove a specific strike or all strikes from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose strike to remove')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('strike_id')
                .setDescription('Specific strike ID to remove (leave empty to remove all)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, client, db, errorHandler) {
        try {
            const user = interaction.options.getUser('user');
            const strikeId = interaction.options.getString('strike_id');

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
                        'Only server owner and managers can remove strikes.',
                        'error'
                    )],
                    ephemeral: true
                });
            }

            let removedCount = 0;
            let embed;

            if (strikeId) {
                // Remove specific strike
                const strike = db.removeStrike(interaction.guild.id, strikeId);
                if (!strike) {
                    return await interaction.reply({
                        embeds: [createEmbed(
                            `${emojis.error} Strike Not Found`,
                            `No strike found with ID: \`${strikeId}\``,
                            'error'
                        )],
                        ephemeral: true
                    });
                }

                if (strike.userId !== user.id) {
                    return await interaction.reply({
                        embeds: [createEmbed(
                            `${emojis.error} Invalid Strike`,
                            `This strike does not belong to ${user}`,
                            'error'
                        )],
                        ephemeral: true
                    });
                }

                removedCount = 1;
                embed = createEmbed(
                    `${emojis.success} Strike Removed`,
                    `Strike removed from ${user}`,
                    'success'
                );
                embed.addFields(
                    { name: 'Strike ID', value: `\`${strikeId}\``, inline: true },
                    { name: 'Reason', value: strike.reason, inline: false },
                    { name: 'Removed By', value: `${interaction.user}`, inline: true }
                );
            } else {
                // Remove all strikes
                removedCount = db.removeAllUserStrikes(interaction.guild.id, user.id);
                
                if (removedCount === 0) {
                    return await interaction.reply({
                        embeds: [createEmbed(
                            `${emojis.info} No Strikes`,
                            `${user} has no strikes to remove.`,
                            'info'
                        )],
                        ephemeral: true
                    });
                }

                embed = createEmbed(
                    `${emojis.success} All Strikes Removed`,
                    `All strikes removed from ${user}`,
                    'success'
                );
                embed.addFields(
                    { name: 'Strikes Removed', value: removedCount.toString(), inline: true },
                    { name: 'Removed By', value: `${interaction.user}`, inline: true }
                );
            }

            await interaction.reply({ embeds: [embed] });

            // Log to strike channel
            const strikeChannelId = db.getStrikeChannel(interaction.guild.id);
            if (strikeChannelId) {
                const strikeChannel = await interaction.guild.channels.fetch(strikeChannelId).catch(() => null);
                if (strikeChannel) {
                    await strikeChannel.send({ embeds: [embed] });
                }
            }

            // Send DM to user
            try {
                const dmEmbed = createEmbed(
                    `${emojis.success} Strike Removed`,
                    `Your strike${removedCount > 1 ? 's have' : ' has'} been removed in **${interaction.guild.name}**`,
                    'success'
                );
                dmEmbed.addFields(
                    { name: 'Strikes Removed', value: removedCount.toString(), inline: true },
                    { name: 'Removed By', value: interaction.user.tag, inline: true }
                );

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled
            }

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'strikeremove',
                user: interaction.user.tag,
                guild: interaction.guild?.name
            });
        }
    }
};
