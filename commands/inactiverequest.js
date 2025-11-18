const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { hasStaffCommandPermission } = require('../utils/permissions');
const EmbedFactory = require('../utils/embedFactory');
const DurationParser = require('../utils/durationParser');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inactiverequest')
        .setDescription('Request inactive/absent time')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for being inactive')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 2h, 30m, 5d, 1month)')
                .setRequired(true)),

    async execute(interaction, client, db, errorHandler) {
        try {
            const embedFactory = new EmbedFactory(client.config);

            if (!hasStaffCommandPermission(interaction.member, db)) {
                const embed = embedFactory.error('Permission Denied', 'You don\'t have permission to use this command.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const reason = interaction.options.getString('reason');
            const durationString = interaction.options.getString('duration');

            let durationMs;
            try {
                durationMs = DurationParser.parse(durationString);
            } catch (parseError) {
                const embed = embedFactory.error('Invalid Duration', parseError.message + '\n\nExamples: `2h`, `30m`, `5d`, `1month`, `2d 3h`');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const inactiveChannelId = db.getChannel(interaction.guild.id, 'inactiveRequest');
            
            if (!inactiveChannelId) {
                const embed = embedFactory.error('Channel Not Set', 'Inactive request channel is not set. Contact an administrator.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const inactiveChannel = await client.channels.fetch(inactiveChannelId).catch(() => null);
            
            if (!inactiveChannel) {
                const embed = embedFactory.error('Channel Not Found', 'Inactive request channel not found. Contact an administrator.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const formattedDuration = DurationParser.format(durationMs);
            const requestEmbed = embedFactory.inactiveRequest(
                `${interaction.user}`,
                formattedDuration,
                reason
            );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`inactive_accept_${interaction.user.id}_${durationMs}`)
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji(emojis.accept),
                    new ButtonBuilder()
                        .setCustomId(`inactive_deny_${interaction.user.id}`)
                        .setLabel('Deny')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji(emojis.deny)
                );

            const message = await inactiveChannel.send({ embeds: [requestEmbed], components: [row] });

            db.addInactiveRequest({
                messageId: message.id,
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                reason: reason,
                duration: durationMs,
                timestamp: Date.now()
            });

            const replyEmbed = embedFactory.success(
                'Request Submitted',
                'Your inactive request has been submitted and is pending approval.'
            );

            await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'inactiverequest',
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
