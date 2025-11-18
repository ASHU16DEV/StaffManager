const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embedFactory');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('strikelimit')
        .setDescription('Set or view the strike limit')
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('The maximum number of strikes before auto-kick')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, db, errorHandler) {
        try {
            const embedFactory = new EmbedFactory(client.config);
            
            // Only owner can set strike limit
            const isOwner = interaction.guild.ownerId === interaction.user.id;

            if (!isOwner) {
                const embed = embedFactory.error('Permission Denied', 'Only the server owner can change the strike limit.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const limit = interaction.options.getInteger('limit');

            if (!limit) {
                // Show current limit
                const currentLimit = db.getStrikeLimit(interaction.guild.id);
                const embed = embedFactory.info('Current Strike Limit', `The current strike limit is **${currentLimit}**`);
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Set new limit
            db.setStrikeLimit(interaction.guild.id, limit);

            const embed = embedFactory.success('Strike Limit Updated', `Strike limit has been set to **${limit}**`);
            embed.addFields(
                { name: 'New Limit', value: limit.toString(), inline: true },
                { name: 'Updated By', value: `${interaction.user}`, inline: true }
            );
            embed.setFooter({ text: 'Users reaching this limit will be auto-kicked from staff server' });

            await interaction.reply({ embeds: [embed] });

            // Log to strike channel
            const strikeChannelId = db.getStrikeChannel(interaction.guild.id);
            if (strikeChannelId) {
                const strikeChannel = await interaction.guild.channels.fetch(strikeChannelId).catch(() => null);
                if (strikeChannel) {
                    await strikeChannel.send({ embeds: [embed] });
                }
            }

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'strikelimit',
                user: interaction.user.tag,
                guild: interaction.guild?.name
            });
        }
    }
};
