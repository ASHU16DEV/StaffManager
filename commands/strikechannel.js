const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
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
        .setName('strikechannel')
        .setDescription('Set the strike log channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel for strike logs')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, db, errorHandler) {
        try {
            // Only owner can set strike channel
            const isOwner = interaction.guild.ownerId === interaction.user.id;

            if (!isOwner) {
                return await interaction.reply({
                    embeds: [createEmbed(
                        `${emojis.error} Permission Denied`,
                        'Only the server owner can set the strike channel.',
                        'error'
                    )],
                    ephemeral: true
                });
            }

            const channel = interaction.options.getChannel('channel');

            // Set strike channel
            db.setStrikeChannel(interaction.guild.id, channel.id);

            const embed = createEmbed(
                `${emojis.success} Strike Channel Set`,
                `Strike logs will now be sent to ${channel}`,
                'success'
            );
            embed.addFields(
                { name: 'Channel', value: `${channel}`, inline: true },
                { name: 'Set By', value: `${interaction.user}`, inline: true }
            );

            await interaction.reply({ embeds: [embed] });

            // Send test message to the channel
            const testEmbed = createEmbed(
                `${emojis.success} Strike Channel Configured`,
                'This channel will now receive all strike-related logs.',
                'success'
            );
            testEmbed.addFields(
                { name: 'Logged Events', value: '• Strike additions\n• Strike removals\n• Strike limit updates\n• Auto-kicks from strike limit', inline: false }
            );

            await channel.send({ embeds: [testEmbed] });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'strikechannel',
                user: interaction.user.tag,
                guild: interaction.guild?.name
            });
        }
    }
};
