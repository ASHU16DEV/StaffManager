const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolesynclogchannel')
        .setDescription('Set the role sync log channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel for role sync logs')
                .setRequired(true)),

    async execute(interaction, client, db, errorHandler) {
        try {
            const channel = interaction.options.getChannel('channel');

            db.setChannel(interaction.guild.id, 'roleSyncLog', channel.id);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`${emojis.success} Channel Set`)
                .setDescription(`${channel} has been set as the role sync log channel.`)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'rolesynclogchannel',
                user: interaction.user.tag,
                guild: interaction.guild.name
            });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`${emojis.error} An error occurred while executing this command.`)
                .setFooter({ text: client.config.settings.footerText });

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};
